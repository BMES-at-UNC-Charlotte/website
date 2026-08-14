import { NextResponse } from "next/server";

import { env } from "@/env";
import {
  promoteAcceptedAttempt,
  recordFailedAttempt,
} from "@/server/registration-payments";
import { getStripe } from "@/server/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook signing is not configured" },
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
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid webhook signature",
      },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "payment_intent.processing":
    case "payment_intent.succeeded":
      await promoteAcceptedAttempt(event.data.object);
      break;
    case "payment_intent.canceled":
    case "payment_intent.payment_failed":
      await recordFailedAttempt(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
