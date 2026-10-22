import "server-only";

import type Stripe from "stripe";

import { employerRegistrationSchema } from "@/app/career-events/register/schema";
import { db } from "@/server/db";

/**
 * Checkout is two rows on purpose.
 *
 * 1. `RegistrationAttempt` — in-flight checkout. Holds the form JSON and the
 *    Stripe Checkout Session and PaymentIntent ids. Created when they leave
 *    for Stripe Checkout. Not shown in admin.
 * 2. `EmployerRegistration` — the real signup officers look at. Created only
 *    once Stripe says the payment is `processing` or `succeeded`.
 *
 * Stripe and the return page can both report the same PaymentIntent, so these
 * helpers are idempotent. Webhooks and `registration.finalize` both call them.
 */

/** Statuses that mean "we should create / keep the officer-facing row." */
const acceptedStatuses = new Set<Stripe.PaymentIntent.Status>([
  "processing",
  "succeeded",
]);

const emptyToNull = (value: string | undefined) =>
  value && value.length > 0 ? value : null;

/**
 * Turn a paid (or ACH-processing) PaymentIntent into an `EmployerRegistration`.
 *
 * No-ops if the PI is not `processing`/`succeeded`, has no attempt id in
 * metadata, or the attempt row is gone. Upsert so a webhook and a tRPC
 * finalize hitting the same PI don't create two registrations.
 *
 * On a later `succeeded` after `processing`, only `paymentStatus` and the PI
 * id are updated — form fields stay as they were on first promote.
 *
 * @returns The registration row, or `null` if this PI is not ready to promote.
 */
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
        selectedPackageId: attempt.selectedPackageId,
        packageTitle: attempt.packageTitle,
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

/**
 * Handle a PaymentIntent that Stripe reports as failed or canceled
 * (`payment_intent.payment_failed` / `canceled`, or a declined confirm).
 *
 * Three cases:
 *
 * - **Already promoted** (registration row exists, e.g. ACH was `processing`
 *   then later failed): mark both rows `FAILED`. Officers already have an
 *   entry; deleting it would hide a company that paid and then bounced.
 * - **Hosted Checkout still exists**: keep the attempt because Checkout lets
 *   the customer try another payment method on the same Session.
 * - **Legacy embedded checkout**: delete the attempt so a retry starts clean.
 *
 * Delete is `deleteMany` so a missing row is a no-op (webhook retry).
 */
export const recordFailedAttempt = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  const attemptId = paymentIntent.metadata.registrationAttemptId;
  if (!attemptId) return;

  const attempt = await db.registrationAttempt.findUnique({
    where: { id: attemptId },
    include: { registration: true },
  });
  if (!attempt) return;

  if (attempt.registration) {
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

  if (attempt.stripeCheckoutSessionId) {
    await db.registrationAttempt.update({
      where: { id: attemptId },
      data: {
        status: "FAILED",
        stripePaymentIntentId: paymentIntent.id,
      },
    });
    return;
  }

  await db.registrationAttempt.deleteMany({ where: { id: attemptId } });
};
