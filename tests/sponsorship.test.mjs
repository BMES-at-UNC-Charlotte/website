import assert from "node:assert/strict";
import { test } from "node:test";
import {
  sponsorshipTierFromPrice,
  sortSponsorshipTiers,
  sponsorshipPriceIdsSchema,
  CUSTOM_SPONSORSHIP_MAILTO,
} from "../src/lib/sponsorship.ts";

const price = (id = "price_Sponsor", amount = 25000) => ({
  id,
  active: true,
  type: "one_time",
  currency: "usd",
  billing_scheme: "per_unit",
  custom_unit_amount: null,
  transform_quantity: null,
  unit_amount: amount,
  product: {
    id: "prod_Sponsor",
    name: "Partner",
    active: true,
    description: "Partner benefits",
    default_price: "price_Different",
  },
});

test("the configured price supplies the amount even when it is not the product default", () => {
  assert.deepEqual(sponsorshipTierFromPrice(price()), {
    productId: "prod_Sponsor",
    priceId: "price_Sponsor",
    name: "Partner",
    description: "Partner benefits",
    amount: 25000,
  });
  const missingDescription = price();
  missingDescription.product.description = null;
  assert.equal(sponsorshipTierFromPrice(missingDescription).description, "");
});

test("inactive or unsupported prices and unavailable products cannot become paid tiers", () => {
  for (const override of [
    { active: false },
    { type: "recurring" },
    { currency: "eur" },
    { unit_amount: null },
    { unit_amount: 99 },
    { unit_amount: 100.1 },
    { billing_scheme: "tiered" },
    { custom_unit_amount: { enabled: true } },
    { transform_quantity: { divide_by: 2, round: "down" } },
    { product: "prod_Unexpanded" },
    { product: { id: "prod_Deleted", deleted: true } },
    { product: { ...price().product, active: false } },
  ])
    assert.throws(() => sponsorshipTierFromPrice({ ...price(), ...override }));
});

test("multiple prices for the same product remain separate and sort by amount", () => {
  const tiers = [
    price("price_High", 100000),
    price("price_Low", 25000),
    price("price_Mid", 50000),
    price("price_Extra", 75000),
  ].map(sponsorshipTierFromPrice);
  assert.deepEqual(
    sortSponsorshipTiers(tiers).map((tier) => tier.priceId),
    ["price_Low", "price_Mid", "price_Extra", "price_High"],
  );
  assert.equal(tiers[0].amount, 100000);
});

test("configuration accepts Price IDs, rejects duplicates and Product IDs; custom sponsorship is email only", () => {
  assert.equal(sponsorshipPriceIdsSchema.safeParse([]).success, true);
  assert.deepEqual(
    sponsorshipPriceIdsSchema.parse([" price_One ", "price_Two"]),
    ["price_One", "price_Two"],
  );
  for (const ids of [
    ["price_One", "price_One"],
    ["custom"],
    ["prod_One"],
    [""],
  ])
    assert.equal(sponsorshipPriceIdsSchema.safeParse(ids).success, false);
  assert.ok(
    CUSTOM_SPONSORSHIP_MAILTO.startsWith("mailto:unccbmes@gmail.com?subject="),
  );
});
