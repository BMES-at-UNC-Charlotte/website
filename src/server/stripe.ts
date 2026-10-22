import "server-only";

import Stripe from "stripe";

import { env } from "@/env";
import { db } from "@/server/db";

let stripeClient: Stripe | undefined;

export const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY);
  return stripeClient;
};

export const getActiveStripePrice = async (priceId: string) => {
  const price = await getStripe().prices.retrieve(priceId, {
    expand: ["product"],
  });

  if (
    !price.active ||
    price.type !== "one_time" ||
    price.unit_amount === null ||
    typeof price.product === "string" ||
    price.product.deleted
  ) {
    return null;
  }

  return {
    description: price.product.description,
    name: price.product.name,
    priceId: price.id,
    productId: price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
  };
};

export const getRegistrationConfiguration = async () => {
  const [packages, settings] = await Promise.all([
    db.employerRegistrationPackage.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.employerRegistrationConfiguration.findUnique({
      where: { id: "default" },
    }),
  ]);

  if (!settings) {
    throw new Error("Employer registration pricing is not configured");
  }

  const priceIds = [
    ...new Set([
      ...packages.flatMap(
        (registrationPackage) => registrationPackage.stripePriceIds,
      ),
      settings.additionalRepresentativePriceId,
    ]),
  ];
  const prices = await Promise.all(
    priceIds.map(
      async (priceId) =>
        [priceId, await getActiveStripePrice(priceId)] as const,
    ),
  );
  const pricesById = new Map(prices);

  const registrationPackages = packages
    .map((registrationPackage) => ({
      id: registrationPackage.id,
      title: registrationPackage.title,
      options: registrationPackage.stripePriceIds.flatMap((priceId) => {
        const price = pricesById.get(priceId);
        return price ? [price] : [];
      }),
    }))
    .filter((registrationPackage) => registrationPackage.options.length > 0);

  const additionalRepresentative = pricesById.get(
    settings.additionalRepresentativePriceId,
  );
  if (!additionalRepresentative) {
    throw new Error("The additional representative Price is unavailable");
  }

  const optionCurrencies = registrationPackages.flatMap((registrationPackage) =>
    registrationPackage.options.map((option) => option.currency),
  );
  if (
    optionCurrencies.some(
      (currency) => currency !== additionalRepresentative.currency,
    )
  ) {
    throw new Error("All registration Prices must use the same currency");
  }

  return {
    packages: registrationPackages,
    additionalRepresentative,
  };
};
