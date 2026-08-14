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

export const getAllowedPriceIds = () => {
  const priceIds = [
    env.STRIPE_TIER_1_PRICE_ID,
    env.STRIPE_TIER_2_PRICE_ID,
    env.STRIPE_TIER_3_PRICE_ID,
  ];

  if (priceIds.some((priceId) => !priceId)) {
    throw new Error("All three Stripe tier Price IDs must be configured");
  }

  return priceIds as [string, string, string];
};

export const getRegistrationTiers = async () => {
  const stripe = getStripe();
  const prices = await Promise.all(
    getAllowedPriceIds().map((priceId) =>
      stripe.prices.retrieve(priceId, { expand: ["product"] }),
    ),
  );

  return prices.map((price, index) => {
    if (
      !price.active ||
      price.type !== "one_time" ||
      price.unit_amount === null ||
      typeof price.product === "string" ||
      price.product.deleted
    ) {
      throw new Error(
        `Stripe tier ${index + 1} is not an active one-time price`,
      );
    }

    return {
      description: price.product.description,
      name: price.product.name,
      priceId: price.id,
      productId: price.product.id,
      unitAmount: price.unit_amount,
      currency: price.currency,
    };
  });
};

export const getAdditionalRepresentativePrice = async () => {
  if (!env.STRIPE_ADDITIONAL_REP_PRICE_ID) {
    throw new Error(
      "The additional representative Stripe Price is not configured",
    );
  }

  const price = await getStripe().prices.retrieve(
    env.STRIPE_ADDITIONAL_REP_PRICE_ID,
    { expand: ["product"] },
  );

  if (
    !price.active ||
    price.type !== "one_time" ||
    price.unit_amount === null ||
    typeof price.product === "string" ||
    price.product.deleted
  ) {
    throw new Error(
      "The additional representative Price is not an active one-time price",
    );
  }

  return {
    name: price.product.name,
    priceId: price.id,
    productId: price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
  };
};

export const getRegistrationConfiguration = async () => {
  const [tiers, additionalRepresentative] = await Promise.all([
    getRegistrationTiers(),
    getAdditionalRepresentativePrice(),
  ]);

  if (
    tiers.some((tier) => tier.currency !== additionalRepresentative.currency)
  ) {
    throw new Error("All registration Prices must use the same currency");
  }

  return { tiers, additionalRepresentative };
};

export const getRegistrationTier = async (priceId: string) => {
  const allowedPriceIds = getAllowedPriceIds();
  if (!allowedPriceIds.includes(priceId)) {
    throw new Error("The selected registration tier is not allowed");
  }

  const tiers = await getRegistrationTiers();
  const tier = tiers.find((candidate) => candidate.priceId === priceId);
  if (!tier) throw new Error("The selected registration tier is unavailable");
  return tier;
};
