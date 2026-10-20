"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { revalidateLogic } from "@tanstack/react-form";
import { focusFirstInvalidField, useAppForm } from "@/app/_components/form";
import { PaymentDisclaimer } from "@/app/_components/payment-disclaimer";
import { Typography } from "@/app/_components/typography";
import { SponsorshipContact } from "./sponsorship-contact";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  donationCheckoutInput,
  createCheckoutKey,
  formatDonationUsd,
  MAX_LOGO_BYTES,
  PARTNERSHIP_INTERESTS,
  sponsorDefaults,
  sponsorRegistrationSchema,
  SPONSORSHIP_PREFERENCES,
  sponsorshipFormSchema,
  type SponsorLogo,
} from "@/lib/donation";
import { type SponsorshipTier } from "@/lib/sponsorship";
import { api } from "@/trpc/react";

export const SPONSOR_DRAFT_KEY = "bmes-sponsor-registration";

async function readLogo(file: File): Promise<SponsorLogo> {
  if (
    file.size > MAX_LOGO_BYTES ||
    !["image/png", "image/jpeg", "image/webp"].includes(file.type)
  )
    throw new Error("Choose a PNG, JPEG, or WebP logo smaller than 2 MB.");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("The logo could not be read. Please choose it again."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(
          new Error("The logo could not be read. Please choose it again."),
        );
        return;
      }
      resolve(reader.result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  });
  return {
    name: file.name,
    contentType: file.type as SponsorLogo["contentType"],
    base64,
  };
}

export function SponsorshipForm({
  initialTier,
  tiers,
  canceled,
}: {
  initialTier: string;
  tiers: SponsorshipTier[];
  canceled: boolean;
}) {
  const element = useRef<HTMLFormElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const request = useRef<{ payload: string; key: string } | null>(null);
  const [logo, setLogo] = useState<SponsorLogo>();
  const [logoError, setLogoError] = useState("");
  const [readingLogo, setReadingLogo] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [invalidNotice, setInvalidNotice] = useState(false);
  const createCheckout = api.donation.createCheckoutSession.useMutation();
  const busy = createCheckout.isPending || redirecting;

  const form = useAppForm({
    defaultValues: { ...sponsorDefaults, tier: initialTier },
    validationLogic: revalidateLogic({
      mode: "blur",
      modeAfterSubmission: "change",
    }),
    validators: { onDynamic: sponsorshipFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      setInvalidNotice(true);
      void formApi
        .validateAllFields("submit")
        .then(() => focusFirstInvalidField(element.current));
    },
    onSubmit: async ({ value }) => {
      if (busy || readingLogo || logoError) return;
      setInvalidNotice(false);
      const sponsor = sponsorRegistrationSchema.parse(value);
      const selected = tiers.find((tier) => tier.priceId === value.tier);
      if (!selected) return;
      const payload = {
        kind: "sponsorship" as const,
        priceId: selected.priceId,
        sponsor,
        logo,
      };
      const signature = JSON.stringify(payload);
      if (request.current?.payload !== signature)
        request.current = { payload: signature, key: createCheckoutKey() };
      try {
        sessionStorage.setItem(
          SPONSOR_DRAFT_KEY,
          JSON.stringify({ value, logo }),
        );
      } catch {
        /* Checkout can proceed if browser storage is unavailable. */
      }
      try {
        const { url } = await createCheckout.mutateAsync({
          ...payload,
          idempotencyKey: request.current.key,
        });
        setRedirecting(true);
        window.location.assign(url);
      } catch {
        /* Keep the form filled and display the mutation error below. */
      }
    },
  });

  useEffect(() => {
    if (!canceled) return;
    try {
      const stored = sessionStorage.getItem(SPONSOR_DRAFT_KEY);
      if (!stored) return;
      const draft = JSON.parse(stored) as { value?: unknown; logo?: unknown };
      const parsed = sponsorshipFormSchema.safeParse(draft.value);
      if (!parsed.success) return;
      if (!tiers.some((tier) => tier.priceId === parsed.data.tier)) return;
      form.reset(parsed.data);
      const checked = donationCheckoutInput.safeParse({
        kind: "sponsorship",
        priceId: tiers.find((tier) => tier.priceId === parsed.data.tier)!
          .priceId,
        sponsor: parsed.data,
        logo: draft.logo,
        idempotencyKey: createCheckoutKey(),
      });
      if (checked.success && checked.data.kind === "sponsorship")
        setLogo(checked.data.logo);
    } catch {
      /* A missing or invalid draft leaves the form ready for a new registration. */
    }
  }, [canceled, form, tiers]);

  return (
    <form.AppForm>
      <form
        ref={element}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <fieldset disabled={busy} className="min-w-0 space-y-8">
            {canceled ? (
              <Alert>
                <AlertTitle>Checkout canceled</AlertTitle>
                <AlertDescription>
                  Your saved registration is ready to review. Continue to
                  payment when you&apos;re ready.
                </AlertDescription>
              </Alert>
            ) : null}
            <form.AppField name="tier">
              {(field) => (
                <field.RadioCardField
                  label="Sponsorship package"
                  required
                  options={tiers.map((tier) => ({
                    value: tier.priceId,
                    title: tier.name,
                    description: tier.description,
                    action: formatDonationUsd(tier.amount),
                  }))}
                />
              )}
            </form.AppField>
            <Separator />
            <section aria-labelledby="company-heading" className="space-y-6">
              <Typography variant="h2" id="company-heading">
                Company contact
              </Typography>
              <FieldGroup>
                <form.AppField name="companyName">
                  {(field) => (
                    <field.TextField
                      label="Company or organization name"
                      required
                      autoComplete="organization"
                      maxLength={200}
                    />
                  )}
                </form.AppField>
                <div className="grid gap-7 sm:grid-cols-2">
                  <form.AppField name="contactName">
                    {(field) => (
                      <field.TextField
                        label="Contact name"
                        required
                        autoComplete="name"
                        maxLength={200}
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="phone">
                    {(field) => (
                      <field.TextField
                        label="Phone number"
                        required
                        type="tel"
                        autoComplete="tel"
                        maxLength={50}
                      />
                    )}
                  </form.AppField>
                </div>
                <form.AppField name="email">
                  {(field) => (
                    <field.TextField
                      label="Contact email"
                      required
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                    />
                  )}
                </form.AppField>
                <form.AppField name="website">
                  {(field) => (
                    <field.TextField
                      label="Company website (optional)"
                      type="url"
                      placeholder="https://example.com"
                      maxLength={500}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </section>
            <Separator />
            <section
              aria-labelledby="preferences-heading"
              className="space-y-6"
            >
              <Typography variant="h2" id="preferences-heading">
                Sponsorship preferences
              </Typography>
              <FieldGroup>
                <form.AppField name="preferences">
                  {(field) => (
                    <field.CheckboxGroupField
                      label="Which benefits interest you? (optional)"
                      options={SPONSORSHIP_PREFERENCES.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  )}
                </form.AppField>
                <Field data-invalid={Boolean(logoError)}>
                  <FieldLabel htmlFor="sponsor-logo">
                    Company logo (optional)
                  </FieldLabel>
                  <Input
                    ref={logoInput}
                    id="sponsor-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={readingLogo}
                    aria-invalid={Boolean(logoError)}
                    aria-describedby={logoError ? "logo-error" : "logo-help"}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      setLogo(undefined);
                      setLogoError("");
                      if (!file) return;
                      setReadingLogo(true);
                      try {
                        setLogo(await readLogo(file));
                      } catch (error) {
                        setLogoError(
                          error instanceof Error
                            ? error.message
                            : "The logo could not be read.",
                        );
                      } finally {
                        setReadingLogo(false);
                      }
                    }}
                  />
                  <FieldDescription id="logo-help">
                    PNG, JPEG, or WebP, up to 2 MB.{" "}
                    {readingLogo
                      ? "Reading logo…"
                      : logo
                        ? `Selected: ${logo.name}`
                        : "We'll use your logo to coordinate sponsor recognition."}
                  </FieldDescription>
                  {logoError ? (
                    <FieldError id="logo-error">{logoError}</FieldError>
                  ) : null}
                  {logo || logoError ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogo(undefined);
                        setLogoError("");
                        if (logoInput.current) logoInput.current.value = "";
                      }}
                    >
                      Remove logo
                    </Button>
                  ) : null}
                </Field>
              </FieldGroup>
            </section>
            <Separator />
            <section aria-labelledby="recruiting-heading" className="space-y-6">
              <Typography variant="h2" id="recruiting-heading">
                Recruiting &amp; partnership
              </Typography>
              <FieldGroup>
                <form.AppField name="recruitingOpportunities">
                  {(field) => (
                    <field.TextareaField
                      label="Recruiting opportunities (optional)"
                      description="Share internships, open roles, desired skills, or ways you'd like to meet students."
                      maxLength={4000}
                    />
                  )}
                </form.AppField>
                <form.AppField name="recruitingUrl">
                  {(field) => (
                    <field.TextField
                      label="Careers or job posting link (optional)"
                      type="url"
                      placeholder="https://example.com/careers"
                      maxLength={500}
                    />
                  )}
                </form.AppField>
                <form.AppField name="partnershipInterests">
                  {(field) => (
                    <field.CheckboxGroupField
                      label="Partnership interests (optional)"
                      options={PARTNERSHIP_INTERESTS.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  )}
                </form.AppField>
                <form.AppField name="notes">
                  {(field) => (
                    <field.TextareaField
                      label="Partnership details or special requests (optional)"
                      maxLength={4000}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
            </section>
          </fieldset>
          <aside className="space-y-5 lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle>Your sponsorship</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <form.Subscribe selector={(state) => state.values.tier}>
                  {(tier) => {
                    const selected = tiers.find(
                      (item) => item.priceId === tier,
                    );
                    if (!selected) return null;
                    return (
                      <div className="space-y-3">
                        <Typography variant="h3">{selected.name}</Typography>
                        <Typography>{selected.description}</Typography>
                        <Separator />
                        <div className="flex justify-between gap-4">
                          <Typography>Total (USD)</Typography>
                          <Typography>
                            {formatDonationUsd(selected.amount)}
                          </Typography>
                        </div>
                      </div>
                    );
                  }}
                </form.Subscribe>
                {invalidNotice ? (
                  <Alert variant="destructive">
                    <AlertTitle>Check your registration</AlertTitle>
                    <AlertDescription>
                      Complete the required fields and correct the errors above.
                    </AlertDescription>
                  </Alert>
                ) : null}
                {createCheckout.error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Checkout unavailable</AlertTitle>
                    <AlertDescription>
                      {createCheckout.error.message}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <form.SubmitButton
                  size="lg"
                  className="w-full"
                  disabled={busy || readingLogo || Boolean(logoError)}
                  pending="Opening secure checkout"
                >
                  {redirecting
                    ? "Opening secure checkout"
                    : "Continue to payment"}
                </form.SubmitButton>
              </CardContent>
              <CardFooter>
                <PaymentDisclaimer />
              </CardFooter>
            </Card>
            <SponsorshipContact />
            <Button
              variant="outline"
              render={<Link href="/sponsors" />}
              nativeButton={false}
            >
              Back to donation options
            </Button>
          </aside>
        </div>
      </form>
    </form.AppForm>
  );
}
