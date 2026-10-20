// Run the real payment and configuration code against in-memory Stripe/database
// adapters. No network requests or Stripe records are created.
import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";

const state = {};
globalThis.__bmesCheckoutTest = state;
const root = new URL("../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, next) {
    const mocks = {
      "server-only": "empty",
      "@/server/db": "db",
      "@/server/stripe": "stripe",
      "@/env": "env",
      "@/server/better-auth": "auth",
    };
    if (mocks[specifier])
      return { url: `bmes-mock:${mocks[specifier]}`, shortCircuit: true };
    if (specifier.startsWith("@/")) {
      const base = new URL(specifier.slice(2), root);
      const file = [".ts", ".js"]
        .map((ext) => new URL(base.href + ext))
        .find((url) => existsSync(url));
      if (file) return next(file.href, context);
    }
    if (specifier.endsWith("generated/prisma"))
      return next(specifier + "/index.js", context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith("bmes-mock:")) {
      const name = url.split(":")[1];
      const source =
        name === "empty"
          ? "export {}"
          : name === "stripe"
            ? "export const getStripe=()=>globalThis.__bmesCheckoutTest.stripe"
            : `export const ${name}=globalThis.__bmesCheckoutTest.${name}`;
      return { format: "module", source, shortCircuit: true };
    }
    return next(url, context);
  },
});

const price = (id, amount = 25000) => ({
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
    name: "Company partner",
    active: true,
    description: "Benefits",
    default_price: "price_Different",
  },
});
let saved, attempts, sessionParams, createdSessions, dbWrites;
state.env = { SITE_URL: "http://localhost:3001" };
state.auth = {};
state.db = {
  sponsorshipPrice: {
    findMany: async () => saved.map((priceId) => ({ priceId })),
    findUnique: async ({ where }) =>
      saved.includes(where.priceId) ? where : null,
    deleteMany: () => ({ operation: "delete" }),
    createMany: ({ data }) => ({ operation: "create", data }),
  },
  donationCheckout: {
    upsert: async ({ where, create }) => {
      dbWrites++;
      if (!attempts.has(where.idempotencyKey))
        attempts.set(where.idempotencyKey, {
          ...create,
          id: "attempt1",
          stripePriceId: create.stripePriceId ?? null,
        });
      return attempts.get(where.idempotencyKey);
    },
    update: async ({ data }) => {
      const value = [...attempts.values()][0];
      Object.assign(value, data);
    },
  },
  $transaction: async (operations) => {
    for (const operation of operations) {
      if (operation.operation === "delete") saved = [];
      else saved = operation.data.map((row) => row.priceId);
    }
  },
};
state.stripe = {
  prices: {
    retrieve: async (id) => {
      if (id === "price_Missing") throw new Error("Missing price");
      return price(id, id === "price_High" ? 100000 : 25000);
    },
  },
  checkout: {
    sessions: {
      create: async (params) => {
        createdSessions++;
        sessionParams = params;
        return { id: "cs_test_mock", url: "https://checkout.stripe.com/test" };
      },
      retrieve: async () => ({
        status: "open",
        url: "https://checkout.stripe.com/test",
      }),
    },
  },
};
const { createDonationCheckout } =
  await import("../src/server/donation-payments.ts");
const { getSponsorshipCatalog } =
  await import("../src/server/sponsorship-prices.ts");
const { sponsorshipRouter } =
  await import("../src/server/api/routers/sponsorship.ts");
const { donationCheckoutInput, sponsorDefaults } =
  await import("../src/lib/donation.ts");
const sponsor = {
  ...sponsorDefaults,
  companyName: "Company",
  contactName: "Contact",
  email: "test@example.com",
  phone: "7045550100",
};
const input = () =>
  donationCheckoutInput.parse({
    kind: "sponsorship",
    priceId: "price_Sponsor",
    sponsor,
    idempotencyKey: "f9fca2f9-6b73-4a28-bb8b-8c69b19cd324",
  });
const headers = new Headers();
const caller = (role, verified = true) =>
  sponsorshipRouter.createCaller({
    db: state.db,
    headers,
    session: role
      ? {
          user: {
            id: "admin1",
            emailVerified: verified,
            adminUser: { id: "officer1", role },
          },
        }
      : null,
  });

beforeEach(() => {
  saved = ["price_Sponsor"];
  attempts = new Map();
  sessionParams = null;
  createdSessions = 0;
  dbWrites = 0;
});

test("checkout uses configured Stripe price and ignores a client-supplied amount", async () => {
  const payload = donationCheckoutInput.parse({
    ...input(),
    amountCents: 100,
    customAmountCents: 100,
  });
  await createDonationCheckout(payload, headers);
  assert.deepEqual(sessionParams.line_items, [
    { quantity: 1, price: "price_Sponsor" },
  ]);
  assert.equal([...attempts.values()][0].amount, 25000);
  assert.equal([...attempts.values()][0].tier, "prod_Sponsor");
  assert.equal(
    sessionParams.cancel_url,
    "http://localhost:3001/sponsors/register?tier=price_Sponsor&status=canceled",
  );
  await createDonationCheckout(payload, headers);
  assert.equal(createdSessions, 1);
});

test("unconfigured prices cannot create a checkout, even for the same product", async () => {
  for (const priceId of ["price_Unknown", "price_Different"])
    await assert.rejects(
      createDonationCheckout({ ...input(), priceId }, headers),
    );
  assert.equal(dbWrites, 0);
  assert.equal(createdSessions, 0);
});

test("checkout rejects an archived configured price before saving an attempt", async () => {
  const original = state.stripe.prices.retrieve;
  state.stripe.prices.retrieve = async (id) => ({
    ...price(id),
    active: false,
  });
  try {
    await assert.rejects(createDonationCheckout(input(), headers));
  } finally {
    state.stripe.prices.retrieve = original;
  }
  assert.equal(dbWrites, 0);
  assert.equal(createdSessions, 0);
});

test("preset and decimal donations pass their exact cents to Stripe", async () => {
  for (const cents of [1000, 2000, 5000, 10000, 50000, 2501]) {
    attempts = new Map();
    await createDonationCheckout(
      {
        kind: "individual",
        amountCents: cents,
        idempotencyKey: crypto.randomUUID(),
      },
      headers,
    );
    assert.equal(sessionParams.line_items[0].price_data.unit_amount, cents);
    assert.equal(sessionParams.submit_type, "donate");
  }
});

test("catalog sorts available prices and reports invalid configured entries", async () => {
  saved = ["price_High", "price_Missing", "price_Sponsor"];
  const catalog = await getSponsorshipCatalog();
  assert.deepEqual(
    catalog.tiers.map((tier) => tier.amount),
    [25000, 100000],
  );
  assert.equal(catalog.errors[0].priceId, "price_Missing");
});

test("configuration reads and writes require a verified admin", async () => {
  for (const client of [
    caller(null),
    caller("OFFICER"),
    caller("ADMIN", false),
  ]) {
    await assert.rejects(client.configuration());
    await assert.rejects(client.save({ priceIds: ["price_High"] }));
  }
  assert.deepEqual(saved, ["price_Sponsor"]);
});

test("admin save validates all IDs before changing configuration and can remove every paid tier", async () => {
  const admin = caller("ADMIN");
  await assert.rejects(
    admin.save({ priceIds: ["price_High", "price_Missing"] }),
  );
  assert.deepEqual(saved, ["price_Sponsor"]);
  await admin.save({ priceIds: ["price_High", "price_Sponsor"] });
  assert.deepEqual(saved, ["price_High", "price_Sponsor"]);
  await admin.save({ priceIds: [] });
  assert.deepEqual(saved, []);
});

test("admin rejects Product IDs and legacy product configuration payloads before changing settings", async () => {
  const admin = caller("ADMIN");
  for (const payload of [
    { priceIds: ["prod_Sponsor"] },
    { productIds: ["prod_Sponsor"] },
    { priceIds: ["price_Sponsor"], productIds: ["prod_Sponsor"] },
  ]) {
    await assert.rejects(
      admin.save(payload),
      (error) => error.code === "BAD_REQUEST",
    );
    assert.deepEqual(saved, ["price_Sponsor"]);
  }
});
