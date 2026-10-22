"use client";

import { Typography } from "@/app/_components/typography";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, type RouterOutputs } from "@/trpc/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export type RegistrationConfiguration = NonNullable<
  RouterOutputs["registration"]["configuration"]
>;
export type CheckoutNotice =
  | { type: "error"; title: string; message: string }
  | { type: "pending"; title: string; message: string };

export function StatusAlert({ notice }: { notice: CheckoutNotice }) {
  return (
    <Alert variant={notice.type === "error" ? "destructive" : "default"}>
      {notice.type === "pending" ? <Spinner /> : <AlertCircle />}
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.message}</AlertDescription>
    </Alert>
  );
}

export function RegistrationComplete({
  paymentStatus,
}: {
  paymentStatus: string;
}) {
  return (
    <Card className="mx-auto max-w-xl gap-1">
      <CardHeader className="gap-3">
        <CheckCircle2 className="text-foreground size-10" />
        <CardTitle>Registration complete</CardTitle>
      </CardHeader>
      <CardContent>
        <Typography>
          {paymentStatus === "processing"
            ? "Your registration is confirmed and payment is processing."
            : "Your payment succeeded and registration is confirmed."}{" "}
          Stripe will email a receipt to the contact email provided. Our team
          will use that address for any follow-up.
        </Typography>
      </CardContent>
    </Card>
  );
}

export function RegistrationCheckout({
  children,
  attemptId,
  previousAttemptIncomplete = false,
}: {
  attemptId?: string;
  previousAttemptIncomplete?: boolean;
  children: (checkout: {
    configuration: RegistrationConfiguration;
    previousAttemptIncomplete: boolean;
  }) => ReactNode;
}) {
  const router = useRouter();
  const pricing = api.registration.configuration.useQuery();
  const finalize = api.registration.finalize.useMutation();
  const defaultOption = pricing.data?.packages[0]?.options[0];

  useEffect(() => {
    if (!attemptId) return;
    finalize.mutate({ attemptId });
    // Stripe Checkout returns here with ?attempt=; finalize that payment once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    if (finalize.isIdle || finalize.isPending) return;
    if (finalize.isSuccess && finalize.data.accepted) return;
    router.replace("/career-events/register?canceled=1");
  }, [
    attemptId,
    finalize.data,
    finalize.isIdle,
    finalize.isPending,
    finalize.isSuccess,
    router,
  ]);

  if (attemptId && (finalize.isIdle || finalize.isPending)) {
    return (
      <div className="flex items-center gap-3">
        <Spinner />
        <Typography>Checking your previous payment attempt…</Typography>
      </div>
    );
  }

  if (finalize.data?.accepted) {
    return <RegistrationComplete paymentStatus={finalize.data.paymentStatus} />;
  }

  if (pricing.isPending) {
    return (
      <div className="flex items-center gap-3">
        <Spinner />
        <Typography>Loading registration options…</Typography>
      </div>
    );
  }

  if (pricing.error || !pricing.data || !defaultOption) {
    return (
      <StatusAlert
        notice={{
          type: "error",
          title: "Pricing unavailable",
          message:
            pricing.error?.message ??
            (pricing.data === null
              ? "Employer registration has not been configured yet."
              : "Registration packages could not be loaded."),
        }}
      />
    );
  }

  return children({
    configuration: pricing.data,
    previousAttemptIncomplete,
  });
}

export class CheckoutValidationError extends Error {
  constructor() {
    super("Check the form for missing or invalid fields.");
    this.name = "CheckoutValidationError";
  }
}
