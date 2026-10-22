"use client";

import { focusFirstInvalidField, useAppForm } from "@/app/_components/form";
import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/utils";
import { api } from "@/trpc/react";
import { revalidateLogic, useSelector } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import {
  CheckoutValidationError,
  RegistrationCheckout,
  type CheckoutNotice,
  type RegistrationConfiguration,
} from "./checkout";
import { OrderSummary } from "./order-summary";
import { checkoutSchema, defaultValues } from "./schema";

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

export function RegisterFormPage({
  attemptId,
  previousAttemptIncomplete = false,
}: {
  attemptId?: string;
  previousAttemptIncomplete?: boolean;
}) {
  return (
    <RegistrationCheckout
      attemptId={attemptId}
      previousAttemptIncomplete={previousAttemptIncomplete}
    >
      {(checkout) => <RegisterForm {...checkout} />}
    </RegistrationCheckout>
  );
}

function RegisterForm({
  configuration,
  previousAttemptIncomplete,
}: {
  configuration: RegistrationConfiguration;
  previousAttemptIncomplete: boolean;
}) {
  const submitRegistration = api.registration.submit.useMutation();
  const [notice, setNotice] = useState<CheckoutNotice>();
  const formElementRef = useRef<HTMLFormElement>(null);

  const form = useAppForm({
    defaultValues: {
      ...defaultValues,
      packageId: configuration.packages[0]?.id ?? "",
    },
    validationLogic: revalidateLogic({
      mode: "blur",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: checkoutSchema,
    },
    onSubmitInvalid: ({ formApi }) => {
      void formApi.validateAllFields("submit").then(() => {
        focusFirstInvalidField(formElementRef.current);
      });
    },
    onSubmit: async ({ value }) => {
      setNotice(undefined);

      try {
        const parsed = checkoutSchema.safeParse(value);
        if (!parsed.success) throw new CheckoutValidationError();
        const { packageId, priceId, ...registration } = parsed.data;
        const result = await submitRegistration.mutateAsync({
          registration,
          packageId,
          priceId,
          idempotencyKey: crypto.randomUUID(),
        });
        window.location.assign(result.checkoutUrl);
      } catch (error) {
        if (error instanceof CheckoutValidationError) return;
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

  const priceId = useSelector(form.store, (state) => state.values.priceId);
  const packageId = useSelector(form.store, (state) => state.values.packageId);
  const selectedPackage = configuration.packages.find(
    (registrationPackage) => registrationPackage.id === packageId,
  );
  const selectedOption = selectedPackage?.options.find(
    (option) => option.priceId === priceId,
  );
  useEffect(() => {
    if (!selectedPackage || !priceId || selectedOption) return;
    form.setFieldValue("priceId", "");
  }, [form, priceId, selectedOption, selectedPackage]);

  return (
    <>
      <header className="max-w-4xl space-y-6">
        <Typography variant="h1">Reserve your employer package</Typography>
        <Typography variant="subtitle" className="max-w-2xl">
          Complete your organization profile and secure your place at UNC
          Charlotte BMES biomedical industry career events.
        </Typography>
      </header>
      <Separator />
      {previousAttemptIncomplete ? (
        <Alert>
          <AlertTitle>Previous attempt not completed</AlertTitle>
          <AlertDescription>
            No payment was completed. Start a new checkout below when you are
            ready to try again.
          </AlertDescription>
        </Alert>
      ) : null}
      <form.AppForm>
        <form
          ref={formElementRef}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="grid items-start gap-12 md:grid-cols-[minmax(0,1fr)_24rem]">
            <main className="space-y-12">
              <section>
                <SectionHeading eyebrow="Step 1" title="Registration package" />
                <FieldGroup>
                  <form.AppField name="packageId">
                    {(field) => (
                      <field.RadioCardField
                        label="Package"
                        required
                        options={configuration.packages.map(
                          (registrationPackage) => ({
                            value: registrationPackage.id,
                            title: registrationPackage.title,
                          }),
                        )}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="priceId">
                    {(field) => (
                      <field.RadioCardField
                        empty="Select a package to see tiers."
                        label="Package tier"
                        required
                        options={(selectedPackage?.options ?? []).map(
                          (option) => ({
                            value: option.priceId,
                            title: option.name,
                            description: option.description,
                            action: (
                              <strong>
                                {formatMoney(
                                  option.unitAmount,
                                  option.currency,
                                )}
                              </strong>
                            ),
                          }),
                        )}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="representativeCount">
                    {(field) => (
                      <field.RadioGroupField
                        description="Up to two representatives are included with registration."
                        label="Representatives"
                        required
                        options={[1, 2, 3, 4].map((count) => ({
                          value: count,
                          label:
                            count > 2
                              ? `${count} representatives · +${formatMoney((count - 2) * configuration.additionalRepresentative.unitAmount, configuration.additionalRepresentative.currency)}`
                              : `${count} ${count === 1 ? "representative" : "representatives"}`,
                        }))}
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </section>

              <Separator />

              <section>
                <SectionHeading
                  eyebrow="Step 2"
                  title="Organization and primary contact"
                />
                <FieldGroup>
                  <div className="grid gap-7 sm:grid-cols-2">
                    <form.AppField name="companyName">
                      {(field) => (
                        <field.TextField label="Company name" required />
                      )}
                    </form.AppField>
                    <form.AppField name="division">
                      {(field) => (
                        <field.TextField label="Division (optional)" />
                      )}
                    </form.AppField>
                    <form.AppField name="contactName">
                      {(field) => (
                        <field.TextField label="Full name" required />
                      )}
                    </form.AppField>
                    <form.AppField name="title">
                      {(field) => <field.TextField label="Title (optional)" />}
                    </form.AppField>
                    <form.AppField name="email">
                      {(field) => (
                        <field.TextField
                          description="We'll use this email to contact you about the event. Your payment receipt will also be sent here."
                          label="Contact email"
                          required
                          type="email"
                        />
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
                        description="A short summary to help students understand your organization."
                        label="Company overview"
                        required
                      />
                    )}
                  </form.AppField>
                </FieldGroup>
              </section>

              <Separator />

              <section>
                <SectionHeading eyebrow="Step 3" title="Business address" />
                <FieldGroup>
                  <form.AppField name="addressStreet">
                    {(field) => (
                      <field.TextField label="Street address" required />
                    )}
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
                      {(field) => (
                        <field.TextField label="Postal code" required />
                      )}
                    </form.AppField>
                    <form.AppField name="addressCountry">
                      {(field) => <field.TextField label="Country" required />}
                    </form.AppField>
                  </div>
                </FieldGroup>
              </section>

              <Separator />

              <section>
                <SectionHeading eyebrow="Step 4" title="Event participation" />
                <FieldGroup>
                  <div className="grid gap-7 sm:grid-cols-2">
                    <form.AppField name="thirdPartyRecruiter">
                      {(field) => (
                        <field.BooleanRadioField
                          label="Third-party recruiter?"
                          required
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="alumni">
                      {(field) => (
                        <field.BooleanRadioField label="UNC Charlotte alumni? (optional)" />
                      )}
                    </form.AppField>
                  </div>
                </FieldGroup>
              </section>

              <Separator />

              <section>
                <SectionHeading eyebrow="Step 5" title="Recruiting interests" />
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
            </main>

            <OrderSummary
              form={form}
              configuration={configuration}
              notice={notice}
            />
          </div>
        </form>
      </form.AppForm>
    </>
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
      <Typography variant="caption">{eyebrow}</Typography>
      <Typography variant="h3">{title}</Typography>
    </header>
  );
}
