import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  additionalRepresentativeCount,
  finalizeRegistrationSchema,
  representativeSurcharge,
  submitRegistrationSchema,
} from "@/lib/employer-registration";
import {
  paymentIntentResult,
  promoteAcceptedAttempt,
  recordFailedAttempt,
} from "@/server/registration-payments";
import { getRegistrationConfiguration, getStripe } from "@/server/stripe";
import {
  createTRPCRouter,
  officerProcedure,
  publicProcedure,
} from "@/server/api/trpc";

const getReturnUrl = (headers: Headers, attemptId: string) => {
  const origin = headers.get("origin");
  if (origin) {
    try {
      return `${new URL(origin).origin}/register?attempt=${attemptId}`;
    } catch {
      // Fall through to the forwarded host.
    }
  }

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host ?? "localhost:3000"}/register?attempt=${attemptId}`;
};

const publicPaymentError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Stripe could not process payment";
  return new TRPCError({ code: "BAD_REQUEST", message });
};

export const registrationRouter = createTRPCRouter({
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

  tiers: publicProcedure.query(async () => {
    try {
      return await getRegistrationConfiguration();
    } catch (error) {
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

      const tier = configuration.tiers.find(
        (candidate) => candidate.priceId === input.priceId,
      );
      if (!tier) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The selected registration tier is not allowed",
        });
      }

      const additionalRepCount = additionalRepresentativeCount(
        input.registration.representativeCount,
      );
      const amount =
        tier.unitAmount +
        representativeSurcharge(
          input.registration.representativeCount,
          configuration.additionalRepresentative.unitAmount,
        );

      let attempt = await ctx.db.registrationAttempt.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { registration: true },
      });

      if (attempt?.registration) {
        return {
          accepted: true,
          attemptId: attempt.id,
          clientSecret: null,
          paymentStatus:
            attempt.registration.paymentStatus === "SUCCEEDED"
              ? "succeeded"
              : "processing",
        } as const;
      }

      if (
        attempt &&
        (attempt.selectedPriceId !== input.priceId || attempt.amount !== amount)
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
          selectedPriceId: tier.priceId,
          stripeProductId: tier.productId,
          tierName: tier.name,
          confirmationTokenId: input.confirmationTokenId,
          additionalRepPriceId: configuration.additionalRepresentative.priceId,
          additionalRepProductId:
            configuration.additionalRepresentative.productId,
          additionalRepCount,
          additionalRepUnitAmount:
            configuration.additionalRepresentative.unitAmount,
          amount,
          currency: tier.currency,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        include: { registration: true },
      });

      const stripe = getStripe();

      if (attempt.stripePaymentIntentId) {
        const existingPaymentIntent = await stripe.paymentIntents.retrieve(
          attempt.stripePaymentIntentId,
        );
        await promoteAcceptedAttempt(existingPaymentIntent);
        return {
          attemptId: attempt.id,
          ...paymentIntentResult(existingPaymentIntent),
        };
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create(
          {
            amount: attempt.amount,
            currency: attempt.currency,
            confirm: true,
            confirmation_token: attempt.confirmationTokenId,
            description: `${input.registration.companyName} employer event registration`,
            metadata: {
              registrationAttemptId: attempt.id,
              registrationPriceId: attempt.selectedPriceId,
              additionalRepPriceId: attempt.additionalRepPriceId,
              additionalRepQuantity: String(attempt.additionalRepCount),
            },
            return_url: getReturnUrl(ctx.headers, attempt.id),
          },
          { idempotencyKey: `employer-registration:${attempt.id}` },
        );

        await ctx.db.registrationAttempt.update({
          where: { id: attempt.id },
          data: {
            stripePaymentIntentId: paymentIntent.id,
            status:
              paymentIntent.status === "requires_action"
                ? "REQUIRES_ACTION"
                : paymentIntent.status === "processing"
                  ? "PROCESSING"
                  : paymentIntent.status === "succeeded"
                    ? "SUCCEEDED"
                    : "PENDING",
          },
        });

        await promoteAcceptedAttempt(paymentIntent);

        if (paymentIntent.status === "requires_payment_method") {
          await recordFailedAttempt(paymentIntent);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The payment method was declined. Please try another.",
          });
        }

        return {
          attemptId: attempt.id,
          ...paymentIntentResult(paymentIntent),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        const paymentIntent = (error as { payment_intent?: unknown })
          .payment_intent;
        if (
          paymentIntent &&
          typeof paymentIntent === "object" &&
          "id" in paymentIntent &&
          "metadata" in paymentIntent
        ) {
          await recordFailedAttempt(
            paymentIntent as Parameters<typeof recordFailedAttempt>[0],
          );
        } else {
          await ctx.db.registrationAttempt.deleteMany({
            where: {
              id: attempt.id,
              stripePaymentIntentId: null,
            },
          });
        }

        throw publicPaymentError(error);
      }
    }),

  finalize: publicProcedure
    .input(finalizeRegistrationSchema)
    .mutation(async ({ ctx, input }) => {
      const attempt = await ctx.db.registrationAttempt.findFirst({
        where: {
          ...(input.attemptId ? { id: input.attemptId } : {}),
          idempotencyKey: input.idempotencyKey,
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

      if (!attempt.stripePaymentIntentId) {
        return { accepted: false, paymentStatus: "pending" } as const;
      }

      const paymentIntent = await getStripe().paymentIntents.retrieve(
        attempt.stripePaymentIntentId,
      );
      await promoteAcceptedAttempt(paymentIntent);

      return {
        accepted:
          paymentIntent.status === "processing" ||
          paymentIntent.status === "succeeded",
        paymentStatus: paymentIntent.status,
      };
    }),
});
