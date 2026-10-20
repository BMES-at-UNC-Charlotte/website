import type Stripe from "stripe";
import { z } from "zod";

export const sponsorshipPriceIdsSchema = z
  .array(
    z
      .string()
      .trim()
      .regex(
        /^price_[a-zA-Z0-9]+$/,
        "Enter a Stripe Price ID beginning with price_",
      ),
  )
  .max(50)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "Each price can only appear once",
  );

export type SponsorshipTier = {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  amount: number;
};

export function sponsorshipTierFromPrice(price: Stripe.Price): SponsorshipTier {
  if (
    !price.active ||
    price.type !== "one_time" ||
    price.currency !== "usd" ||
    price.billing_scheme !== "per_unit" ||
    price.custom_unit_amount ||
    price.transform_quantity ||
    price.unit_amount === null ||
    !Number.isSafeInteger(price.unit_amount) ||
    price.unit_amount < 100
  )
    throw new Error(
      "Choose an active, fixed, one-time USD price of at least $1.",
    );
  const product = price.product;
  if (typeof product === "string" || product.deleted || !product.active)
    throw new Error("The price must belong to an active product.");
  return {
    productId: product.id,
    priceId: price.id,
    name: product.name,
    description: product.description ?? "",
    amount: price.unit_amount,
  };
}

export function sortSponsorshipTiers(tiers: SponsorshipTier[]) {
  return [...tiers].sort(
    (a, b) =>
      a.amount - b.amount ||
      a.name.localeCompare(b.name) ||
      a.priceId.localeCompare(b.priceId),
  );
}

export const SPONSORSHIP_EMAIL = "unccbmes@gmail.com";
export const SPONSORSHIP_MAILTO = `mailto:${SPONSORSHIP_EMAIL}?subject=${encodeURIComponent("Charlotte BMES sponsorship inquiry")}`;
export const CUSTOM_SPONSORSHIP_MAILTO = `mailto:${SPONSORSHIP_EMAIL}?subject=${encodeURIComponent("Custom Charlotte BMES sponsorship")}`;
