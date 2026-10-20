// Run only against a local server using an existing sandbox checkout.
// No Stripe products, account settings, or new payments are created here.
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.loadEnvFile(".env.local");
const { PrismaClient } = require("../generated/prisma");
const sessionId = process.env.DONATION_TEST_SESSION_ID;
const origin = process.env.DONATION_TEST_ORIGIN ?? "http://localhost:3001";
assert.ok(
  sessionId?.startsWith("cs_test_"),
  "Provide a sandbox DONATION_TEST_SESSION_ID",
);
assert.ok(
  process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"),
  "Tests require a test Stripe key",
);
assert.ok(
  process.env.STRIPE_WEBHOOK_SECRET,
  "Tests require a local webhook signing secret",
);
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(origin).hostname),
  "Tests require a local server",
);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = new PrismaClient();
try {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  assert.equal(session.livemode, false);
  assert.equal(
    session.payment_status,
    "paid",
    "Provide an already completed sandbox checkout",
  );
  const input = encodeURIComponent(JSON.stringify({ json: { sessionId } }));
  const statusResponse = await fetch(
    `${origin}/api/trpc/donation.paymentStatus?input=${input}`,
  );
  assert.equal(statusResponse.status, 200);
  const result = (await statusResponse.json()).result.data.json;
  assert.equal(result.status, "SUCCEEDED");
  assert.equal(result.amount, session.amount_total);
  assert.equal(result.sponsor, undefined);
  assert.equal(result.logoData, undefined);

  for (const type of [
    "checkout.session.completed",
    "checkout.session.completed",
    "checkout.session.async_payment_failed",
  ]) {
    const payload = JSON.stringify({
      id: "evt_local_donation_test",
      object: "event",
      type,
      data: { object: session },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    const response = await fetch(`${origin}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "stripe-signature": signature,
        "content-type": "application/json",
      },
      body: payload,
    });
    assert.equal(response.status, 200);
  }
  const records = await db.donationCheckout.findMany({
    where: { stripeCheckoutSessionId: sessionId },
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].status, "SUCCEEDED");
  const invalid = await fetch(`${origin}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "stripe-signature": "invalid",
      "content-type": "application/json",
    },
    body: "{}",
  });
  assert.equal(invalid.status, 400);
  const missing = await fetch(
    `${origin}/api/trpc/donation.paymentStatus?input=${encodeURIComponent(JSON.stringify({ json: { sessionId: "cs_test_missing" } }))}`,
  );
  assert.notEqual(missing.status, 200);
  console.log(
    "Verified sandbox confirmation, private-data filtering, duplicate and late webhook handling, and invalid signature rejection.",
  );
} finally {
  await db.$disconnect();
}
