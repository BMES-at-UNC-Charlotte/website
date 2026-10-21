"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { SponsorshipContact } from "@/app/sponsors/_components/sponsorship-contact";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDonationUsd } from "@/lib/donation";
import { SPONSORSHIP_EMAIL } from "@/lib/sponsorship";
import { api } from "@/trpc/react";

export function ContributionStatus({ sessionId }: { sessionId?: string }) {
  const valid = Boolean(sessionId?.startsWith("cs_"));
  const payment = api.donation.paymentStatus.useQuery(
    { sessionId: sessionId ?? "" },
    {
      enabled: valid,
      retry: 1,
      refetchInterval: (query) =>
        ["PENDING", "PROCESSING"].includes(query.state.data?.status ?? "")
          ? 5000
          : false,
    },
  );
  const paid = payment.data?.status === "SUCCEEDED";
  useEffect(() => {
    if (!paid || payment.data?.kind !== "sponsorship") return;
    try {
      sessionStorage.removeItem("bmes-sponsor-registration");
    } catch {
      /* Browser storage may be unavailable. */
    }
  }, [paid, payment.data?.kind]);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <Typography variant="h1">
          {paid ? "Thank you for your support" : "Contribution status"}
        </Typography>
      </CardHeader>
      <CardContent className="space-y-6">
        {!valid ? (
          <Alert variant="destructive">
            <AlertTitle>No payment to verify</AlertTitle>
            <AlertDescription>
              Return here from Stripe checkout to check your contribution.
            </AlertDescription>
          </Alert>
        ) : payment.isPending ? (
          <div className="flex items-center gap-3">
            <Spinner />
            <Typography>Checking your payment…</Typography>
          </div>
        ) : payment.error ? (
          <Alert variant="destructive">
            <AlertTitle>Payment verification unavailable</AlertTitle>
            <AlertDescription>{payment.error.message}</AlertDescription>
            <Button variant="outline" onClick={() => void payment.refetch()}>
              Check again
            </Button>
          </Alert>
        ) : paid ? (
          <div className="space-y-3">
            <CheckCircle2 aria-hidden="true" />
            <Typography>
              Your {formatDonationUsd(payment.data.amount)}{" "}
              {payment.data?.kind === "sponsorship"
                ? "sponsorship payment is confirmed. Your company registration has been saved, and we'll contact you about your sponsorship."
                : "donation is confirmed. Your contribution supports Charlotte BMES student programs and activities."}
            </Typography>
          </div>
        ) : payment.data?.status === "PROCESSING" ? (
          <Alert>
            <AlertTitle>Payment processing</AlertTitle>
            <AlertDescription>
              Your payment is still processing. This page will check for
              updates. Please wait for confirmation before making another
              payment.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertTitle>Payment is not confirmed</AlertTitle>
            <AlertDescription>
              Your checkout is{" "}
              {payment.data?.status === "EXPIRED"
                ? "expired"
                : payment.data?.status === "FAILED"
                  ? "unsuccessful"
                  : "incomplete"}
              . Check your Stripe receipt before starting another payment.
            </AlertDescription>
          </Alert>
        )}
        <SponsorshipContact
          title="Have any questions?"
          description="Contact us with any questions about your contribution."
          href={`mailto:${SPONSORSHIP_EMAIL}`}
        />
      </CardContent>
    </Card>
  );
}
