import { z } from "zod";

export const PRESET_DONATION_DOLLARS = [10, 20, 50, 100, 500] as const;

export const MIN_DONATION_CENTS = 100;
export const MAX_DONATION_CENTS = 1_000_000;

export const donationCheckoutInput = z.object({
  amountCents: z
    .number()
    .int()
    .min(MIN_DONATION_CENTS)
    .max(MAX_DONATION_CENTS),
});

export function parseDonationCents(value: string): number | null {
  const normalized = value.trim().replace(/[$,]/g, "");
  if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const cents = Math.round(Number(normalized) * 100);
  if (
    !Number.isInteger(cents) ||
    cents < MIN_DONATION_CENTS ||
    cents > MAX_DONATION_CENTS
  ) {
    return null;
  }

  return cents;
}

export function formatDonationUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
