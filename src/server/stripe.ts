import "server-only";

import Stripe from "stripe";

import { env } from "@/env";

let stripeClient: Stripe | undefined;

export const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripeClient;
};
