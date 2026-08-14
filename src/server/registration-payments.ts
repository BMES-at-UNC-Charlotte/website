import "server-only";

import type Stripe from "stripe";

import { employerRegistrationSchema } from "@/lib/employer-registration";
import { db } from "@/server/db";

const acceptedStatuses = new Set<Stripe.PaymentIntent.Status>([
  "processing",
  "succeeded",
]);

const emptyToNull = (value: string | undefined) =>
  value && value.length > 0 ? value : null;

export const paymentIntentResult = (paymentIntent: Stripe.PaymentIntent) => ({
  accepted: acceptedStatuses.has(paymentIntent.status),
  clientSecret:
    paymentIntent.status === "requires_action"
      ? paymentIntent.client_secret
      : null,
  paymentStatus: paymentIntent.status,
});

export const promoteAcceptedAttempt = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  if (!acceptedStatuses.has(paymentIntent.status)) return null;

  const attemptId = paymentIntent.metadata.registrationAttemptId;
  if (!attemptId) return null;

  const attempt = await db.registrationAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) return null;

  const registration = employerRegistrationSchema.parse(attempt.formPayload);
  const paymentStatus =
    paymentIntent.status === "succeeded" ? "SUCCEEDED" : "PROCESSING";

  return db.$transaction(async (tx) => {
    const savedRegistration = await tx.employerRegistration.upsert({
      where: { attemptId: attempt.id },
      update: {
        paymentStatus,
        stripePaymentIntentId: paymentIntent.id,
      },
      create: {
        attemptId: attempt.id,
        companyName: registration.companyName,
        contactName: registration.contactName,
        title: emptyToNull(registration.title),
        representativeCount: registration.representativeCount,
        addressCountry: registration.addressCountry,
        addressState: registration.addressState,
        addressPostalCode: registration.addressPostalCode,
        addressCity: registration.addressCity,
        addressStreet: registration.addressStreet,
        division: emptyToNull(registration.division),
        phone: registration.phone,
        email: registration.email,
        fax: emptyToNull(registration.fax),
        thirdPartyRecruiter: registration.thirdPartyRecruiter,
        alumni: registration.alumni,
        website: emptyToNull(registration.website),
        overview: registration.overview,
        majorsRecruiting: registration.majorsRecruiting,
        workAuthorizations: registration.workAuthorizations,
        workAuthorizationOther: emptyToNull(
          registration.workAuthorizationOther,
        ),
        degreeLevels: registration.degreeLevels,
        positionsAvailable: registration.positionsAvailable,
        tierName: attempt.tierName,
        stripeProductId: attempt.stripeProductId,
        stripePriceId: attempt.selectedPriceId,
        additionalRepPriceId: attempt.additionalRepPriceId,
        additionalRepProductId: attempt.additionalRepProductId,
        additionalRepCount: attempt.additionalRepCount,
        additionalRepUnitAmount: attempt.additionalRepUnitAmount,
        stripePaymentIntentId: paymentIntent.id,
        amount: attempt.amount,
        currency: attempt.currency,
        paymentStatus,
      },
    });

    await tx.registrationAttempt.update({
      where: { id: attempt.id },
      data: {
        status: paymentStatus,
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return savedRegistration;
  });
};

export const recordFailedAttempt = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  const attemptId = paymentIntent.metadata.registrationAttemptId;
  if (!attemptId) return;

  const existingRegistration = await db.employerRegistration.findUnique({
    where: { attemptId },
  });

  if (existingRegistration) {
    await db.$transaction([
      db.employerRegistration.update({
        where: { attemptId },
        data: { paymentStatus: "FAILED" },
      }),
      db.registrationAttempt.update({
        where: { id: attemptId },
        data: {
          status: "FAILED",
          stripePaymentIntentId: paymentIntent.id,
        },
      }),
    ]);
    return;
  }

  await db.registrationAttempt.deleteMany({ where: { id: attemptId } });
};
