import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCheckoutKey,
  donationCheckoutInput,
  parseDonationCents,
  sponsorshipFormSchema,
  sponsorDefaults,
} from "../src/lib/donation.ts";

const sponsor = {
  ...sponsorDefaults,
  companyName: "Test company",
  contactName: "Test contact",
  email: "test@example.com",
  phone: "7045550100",
};
const key = "f9fca2f9-6b73-4a28-bb8b-8c69b19cd324";

test("amounts preserve cents and enforce contribution limits", () => {
  for (const [input, expected] of [
    ["1", 100],
    ["$25.01", 2501],
    [" 10000.00 ", 1000000],
    ["01.05", 105],
  ])
    assert.equal(parseDonationCents(input), expected);
  for (const input of [
    "",
    "0",
    "-1",
    "0.99",
    "10000.01",
    "5.999",
    "1e3",
    "Infinity",
    "$$5",
    "1,00",
    "1 2",
    "25.",
  ])
    assert.equal(parseDonationCents(input), null, input);
});

test("sponsorship checkout accepts Price IDs and rejects custom and legacy tiers", () => {
  const base = {
    kind: "sponsorship",
    priceId: "price_Sponsor",
    sponsor,
    idempotencyKey: key,
  };
  assert.equal(donationCheckoutInput.safeParse(base).success, true);
  for (const priceId of [
    "custom",
    "bronze",
    "silver",
    "gold",
    "prod_Sponsor",
    "",
  ]) {
    assert.equal(
      donationCheckoutInput.safeParse({ ...base, priceId }).success,
      false,
    );
  }
  for (const changed of [
    { priceId: undefined },
    { sponsor: { ...sponsor, email: "bad" } },
    { sponsor: { ...sponsor, companyName: " " } },
  ])
    assert.equal(
      donationCheckoutInput.safeParse({ ...base, ...changed }).success,
      false,
    );
  assert.equal(
    donationCheckoutInput.safeParse({
      kind: "individual",
      amountCents: 100.5,
      idempotencyKey: key,
    }).success,
    false,
  );
});

test("registration rejects unsafe URLs and unsupported benefits", () => {
  const base = { ...sponsor, tier: "price_Sponsor" };
  assert.equal(sponsorshipFormSchema.safeParse(base).success, true);
  assert.equal(
    sponsorshipFormSchema.safeParse({ ...base, website: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    sponsorshipFormSchema.safeParse({
      ...base,
      preferences: ["guaranteed hiring"],
    }).success,
    false,
  );
});

test("checkout keys remain valid UUIDs on HTTP development previews", () => {
  const keys = Array.from({ length: 100 }, () => createCheckoutKey());
  assert.equal(new Set(keys).size, 100);
  for (const value of keys)
    assert.match(
      value,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});
