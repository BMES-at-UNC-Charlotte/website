BEGIN;
-- CreateEnum
CREATE TYPE "DonationPaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "DonationCheckout" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tier" TEXT,
    "stripePriceId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "sponsor" JSONB,
    "logoName" TEXT,
    "logoContentType" TEXT,
    "logoData" BYTEA,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" "DonationPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipPrice" (
    "priceId" TEXT NOT NULL,

    CONSTRAINT "SponsorshipPrice_pkey" PRIMARY KEY ("priceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationCheckout_idempotencyKey_key" ON "DonationCheckout"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DonationCheckout_stripeCheckoutSessionId_key" ON "DonationCheckout"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationCheckout_stripePaymentIntentId_key" ON "DonationCheckout"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "DonationCheckout_status_createdAt_idx" ON "DonationCheckout"("status", "createdAt");

COMMIT;
