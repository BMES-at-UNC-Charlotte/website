import { NextResponse } from "next/server";
import { env } from "@/env";
import { handleDonationWebhook } from "@/server/donation-payments";
import { getStripe } from "@/server/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook signing is not configured" },
      { status: 400 },
    );
  }
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }
  try {
    await handleDonationWebhook(event);
  } catch (error) {
    console.error("Donation webhook failed", error);
    return NextResponse.json(
      { error: "Payment status could not be saved" },
      { status: 500 },
    );
  }
  return NextResponse.json({ received: true });
}
