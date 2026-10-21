import { PAYMENT_DISCLAIMER } from "../src/lib/payment-disclaimer.ts";
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
let saved,
  attempts,
  sessionParams,
  createdSessions,
  dbWrites,
  sponsorRecords,
  recordQueries;
const selectRecord = (record, select) =>
  Object.fromEntries(Object.keys(select).map((key) => [key, record[key]]));
const matchingRecord = (record, where) =>
  Object.entries(where).every(([key, value]) => record[key] === value);
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
    findMany: async (query) => {
      recordQueries.push(query);
      return sponsorRecords
        .filter((record) => matchingRecord(record, query.where))
        .sort((a, b) => b.updatedAt - a.updatedAt || b.id.localeCompare(a.id))
        .slice(query.skip, query.skip + query.take)
        .map((record) => selectRecord(record, query.select));
    },
    findFirst: async (query) => {
      recordQueries.push(query);
      const record = sponsorRecords.find((record) =>
        matchingRecord(record, query.where),
      );
      return record ? selectRecord(record, query.select) : null;
    },
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
  sponsorRecords = [];
  recordQueries = [];
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
  assert.equal(sessionParams.custom_text.submit.message, PAYMENT_DISCLAIMER);
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
    assert.equal(sessionParams.custom_text.submit.message, PAYMENT_DISCLAIMER);
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

test("the complete payment disclaimer fits Stripe's custom submit text limit", () => {
  assert.ok(PAYMENT_DISCLAIMER.length > 0 && PAYMENT_DISCLAIMER.length <= 1200);
  assert.match(
    PAYMENT_DISCLAIMER,
    /This is not an official University of North Carolina at Charlotte/,
  );
  assert.match(PAYMENT_DISCLAIMER, /The University does not review/);
});

const sponsorRecord = (index = 1, changed = {}) => ({
  id: `c${String(index).padStart(24, "0")}`,
  kind: "sponsorship",
  status: "SUCCEEDED",
  sponsor: {
    ...sponsor,
    companyName: `Company ${index}`,
    notes: "Private partnership notes",
  },
  amount: 25000,
  currency: "usd",
  createdAt: new Date("2026-10-20T12:00:00Z"),
  updatedAt: new Date(
    `2026-10-21T12:${String(index % 60).padStart(2, "0")}:00Z`,
  ),
  stripePriceId: "price_Sponsor",
  stripeCheckoutSessionId: "cs_test_record",
  stripePaymentIntentId: "pi_record",
  logoName: "logo.png",
  logoContentType: "image/png",
  logoData: Buffer.from("original logo bytes"),
  ...changed,
});

test("sponsor list, details and raw logo require a verified admin", async () => {
  for (const client of [
    caller(null),
    caller("OFFICER"),
    caller("ADMIN", false),
  ]) {
    await assert.rejects(client.list({ page: 0 }));
    await assert.rejects(client.detail({ id: sponsorRecord().id }));
    await assert.rejects(client.logo({ id: sponsorRecord().id, chunk: 0 }));
  }
  assert.equal(recordQueries.length, 0);
});

test("sponsor list paginates confirmed sponsorships newest first and excludes full registration and logos", async () => {
  sponsorRecords = Array.from({ length: 28 }, (_, i) => sponsorRecord(i + 1));
  sponsorRecords.push(sponsorRecord(50, { status: "PENDING" }));
  sponsorRecords.push(sponsorRecord(51, { kind: "individual" }));
  const page = await caller("ADMIN").list({ page: 0 });
  assert.equal(page.items.length, 25);
  assert.equal(page.hasMore, true);
  assert.equal(page.items[0].companyName, "Company 28");
  assert.equal(page.items[0].packageName, "Company partner");
  assert.equal(
    page.items[0].sponsoredAt.getTime(),
    sponsorRecord(28).updatedAt.getTime(),
  );
  assert.ok(
    page.items.every(
      (item) =>
        !("sponsor" in item) && !("logoData" in item) && !("logoName" in item),
    ),
  );
  assert.equal(recordQueries[0].select.logoData, undefined);
  const last = await caller("ADMIN").list({ page: 1 });
  assert.equal(last.items.length, 3);
  assert.equal(last.hasMore, false);
  assert.equal(last.items[2].companyName, "Company 1");
});

test("sponsor details include full registration without fetching logo bytes", async () => {
  const record = sponsorRecord();
  sponsorRecords = [record];
  const detail = await caller("ADMIN").detail({ id: record.id });
  assert.equal(detail.registration.notes, "Private partnership notes");
  assert.equal(detail.registration.email, sponsor.email);
  assert.equal(detail.checkoutSessionId, record.stripeCheckoutSessionId);
  assert.equal(detail.priceId, record.stripePriceId);
  assert.equal(detail.hasLogo, true);
  assert.equal(recordQueries[0].select.logoData, undefined);
  assert.equal("logoData" in detail, false);
});

test("details and logo cannot expose unfinished payments or individual donations", async () => {
  for (const changed of [{ status: "PENDING" }, { kind: "individual" }]) {
    const record = sponsorRecord(1, changed);
    sponsorRecords = [record];
    for (const request of [
      () => caller("ADMIN").detail({ id: record.id }),
      () => caller("ADMIN").logo({ id: record.id, chunk: 0 }),
    ])
      await assert.rejects(request, (error) => error.code === "NOT_FOUND");
  }
});

test("on-demand logo chunks preserve the entire 5 MB original and keep each response small", async () => {
  const bytes = Buffer.alloc(5 * 1024 * 1024, 123);
  const record = sponsorRecord(1, { logoData: bytes });
  sponsorRecords = [record];
  const chunks = [];
  let chunk = 0;
  while (chunk !== null) {
    const part = await caller("ADMIN").logo({ id: record.id, chunk });
    assert.equal(part.contentType, "image/png");
    assert.ok(part.base64.length <= 1024 * 1024);
    chunks.push(part.base64);
    chunk = part.nextChunk;
  }
  assert.deepEqual(Buffer.from(chunks.join(""), "base64"), bytes);
  await assert.rejects(
    caller("ADMIN").logo({ id: record.id, chunk: 7 }),
    (error) => error.code === "BAD_REQUEST",
  );
});

test("completed sponsors remain visible when their Stripe price is unavailable", async () => {
  const record = sponsorRecord(1, { stripePriceId: "price_Missing" });
  sponsorRecords = [record];
  const list = await caller("ADMIN").list({ page: 0 });
  const detail = await caller("ADMIN").detail({ id: record.id });
  assert.equal(list.items[0].companyName, "Company 1");
  assert.equal(list.items[0].packageName, "Sponsorship");
  assert.equal(detail.registration.contactName, sponsor.contactName);
  assert.equal(detail.package, null);
});

test("package links open the product in the matching Stripe test or live mode", async () => {
  const original = state.stripe.prices.retrieve;
  try {
    for (const livemode of [false, true]) {
      state.stripe.prices.retrieve = async (id) => ({ ...price(id), livemode });
      const configuration = await caller("ADMIN").configuration();
      assert.equal(
        configuration.tiers[0].stripeProductUrl,
        `https://dashboard.stripe.com/${livemode ? "" : "test/"}products/prod_Sponsor`,
      );
    }
  } finally {
    state.stripe.prices.retrieve = original;
  }
  assert.equal(dbWrites, 0);
});
