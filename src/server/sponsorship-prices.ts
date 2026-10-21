import "server-only";

import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { getStripe } from "@/server/stripe";
import {
  sortSponsorshipTiers,
  sponsorshipTierFromPrice,
} from "@/lib/sponsorship";

export async function retrieveSponsorshipPrice(priceId: string) {
  try {
    const price = await getStripe().prices.retrieve(priceId, {
      expand: ["product"],
    });
    const tier = sponsorshipTierFromPrice(price);
    return {
      ...tier,
      stripeProductUrl: `https://dashboard.stripe.com/${price.livemode ? "" : "test/"}products/${tier.productId}`,
    };
  } catch (error) {
    // Do not expose Stripe response details or credentials to public callers.
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `${priceId}: ${error instanceof Error && !("type" in error) ? error.message : "Could not read this price from the configured Stripe account. Check its ID and test/live mode."}`,
    });
  }
}

export async function getSponsorshipCatalog() {
  const prices = await db.sponsorshipPrice.findMany({
    orderBy: { priceId: "asc" },
  });
  const results = await Promise.allSettled(
    prices.map(({ priceId }) => retrieveSponsorshipPrice(priceId)),
  );
  return {
    tiers: sortSponsorshipTiers(
      results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      ),
    ),
    errors: results.flatMap((result, i) =>
      result.status === "rejected"
        ? [
            {
              priceId: prices[i]!.priceId,
              message:
                result.reason instanceof TRPCError
                  ? result.reason.message
                  : "Could not load this price.",
            },
          ]
        : [],
    ),
  };
}

export async function getSponsorshipTier(priceId: string) {
  const configured = await db.sponsorshipPrice.findUnique({
    where: { priceId },
  });
  if (!configured)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "This sponsorship package is unavailable. Choose a package from the sponsorship page.",
    });
  try {
    return await retrieveSponsorshipPrice(priceId);
  } catch (error) {
    console.error("Sponsorship price could not be loaded", error);
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "This sponsorship package is currently unavailable. Choose another package or contact us for help.",
    });
  }
}
