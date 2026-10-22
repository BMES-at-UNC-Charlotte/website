import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@/env";
import {
  additionalRepresentativeCount,
  finalizeRegistrationSchema,
  representativeSurcharge,
  submitRegistrationSchema,
} from "@/app/career-events/register/schema";
import { promoteAcceptedAttempt } from "@/server/registration-payments";
import {
  getActiveStripePrice,
  getRegistrationConfiguration,
  getStripe,
} from "@/server/stripe";
import {
  createTRPCRouter,
  officerProcedure,
  publicProcedure,
} from "@/server/api/trpc";

const getSiteUrl = (headers: Headers) => {
  if (env.BETTER_AUTH_URL) {
    return new URL(env.BETTER_AUTH_URL).origin;
  }

  const origin = headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      // Fall through to the forwarded host.
    }
  }

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host ?? "localhost:3000"}`;
};

const publicPaymentError = (error: unknown) => {
  console.error(error);
  return new TRPCError({
    code: "BAD_REQUEST",
    message:
      "Payment could not be processed. Try again or use another payment method.",
  });
};

const packageInput = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1, "Package title is required"),
  stripePriceIds: z
    .array(z.string().trim().startsWith("price_"))
    .min(1, "Add at least one Stripe Price ID")
    .refine((priceIds) => new Set(priceIds).size === priceIds.length, {
      message: "Stripe Price IDs must be unique within a package",
    }),
  enabled: z.boolean(),
  sortOrder: z.number().int(),
});

const verifyActivePrices = async (priceIds: string[]) => {
  const prices = await Promise.all(
    priceIds.map(async (priceId) => ({
      priceId,
      price: await getActiveStripePrice(priceId),
    })),
  );
  const unavailablePrice = prices.find(({ price }) => !price);
  if (unavailablePrice) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${unavailablePrice.priceId} is not an active one-time Stripe Price`,
    });
  }
};

export const registrationRouter = createTRPCRouter({
  adminConfiguration: officerProcedure.query(async ({ ctx }) => {
    const [packages, configuration] = await ctx.db.$transaction([
      ctx.db.employerRegistrationPackage.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      ctx.db.employerRegistrationConfiguration.findUnique({
        where: { id: "default" },
      }),
    ]);

    return {
      packages,
      additionalRepresentativePriceId:
        configuration?.additionalRepresentativePriceId ?? "",
    };
  }),

  savePackage: officerProcedure
    .input(packageInput)
    .mutation(async ({ ctx, input }) => {
      if (input.enabled) await verifyActivePrices(input.stripePriceIds);

      const data = {
        title: input.title,
        stripePriceIds: input.stripePriceIds,
        enabled: input.enabled,
        sortOrder: input.sortOrder,
      };

      return input.id
        ? ctx.db.employerRegistrationPackage.update({
            where: { id: input.id },
            data,
          })
        : ctx.db.employerRegistrationPackage.create({ data });
    }),

  saveAdditionalRepresentativePrice: officerProcedure
    .input(
      z.object({
        priceId: z.string().trim().startsWith("price_"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyActivePrices([input.priceId]);

      return ctx.db.employerRegistrationConfiguration.upsert({
        where: { id: "default" },
        update: { additionalRepresentativePriceId: input.priceId },
        create: {
          id: "default",
          additionalRepresentativePriceId: input.priceId,
        },
      });
    }),

  list: officerProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z
          .union([z.literal(10), z.literal(25), z.literal(50), z.literal(100)])
          .default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [registrations, total] = await ctx.db.$transaction([
        ctx.db.employerRegistration.findMany({
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            companyName: true,
            contactName: true,
            title: true,
            division: true,
            phone: true,
            email: true,
            fax: true,
            website: true,
            addressCountry: true,
            addressState: true,
            addressPostalCode: true,
            addressCity: true,
            addressStreet: true,
            thirdPartyRecruiter: true,
            alumni: true,
            overview: true,
            majorsRecruiting: true,
            workAuthorizations: true,
            workAuthorizationOther: true,
            degreeLevels: true,
            positionsAvailable: true,
            representativeCount: true,
            tierName: true,
            packageTitle: true,
            additionalRepCount: true,
            additionalRepUnitAmount: true,
            amount: true,
            currency: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        ctx.db.employerRegistration.count(),
      ]);

      return { registrations, total };
    }),

  configuration: publicProcedure.query(async () => {
    try {
      return await getRegistrationConfiguration();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Employer registration pricing is not configured"
      ) {
        return null;
      }

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Registration tiers are unavailable",
      });
    }
  }),

  submit: publicProcedure
    .input(submitRegistrationSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.registrationAttempt.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
          registration: { is: null },
        },
      });

      let configuration;
      try {
        configuration = await getRegistrationConfiguration();
      } catch (error) {
        throw publicPaymentError(error);
      }

      const registrationPackage = configuration.packages.find(
        (candidate) => candidate.id === input.packageId,
      );
      const packageOption = registrationPackage?.options.find(
        (candidate) => candidate.priceId === input.priceId,
      );
      if (!registrationPackage || !packageOption) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The selected package tier is not allowed",
        });
      }

      const additionalRepCount = additionalRepresentativeCount(
        input.registration.representativeCount,
      );
      const amount =
        packageOption.unitAmount +
        representativeSurcharge(
          input.registration.representativeCount,
          configuration.additionalRepresentative.unitAmount,
        );

      let attempt = await ctx.db.registrationAttempt.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { registration: true },
      });

      if (attempt?.registration) {
        const registrationUrl = new URL(
          "/career-events/register",
          getSiteUrl(ctx.headers),
        );
        registrationUrl.searchParams.set("attempt", attempt.id);
        return {
          attemptId: attempt.id,
          checkoutUrl: registrationUrl.toString(),
        } as const;
      }

      if (
        attempt &&
        (attempt.selectedPackageId !== input.packageId ||
          attempt.selectedPriceId !== input.priceId ||
          attempt.amount !== amount)
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This payment attempt does not match the submitted form",
        });
      }

      attempt ??= await ctx.db.registrationAttempt.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          formPayload: input.registration,
          selectedPackageId: registrationPackage.id,
          packageTitle: registrationPackage.title,
          selectedPriceId: packageOption.priceId,
          stripeProductId: packageOption.productId,
          tierName: packageOption.name,
          additionalRepPriceId: configuration.additionalRepresentative.priceId,
          additionalRepProductId:
            configuration.additionalRepresentative.productId,
          additionalRepCount,
          additionalRepUnitAmount:
            configuration.additionalRepresentative.unitAmount,
          amount,
          currency: packageOption.currency,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        include: { registration: true },
      });

      const stripe = getStripe();

      if (attempt.stripeCheckoutSessionId) {
        const existingSession = await stripe.checkout.sessions.retrieve(
          attempt.stripeCheckoutSessionId,
        );
        if (!existingSession.url) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This checkout session is no longer available",
          });
        }

        return {
          attemptId: attempt.id,
          checkoutUrl: existingSession.url,
        } as const;
      }

      try {
        const siteUrl = getSiteUrl(ctx.headers);
        const successUrl = new URL("/career-events/register", siteUrl);
        successUrl.searchParams.set("attempt", attempt.id);
        const cancelUrl = new URL("/career-events/register", siteUrl);
        cancelUrl.searchParams.set("canceled", "1");

        const lineItems = [
          { price: attempt.selectedPriceId, quantity: 1 },
          ...(attempt.additionalRepCount > 0
            ? [
                {
                  price: attempt.additionalRepPriceId,
                  quantity: attempt.additionalRepCount,
                },
              ]
            : []),
        ];
        const checkoutSession = await stripe.checkout.sessions.create(
          {
            mode: "payment",
            line_items: lineItems,
            customer_email: input.registration.email,
            success_url: successUrl.toString(),
            cancel_url: cancelUrl.toString(),
            metadata: {
              registrationAttemptId: attempt.id,
            },
            payment_intent_data: {
              description: `${input.registration.companyName} employer event registration`,
              metadata: {
                registrationAttemptId: attempt.id,
                registrationPackageId: attempt.selectedPackageId,
                registrationPriceId: attempt.selectedPriceId,
                additionalRepPriceId: attempt.additionalRepPriceId,
                additionalRepQuantity: String(attempt.additionalRepCount),
              },
            },
          },
          { idempotencyKey: `employer-registration:${attempt.id}` },
        );

        await ctx.db.registrationAttempt.update({
          where: { id: attempt.id },
          data: {
            stripeCheckoutSessionId: checkoutSession.id,
          },
        });

        if (!checkoutSession.url) {
          throw new Error("Stripe did not return a checkout URL");
        }

        return {
          attemptId: attempt.id,
          checkoutUrl: checkoutSession.url,
        } as const;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw publicPaymentError(error);
      }
    }),

  finalize: publicProcedure
    .input(finalizeRegistrationSchema)
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.db.registrationAttempt.findFirst({
        where: {
          ...(input.attemptId ? { id: input.attemptId } : {}),
          ...(input.idempotencyKey
            ? { idempotencyKey: input.idempotencyKey }
            : {}),
        },
        include: { registration: true },
      });

      if (!attempt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This registration attempt could not be found",
        });
      }

      if (attempt.registration) {
        return {
          accepted: true,
          paymentStatus:
            attempt.registration.paymentStatus === "SUCCEEDED"
              ? "succeeded"
              : attempt.registration.paymentStatus === "FAILED"
                ? "failed"
                : "processing",
        } as const;
      }

      let paymentIntentId = attempt.stripePaymentIntentId;
      if (!paymentIntentId && attempt.stripeCheckoutSessionId) {
        const checkoutSession = await getStripe().checkout.sessions.retrieve(
          attempt.stripeCheckoutSessionId,
        );
        paymentIntentId =
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : (checkoutSession.payment_intent?.id ?? null);
      }

      if (!paymentIntentId) {
        return { accepted: false, paymentStatus: "pending" } as const;
      }
      const paymentIntent =
        await getStripe().paymentIntents.retrieve(paymentIntentId);
      await promoteAcceptedAttempt(paymentIntent);

      return {
        accepted:
          paymentIntent.status === "processing" ||
          paymentIntent.status === "succeeded",
        paymentStatus: paymentIntent.status,
      };
    }),
});
