"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  employerRegistrationSchema,
  representativeSurcharge,
  type EmployerRegistrationInput,
} from "@/lib/employer-registration";
import { api, type RouterOutputs } from "@/trpc/react";
import { useAppForm } from "./form";

type RegistrationConfiguration = RouterOutputs["registration"]["tiers"];
type Notice =
  | { type: "error"; title: string; message: string }
  | { type: "pending"; title: string; message: string }
  | { type: "success"; title: string; message: string };
type CheckoutValues = Omit<EmployerRegistrationInput, "thirdPartyRecruiter"> & {
  thirdPartyRecruiter: boolean | undefined;
  priceId: string;
};

const ATTEMPT_KEY = "bmes-registration-attempt";
const IDEMPOTENCY_KEY = "bmes-registration-idempotency";

const checkoutSchema = employerRegistrationSchema.extend({
  priceId: z.string().min(1, "Choose a registration tier"),
});

const defaultValues: CheckoutValues = {
  companyName: "",
  contactName: "",
  title: "",
  representativeCount: 2,
  addressCountry: "",
  addressState: "",
  addressPostalCode: "",
  addressCity: "",
  addressStreet: "",
  division: "",
  phone: "",
  email: "",
  fax: "",
  thirdPartyRecruiter: undefined,
  alumni: undefined,
  website: "",
  overview: "",
  majorsRecruiting: [],
  workAuthorizations: [],
  workAuthorizationOther: "",
  degreeLevels: [],
  positionsAvailable: [],
  priceId: "",
};

const majors = [
  "Mechanical Engineering",
  "Electrical Engineering",
  "Electromechanical Engineering",
  "Software Engineering",
  "Computer Engineering",
].map((value) => ({ label: value, value }));

const workAuthorizations = [
  "US Citizen",
  "Student Visa",
  "Permanent Resident",
  "Other",
].map((value) => ({ label: value, value }));

const degreeLevels = [
  "Associate's",
  "Bachelor's",
  "Master's",
  "Doctorate's",
].map((value) => ({ label: value, value }));

const positions = [
  "Co-op's",
  "Internship",
  "Full-Time Entry Level",
  "Undergraduate Research",
  "Part-time",
  "Temporary/Other",
].map((value) => ({ label: value, value }));

const formatMoney = (amount: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);

function StatusAlert({ notice }: { notice: Notice }) {
  const Icon =
    notice.type === "success"
      ? CheckCircle2
      : notice.type === "pending"
        ? Loader2
        : AlertCircle;

  return (
    <Alert variant={notice.type === "error" ? "destructive" : "default"}>
      <Icon
        className={notice.type === "pending" ? "animate-spin" : undefined}
      />
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.message}</AlertDescription>
    </Alert>
  );
}

export function EmployerRegistrationForm({
  publishableKey,
}: {
  publishableKey: string;
}) {
  const pricing = api.registration.tiers.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );
  const initialAmount = pricing.data?.tiers[0]?.unitAmount ?? 1;
  const currency = pricing.data?.tiers[0]?.currency ?? "usd";

  if (!stripePromise) {
    return (
      <StatusAlert
        notice={{
          type: "error",
          title: "Payment unavailable",
          message: "Stripe is not configured for this environment.",
        }}
      />
    );
  }

  return (
    <Elements
      options={{
        mode: "payment",
        amount: initialAmount,
        currency,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#A49665",
            borderRadius: "12px",
          },
        },
      }}
      stripe={stripePromise}
    >
      <CheckoutForm
        configuration={pricing.data}
        pricingError={pricing.error?.message}
      />
    </Elements>
  );
}

function CheckoutForm({
  configuration,
  pricingError,
}: {
  configuration?: RegistrationConfiguration;
  pricingError?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const submitRegistration = api.registration.submit.useMutation();
  const finalizeRegistration = api.registration.finalize.useMutation();
  const [notice, setNotice] = useState<Notice>();

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "blur",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: checkoutSchema,
    },
    onSubmit: async ({ value }) => {
      if (!stripe || !elements || !configuration) return;

      const { priceId, ...registration } = checkoutSchema.parse(value);
      let idempotencyKey =
        sessionStorage.getItem(IDEMPOTENCY_KEY) ?? crypto.randomUUID();
      sessionStorage.setItem(IDEMPOTENCY_KEY, idempotencyKey);
      setNotice(undefined);

      try {
        const submittedElements = await elements.submit();
        if (submittedElements.error) {
          throw new Error(submittedElements.error.message);
        }

        const tokenResult = await stripe.createConfirmationToken({
          elements,
          params: {
            payment_method_data: {
              billing_details: {
                name: registration.contactName,
                email: registration.email,
              },
            },
            return_url: `${window.location.origin}/register`,
          },
        });
        if (tokenResult.error) throw new Error(tokenResult.error.message);

        const result = await submitRegistration.mutateAsync({
          registration,
          priceId,
          confirmationTokenId: tokenResult.confirmationToken.id,
          idempotencyKey,
        });
        sessionStorage.setItem(ATTEMPT_KEY, result.attemptId);

        if (result.accepted) {
          finishRegistration(result.paymentStatus);
          return;
        }

        if (result.clientSecret) {
          setNotice({
            type: "pending",
            title: "Verification required",
            message:
              "Complete your bank's secure verification prompt to continue.",
          });

          const action = await stripe.handleNextAction({
            clientSecret: result.clientSecret,
          });
          if (action.error) throw new Error(action.error.message);

          const finalized = await finalizeRegistration.mutateAsync({
            attemptId: result.attemptId,
            idempotencyKey,
          });
          if (finalized.accepted) {
            finishRegistration(finalized.paymentStatus);
            return;
          }
        }

        sessionStorage.removeItem(ATTEMPT_KEY);
        sessionStorage.removeItem(IDEMPOTENCY_KEY);
        setNotice({
          type: "error",
          title: "Payment was not confirmed",
          message:
            "No charge was confirmed. Review your payment details and try again.",
        });
      } catch (error) {
        sessionStorage.removeItem(ATTEMPT_KEY);
        sessionStorage.removeItem(IDEMPOTENCY_KEY);
        idempotencyKey = crypto.randomUUID();
        setNotice({
          type: "error",
          title: "Payment could not be completed",
          message:
            error instanceof Error
              ? error.message
              : "Please check your payment details and try again.",
        });
      }
    },
  });

  const priceId = useStore(form.store, (state) => state.values.priceId);
  const representativeCount = useStore(
    form.store,
    (state) => state.values.representativeCount,
  );
  const selectedTier = configuration?.tiers.find(
    (tier) => tier.priceId === priceId,
  );
  const additionalRepresentative = configuration?.additionalRepresentative;
  const representativeFee = additionalRepresentative
    ? representativeSurcharge(
        representativeCount,
        additionalRepresentative.unitAmount,
      )
    : 0;
  const total = selectedTier
    ? selectedTier.unitAmount + representativeFee
    : undefined;
  const paymentReady = Boolean(
    stripe && elements && selectedTier && additionalRepresentative,
  );

  function finishRegistration(paymentStatus: string) {
    sessionStorage.removeItem(ATTEMPT_KEY);
    sessionStorage.removeItem(IDEMPOTENCY_KEY);
    setNotice({
      type: "success",
      title: "Registration complete",
      message:
        paymentStatus === "processing"
          ? "Your registration is confirmed and payment is processing."
          : "Your payment succeeded and registration is confirmed.",
    });
  }

  useEffect(() => {
    const firstPriceId = configuration?.tiers[0]?.priceId;
    if (firstPriceId && !priceId) {
      form.setFieldValue("priceId", firstPriceId);
    } else if (
      priceId &&
      configuration &&
      !configuration.tiers.some((tier) => tier.priceId === priceId)
    ) {
      form.setFieldValue("priceId", "");
      setNotice({
        type: "error",
        title: "Package no longer available",
        message: "Please choose one of the currently available packages.",
      });
    }
  }, [configuration, form, priceId]);

  useEffect(() => {
    if (!elements || total === undefined) return;
    void elements.update({ amount: total });
  }, [elements, total]);

  useEffect(() => {
    const idempotencyKey = sessionStorage.getItem(IDEMPOTENCY_KEY);
    if (!idempotencyKey) return;

    const attemptId =
      new URLSearchParams(window.location.search).get("attempt") ??
      sessionStorage.getItem(ATTEMPT_KEY) ??
      undefined;

    setNotice({
      type: "pending",
      title: "Checking your registration",
      message: "We are checking the status of your previous payment attempt.",
    });

    finalizeRegistration
      .mutateAsync({ attemptId, idempotencyKey })
      .then((result) => {
        if (result.accepted) {
          finishRegistration(result.paymentStatus);
        } else {
          sessionStorage.removeItem(ATTEMPT_KEY);
          sessionStorage.removeItem(IDEMPOTENCY_KEY);
          setNotice({
            type: "error",
            title: "Previous payment was not completed",
            message: "Enter your payment details again to continue.",
          });
        }
      })
      .catch(() => {
        sessionStorage.removeItem(ATTEMPT_KEY);
        sessionStorage.removeItem(IDEMPOTENCY_KEY);
        setNotice(undefined);
      });
    // Recovery runs once when the checkout mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (notice?.type === "success") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CheckCircle2 className="text-primary size-10" />
          <CardTitle>{notice.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{notice.message}</p>
          <p className="text-muted-foreground">
            Keep this page for your records. Our team will follow up using the
            contact email provided.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="space-y-12">
          <section>
            <SectionHeading
              eyebrow="Step 1"
              title="Organization and primary contact"
            />
            <FieldGroup>
              <div className="grid gap-7 sm:grid-cols-2">
                <form.AppField name="companyName">
                  {(field) => <field.TextField label="Company name" required />}
                </form.AppField>
                <form.AppField name="division">
                  {(field) => <field.TextField label="Division (optional)" />}
                </form.AppField>
                <form.AppField name="contactName">
                  {(field) => <field.TextField label="Full name" required />}
                </form.AppField>
                <form.AppField name="title">
                  {(field) => <field.TextField label="Title (optional)" />}
                </form.AppField>
                <form.AppField name="email">
                  {(field) => (
                    <field.TextField label="Email" required type="email" />
                  )}
                </form.AppField>
                <form.AppField name="phone">
                  {(field) => (
                    <field.TextField label="Phone" required type="tel" />
                  )}
                </form.AppField>
                <form.AppField name="website">
                  {(field) => (
                    <field.TextField
                      label="Website (optional)"
                      placeholder="https://example.com"
                      type="url"
                    />
                  )}
                </form.AppField>
                <form.AppField name="fax">
                  {(field) => (
                    <field.TextField label="Fax (optional)" type="tel" />
                  )}
                </form.AppField>
              </div>
              <form.AppField name="overview">
                {(field) => (
                  <field.TextareaField
                    description="A short summary helps students understand your organization."
                    label="Company overview"
                    required
                  />
                )}
              </form.AppField>
            </FieldGroup>
          </section>

          <Separator />

          <section>
            <SectionHeading eyebrow="Step 2" title="Business address" />
            <FieldGroup>
              <form.AppField name="addressStreet">
                {(field) => <field.TextField label="Street address" required />}
              </form.AppField>
              <div className="grid gap-7 sm:grid-cols-2">
                <form.AppField name="addressCity">
                  {(field) => <field.TextField label="City" required />}
                </form.AppField>
                <form.AppField name="addressState">
                  {(field) => (
                    <field.TextField label="State or province" required />
                  )}
                </form.AppField>
                <form.AppField name="addressPostalCode">
                  {(field) => <field.TextField label="Postal code" required />}
                </form.AppField>
                <form.AppField name="addressCountry">
                  {(field) => <field.TextField label="Country" required />}
                </form.AppField>
              </div>
            </FieldGroup>
          </section>

          <Separator />

          <section>
            <SectionHeading eyebrow="Step 3" title="Event participation" />
            <FieldGroup>
              <form.AppField name="representativeCount">
                {(field) => (
                  <field.RepresentativeField
                    additionalUnitAmount={additionalRepresentative?.unitAmount}
                    formatPrice={(amount) =>
                      formatMoney(amount, additionalRepresentative?.currency)
                    }
                  />
                )}
              </form.AppField>
              <div className="grid gap-7 sm:grid-cols-2">
                <form.AppField name="thirdPartyRecruiter">
                  {(field) => (
                    <field.BooleanRadioField label="Third-party recruiter?" />
                  )}
                </form.AppField>
                <form.AppField name="alumni">
                  {(field) => (
                    <field.BooleanRadioField
                      label="UNC Charlotte alumni?"
                      optional
                    />
                  )}
                </form.AppField>
              </div>
            </FieldGroup>
          </section>

          <Separator />

          <section>
            <SectionHeading eyebrow="Step 4" title="Recruiting interests" />
            <FieldGroup>
              <form.AppField name="majorsRecruiting">
                {(field) => (
                  <field.CheckboxGroupField
                    label="Majors recruiting (optional)"
                    options={majors}
                  />
                )}
              </form.AppField>
              <form.AppField name="workAuthorizations">
                {(field) => (
                  <field.CheckboxGroupField
                    label="Work authorization desired (optional)"
                    options={workAuthorizations}
                  />
                )}
              </form.AppField>
              <form.AppField name="workAuthorizationOther">
                {(field) => (
                  <field.TextField label="Other work authorization (optional)" />
                )}
              </form.AppField>
              <form.AppField name="degreeLevels">
                {(field) => (
                  <field.CheckboxGroupField
                    label="Degree levels recruiting (optional)"
                    options={degreeLevels}
                  />
                )}
              </form.AppField>
              <form.AppField name="positionsAvailable">
                {(field) => (
                  <field.CheckboxGroupField
                    label="Positions available (optional)"
                    options={positions}
                  />
                )}
              </form.AppField>
            </FieldGroup>
          </section>

          <Separator />

          <section>
            <SectionHeading eyebrow="Step 5" title="Registration package" />
            <form.AppField name="priceId">
              {(field) => (
                <FieldSet>
                  <FieldLegend variant="label">
                    Select a registration tier
                  </FieldLegend>
                  <FieldDescription>
                    Package names, descriptions, and prices come directly from
                    Stripe.
                  </FieldDescription>
                  {configuration ? (
                    <RadioGroup
                      onValueChange={field.handleChange}
                      value={field.state.value}
                    >
                      {configuration.tiers.map((tier) => (
                        <Item
                          key={tier.priceId}
                          render={<label htmlFor={tier.priceId} />}
                          variant={
                            field.state.value === tier.priceId
                              ? "muted"
                              : "outline"
                          }
                        >
                          <ItemMedia>
                            <RadioGroupItem
                              id={tier.priceId}
                              value={tier.priceId}
                            />
                          </ItemMedia>
                          <ItemContent>
                            <ItemTitle>{tier.name}</ItemTitle>
                            {tier.description ? (
                              <FieldDescription>
                                {tier.description}
                              </FieldDescription>
                            ) : null}
                          </ItemContent>
                          <ItemActions>
                            <strong>
                              {formatMoney(tier.unitAmount, tier.currency)}
                            </strong>
                          </ItemActions>
                        </Item>
                      ))}
                    </RadioGroup>
                  ) : (
                    <TierSkeleton />
                  )}
                  <FieldError
                    errors={field.state.meta.errors.map((error) => ({
                      message:
                        typeof error === "string"
                          ? error
                          : "Choose a registration tier",
                    }))}
                  />
                </FieldSet>
              )}
            </form.AppField>
          </section>
        </main>

        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <ItemGroup>
                <SummaryLine
                  label={selectedTier?.name ?? "Registration package"}
                  value={
                    selectedTier
                      ? formatMoney(
                          selectedTier.unitAmount,
                          selectedTier.currency,
                        )
                      : undefined
                  }
                />
                {representativeFee > 0 ? (
                  <SummaryLine
                    label={`${representativeCount - 2} additional ${representativeCount === 3 ? "representative" : "representatives"}`}
                    value={formatMoney(
                      representativeFee,
                      additionalRepresentative?.currency,
                    )}
                  />
                ) : null}
              </ItemGroup>
              <Separator />
              <Item aria-live="polite">
                <ItemContent>
                  <ItemTitle>Total due today</ItemTitle>
                </ItemContent>
                <ItemActions>
                  {total !== undefined && selectedTier ? (
                    <strong>{formatMoney(total, selectedTier.currency)}</strong>
                  ) : (
                    <Skeleton className="h-6 w-20" />
                  )}
                </ItemActions>
              </Item>
              <Separator />

              {paymentReady ? (
                <PaymentElement options={{ layout: "accordion" }} />
              ) : (
                <PaymentSkeleton />
              )}

              {pricingError ? (
                <StatusAlert
                  notice={{
                    type: "error",
                    title: "Pricing unavailable",
                    message: pricingError,
                  }}
                />
              ) : null}
              {notice ? <StatusAlert notice={notice} /> : null}

              <form.Subscribe
                selector={(state) => state.isSubmitting}
              >
                {(isSubmitting) => (
                  <Button
                    className="w-full"
                    disabled={!paymentReady || isSubmitting}
                    size="lg"
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <LockKeyhole />
                    )}
                    {isSubmitting ? "Processing…" : "Pay & register"}
                  </Button>
                )}
              </form.Subscribe>

              <Item size="sm">
                <ItemMedia variant="icon">
                  <ShieldCheck />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Secure payment by Stripe</ItemTitle>
                  <FieldDescription>
                    Payment details never touch our server.
                  </FieldDescription>
                </ItemContent>
              </Item>
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  );
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="mb-7">
      <p className="text-secondary text-sm font-medium">{eyebrow}</p>
      <h2 className="font-heading text-2xl font-medium">{title}</h2>
    </header>
  );
}

function SummaryLine({ label, value }: { label: string; value?: string }) {
  return (
    <Item size="sm">
      <ItemContent>
        <ItemTitle>{label}</ItemTitle>
      </ItemContent>
      <ItemActions>
        {value ? <span>{value}</span> : <Skeleton className="h-5 w-16" />}
      </ItemActions>
    </Item>
  );
}

function TierSkeleton() {
  return (
    <ItemGroup>
      {[1, 2, 3].map((item) => (
        <Item key={item} variant="outline">
          <Skeleton className="size-4 rounded-full" />
          <ItemContent>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-3/4" />
          </ItemContent>
          <Skeleton className="h-5 w-16" />
        </Item>
      ))}
    </ItemGroup>
  );
}

function PaymentSkeleton() {
  return (
    <FieldGroup>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </FieldGroup>
  );
}
