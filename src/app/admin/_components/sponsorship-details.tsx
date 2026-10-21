"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { formatDonationUsd } from "@/lib/donation";
import { api } from "@/trpc/react";
import { formatSponsorshipDate } from "@/lib/sponsorship";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt>
        <Typography as="span" variant="caption">
          {label}
        </Typography>
      </dt>
      <dd className="break-words whitespace-pre-wrap">
        {children === "" ? "Not provided" : (children ?? "Not provided")}
      </dd>
    </div>
  );
}

function SponsorLogo({ id, companyName }: { id: string; companyName: string }) {
  const utils = api.useUtils();
  const [src, setSrc] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setSrc("");
    setError(false);
    async function load() {
      const parts: string[] = [];
      let chunk: number | null = 0;
      let contentType = "";
      while (chunk !== null && active) {
        const result = await utils.sponsorship.logo.fetch({ id, chunk });
        parts.push(result.base64);
        contentType = result.contentType;
        chunk = result.nextChunk;
      }
      if (active) setSrc(`data:${contentType};base64,${parts.join("")}`);
    }
    void load().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [id, utils, attempt]);

  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Unable to load the company logo.
          <Button variant="link" onClick={() => setAttempt(attempt + 1)}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  if (!src)
    return (
      <div className="flex items-center gap-2" role="status">
        <Spinner /> Loading logo…
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- This logo comes from authenticated tRPC data.
    <img
      src={src}
      alt={`${companyName} logo`}
      onError={() => setError(true)}
      className="max-h-64 max-w-full object-contain"
    />
  );
}

export function SponsorshipDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const detail = api.sponsorship.detail.useQuery({ id });
  const record = detail.data;
  const registration = record?.registration;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            {registration?.companyName ?? "Sponsorship details"}
          </DialogTitle>
          <DialogDescription>
            {record
              ? `${record.package?.name ?? "Sponsorship"} — ${formatDonationUsd(record.amount)}, ${formatSponsorshipDate(record.sponsoredAt)}`
              : "Company registration and payment details."}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-6">
          {detail.isPending ? (
            <div className="flex items-center gap-2" role="status">
              <Spinner /> Loading sponsorship…
            </div>
          ) : detail.error ? (
            <Alert variant="destructive">
              <AlertDescription>
                {detail.error.message}
                <Button variant="link" onClick={() => void detail.refetch()}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : record ? (
            <>
              {registration ? (
                <>
                  <section
                    className="space-y-4"
                    aria-labelledby="sponsor-contact-heading"
                  >
                    <Typography
                      variant="h5"
                      as="h3"
                      id="sponsor-contact-heading"
                    >
                      Company contact
                    </Typography>
                    <dl className="grid gap-5 sm:grid-cols-2">
                      <Detail label="Contact name">
                        {registration.contactName}
                      </Detail>
                      <Detail label="Email">
                        <a
                          href={`mailto:${registration.email}`}
                          className="underline"
                        >
                          {registration.email}
                        </a>
                      </Detail>
                      <Detail label="Phone">
                        <a
                          href={`tel:${registration.phone}`}
                          className="underline"
                        >
                          {registration.phone}
                        </a>
                      </Detail>
                      <Detail label="Website">
                        {registration.website ? (
                          <a
                            href={registration.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {registration.website}
                          </a>
                        ) : null}
                      </Detail>
                    </dl>
                  </section>
                  <Separator />
                  <section
                    className="space-y-4"
                    aria-labelledby="sponsor-preferences-heading"
                  >
                    <Typography
                      variant="h5"
                      as="h3"
                      id="sponsor-preferences-heading"
                    >
                      Sponsorship &amp; recruiting
                    </Typography>
                    <dl className="space-y-5">
                      <Detail label="Benefits of interest">
                        {registration.preferences.join(", ")}
                      </Detail>
                      <Detail label="Recruiting opportunities">
                        {registration.recruitingOpportunities}
                      </Detail>
                      <Detail label="Careers or job posting link">
                        {registration.recruitingUrl ? (
                          <a
                            href={registration.recruitingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {registration.recruitingUrl}
                          </a>
                        ) : null}
                      </Detail>
                      <Detail label="Partnership interests">
                        {registration.partnershipInterests.join(", ")}
                      </Detail>
                      <Detail label="Partnership details or special requests">
                        {registration.notes}
                      </Detail>
                    </dl>
                  </section>
                </>
              ) : (
                <Typography>
                  Registration details are unavailable for this sponsorship.
                </Typography>
              )}
              <Separator />
              <section
                className="space-y-4"
                aria-labelledby="sponsor-payment-heading"
              >
                <Typography variant="h5" as="h3" id="sponsor-payment-heading">
                  Payment
                </Typography>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <Detail label="Amount">
                    {formatDonationUsd(record.amount)}
                  </Detail>
                  <Detail label="Confirmed (Eastern time)">
                    {formatSponsorshipDate(record.sponsoredAt, true)}
                  </Detail>
                  <Detail label="Registered (Eastern time)">
                    {formatSponsorshipDate(record.registeredAt, true)}
                  </Detail>
                  <Detail label="Stripe Price ID">{record.priceId}</Detail>
                  <Detail label="Checkout session">
                    {record.checkoutSessionId}
                  </Detail>
                  <Detail label="Payment intent">
                    {record.paymentIntentId}
                  </Detail>
                </dl>
              </section>
              {record.hasLogo ? (
                <>
                  <Separator />
                  <section
                    className="space-y-4"
                    aria-labelledby="sponsor-logo-heading"
                  >
                    <Typography variant="h5" as="h3" id="sponsor-logo-heading">
                      Company logo
                    </Typography>
                    <SponsorLogo
                      id={id}
                      companyName={registration?.companyName ?? "Company"}
                    />
                  </section>
                </>
              ) : null}
            </>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
