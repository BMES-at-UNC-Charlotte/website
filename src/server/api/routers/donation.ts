import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";

import { donationCheckoutInput } from "@/lib/donation";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { getStripe } from "@/server/stripe";

function getRequestOrigin(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to determine the request origin.",
    });
  }

  const protocol =
    headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${protocol}://${host}`;
}

function donationIntegrationIdentifier() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(8);
  let suffix = "";
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length] ?? "a";
  }
  return `bmes-donate-${suffix}`;
}

export const donationRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(donationCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      let stripe: ReturnType<typeof getStripe>;
      try {
        stripe = getStripe();
      } catch {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Donation checkout is not configured yet.",
        });
      }

      const origin = getRequestOrigin(ctx.headers);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        submit_type: "donate",
        origin_context: "web",
        integration_identifier: donationIntegrationIdentifier(),
        success_url: `${origin}/sponsors?status=success`,
        cancel_url: `${origin}/sponsors?status=canceled`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: input.amountCents,
              product_data: {
                name: "Charlotte BMES donation",
                description:
                  "Donation for the Biomedical Engineering Society at UNC Charlotte",
              },
            },
          },
        ],
        metadata: {
          source: "sponsors",
        },
        payment_intent_data: {
          description: "Charlotte BMES donation",
          metadata: {
            source: "sponsors",
          },
        },
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe did not return a checkout URL.",
        });
      }

      return { url: session.url };
    }),
});
