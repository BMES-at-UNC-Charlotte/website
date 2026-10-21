import "server-only";

import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { TRPCError } from "@trpc/server";

import { env } from "@/env";
import {
  MAX_LOGO_BYTES,
  PAYMENT_DISCLAIMER,
  type DonationCheckoutInput,
  type SponsorLogo,
} from "@/lib/donation";
import { db } from "@/server/db";
import { getStripe } from "@/server/stripe";
import { getSponsorshipTier } from "@/server/sponsorship-prices";

function siteOrigin(headers: Headers) {
  if (env.SITE_URL) return new URL(env.SITE_URL).origin;
  if (process.env.NODE_ENV === "production") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Contributions are currently unavailable. Please contact us for help.",
    });
  }
  const host =
    headers.get("x-forwarded-host") ?? headers.get("host") ?? "localhost:3000";
  const protocol =
    headers.get("x-forwarded-proto") ??
    (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  const url = new URL(`${protocol}://${host}`);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Invalid site URL");
  return url.origin;
}

function logoBytes(logo: SponsorLogo | undefined) {
  if (!logo) return undefined;
  const bytes = Buffer.from(logo.base64, "base64");
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (
    bytes.length > MAX_LOGO_BYTES ||
    !(
      (logo.contentType === "image/png" && png) ||
      (logo.contentType === "image/jpeg" && jpeg) ||
      (logo.contentType === "image/webp" && webp)
    )
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Choose a PNG, JPEG, or WebP logo up to 5 MB.",
    });
  }
  return bytes;
}

export async function createDonationCheckout(
  input: DonationCheckoutInput,
  headers: Headers,
) {
  const stripe = getStripe();
  const origin = siteOrigin(headers);
  const tier =
    input.kind === "sponsorship"
      ? await getSponsorshipTier(input.priceId)
      : undefined;
  const amount = input.kind === "individual" ? input.amountCents : tier!.amount;
  const logo = input.kind === "sponsorship" ? input.logo : undefined;
  const bytes = logoBytes(logo);
  const requestHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  const attempt = await db.donationCheckout.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {},
    create: {
      idempotencyKey: input.idempotencyKey,
      requestHash,
      amount,
      kind: input.kind,
      tier: tier?.productId,
      stripePriceId: tier?.priceId,
      sponsor: input.kind === "sponsorship" ? input.sponsor : undefined,
      logoName: logo?.name,
      logoContentType: logo?.contentType,
      logoData: bytes,
    },
  });
  if (
    attempt.requestHash !== requestHash ||
    attempt.amount !== amount ||
    attempt.stripePriceId !== (tier?.priceId ?? null)
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "Your registration has changed. Refresh the page and review your details.",
    });
  }
  if (attempt.stripeCheckoutSessionId) {
    const previous = await stripe.checkout.sessions.retrieve(
      attempt.stripeCheckoutSessionId,
    );
    if (previous.status === "open" && previous.url)
      return { url: previous.url };
    if (previous.status === "complete")
      return {
        url: `${origin}/sponsors/confirmation?session_id=${previous.id}`,
      };
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "This checkout is no longer available. Check your receipt or contact us for help.",
    });
  }
  const productName =
    input.kind === "individual"
      ? "Individual Supporter Donation"
      : "Employer & Corporate Sponsorship";
  const metadata = {
    source: "bmes-donation",
    donationCheckoutId: attempt.id,
    kind: input.kind,
    ...(tier ? { tier: tier.productId } : {}),
  };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      submit_type: input.kind === "individual" ? "donate" : "pay",
      payment_method_types: ["card"],
      custom_text: { submit: { message: PAYMENT_DISCLAIMER } },
      customer_email:
        input.kind === "sponsorship" ? input.sponsor.email : undefined,
      success_url: `${origin}/sponsors/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        input.kind === "individual"
          ? `${origin}/sponsors?status=canceled`
          : `${origin}/sponsors/register?tier=${tier!.priceId}&status=canceled`,
      line_items: tier
        ? [{ quantity: 1, price: tier.priceId }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: amount,
                product_data: {
                  name: productName,
                  description:
                    "A charitable contribution for parents, families, alumni, friends, and community members who would like to support our organization. Donations help fund student programs, educational activities, outreach events, professional development, supplies, and other organization initiatives.",
                },
              },
            },
          ],
      metadata,
      payment_intent_data: {
        metadata,
        ...(input.kind === "sponsorship"
          ? { receipt_email: input.sponsor.email }
          : {}),
      },
    },
    { idempotencyKey: `bmes-donation-${attempt.id}` },
  );
  await db.donationCheckout.update({
    where: { id: attempt.id },
    data: { stripeCheckoutSessionId: session.id },
  });
  if (session.status === "complete")
    return { url: `${origin}/sponsors/confirmation?session_id=${session.id}` };
  if (session.status !== "open" || !session.url)
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "This checkout is no longer available. Check your receipt or contact us for help.",
    });
  return { url: session.url };
}

// Both signed webhooks and the return page retrieve Stripe's current session.
// Re-reading it prevents late or duplicate events from reverting a paid record.
export async function synchronizeDonationSession(sessionId: string) {
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "resource_missing"
    )
      return null;
    throw error;
  }
  if (session.metadata?.source !== "bmes-donation") return null;
  const id = session.metadata.donationCheckoutId;
  if (!id) return null;
  const attempt = await db.donationCheckout.findUnique({ where: { id } });
  if (!attempt) return null;
  if (
    attempt.stripeCheckoutSessionId &&
    attempt.stripeCheckoutSessionId !== session.id
  )
    return null;
  if (
    session.amount_total !== attempt.amount ||
    session.currency !== attempt.currency
  )
    throw new Error("Donation payment amount mismatch");
  const intent =
    typeof session.payment_intent === "object" ? session.payment_intent : null;
  const status =
    session.payment_status === "paid"
      ? "SUCCEEDED"
      : intent?.status === "processing"
        ? "PROCESSING"
        : session.status === "expired"
          ? "EXPIRED"
          : intent?.status === "canceled" || intent?.last_payment_error
            ? "FAILED"
            : "PENDING";
  await db.donationCheckout.updateMany({
    where: { id: attempt.id, status: { not: "SUCCEEDED" } },
    data: {
      status,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : intent?.id,
    },
  });
  return {
    kind: attempt.kind,
    tier: attempt.tier,
    amount: attempt.amount,
    status: attempt.status === "SUCCEEDED" ? "SUCCEEDED" : status,
  };
}

export async function handleDonationWebhook(event: Stripe.Event) {
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ].includes(event.type)
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.source === "bmes-donation")
      await synchronizeDonationSession(session.id);
  }
}
