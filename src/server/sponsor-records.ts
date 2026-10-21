import "server-only";

import { getStripe } from "@/server/stripe";
import { sponsorRegistrationSchema } from "@/lib/donation";

// Historical registrations can refer to prices that are no longer offered.
export async function getSponsorPackages(priceIds: (string | null)[]) {
  const ids = [...new Set(priceIds.filter((id): id is string => Boolean(id)))];
  const packages = await Promise.all(
    ids.map(async (priceId) => {
      try {
        const price = await getStripe().prices.retrieve(priceId, {
          expand: ["product"],
        });
        const product = price.product;
        if (typeof product === "string" || product.deleted) return null;
        return {
          priceId,
          name: product.name,
          description: product.description ?? "",
        };
      } catch {
        // Stripe availability must not hide completed sponsorship records.
        return null;
      }
    }),
  );
  return new Map(
    packages.flatMap((item) => (item ? [[item.priceId, item] as const] : [])),
  );
}

export function readSponsorRegistration(value: unknown) {
  const parsed = sponsorRegistrationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
