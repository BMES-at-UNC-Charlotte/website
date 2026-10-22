"use client";

import { useRef, useState } from "react";
import { Typography } from "@/app/_components/typography";
import { PaymentDisclaimer } from "@/app/_components/payment-disclaimer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import {
  createCheckoutKey,
  donationCheckoutInput,
  formatDonationUsd,
  parseDonationCents,
} from "@/lib/donation";
import { api } from "@/trpc/react";

const DONATION_CHECKOUT_KEY = "bmes-individual-checkout";
const PRESET_DONATION_DOLLARS = [10, 20, 50, 100, 500] as const;

export function DonationForm({ canceled = false }: { canceled?: boolean }) {
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const customInput = useRef<HTMLInputElement>(null);
  const createCheckout = api.donation.createCheckoutSession.useMutation();
  const amount = parseDonationCents(customValue);
  const invalid =
    custom && amount === null && (submitted || customValue.length > 0);
  const busy = createCheckout.isPending;

  function checkout(cents: number) {
    if (busy) return;
    const previous = createCheckout.variables;
    let input = {
      kind: "individual" as const,
      amountCents: cents,
      idempotencyKey:
        previous?.kind === "individual" && previous.amountCents === cents
          ? previous.idempotencyKey
          : createCheckoutKey(),
    };
    try {
      const saved = sessionStorage.getItem(DONATION_CHECKOUT_KEY);
      const parsed = donationCheckoutInput.safeParse(
        saved ? JSON.parse(saved) : null,
      );
      if (
        parsed.success &&
        parsed.data.kind === "individual" &&
        parsed.data.amountCents === cents
      )
        input = parsed.data;
      sessionStorage.setItem(DONATION_CHECKOUT_KEY, JSON.stringify(input));
    } catch {
      /* The mutation retains its request when browser storage is unavailable. */
    }
    createCheckout.mutate(input, {
      onSuccess: ({ url }) => window.location.assign(url),
    });
  }

  return (
    <Card>
      <CardHeader>
        <Typography variant="h3" id="donation-amount-label">
          Make a Donation
        </Typography>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            if (amount === null) {
              customInput.current?.focus();
              return;
            }
            checkout(amount);
          }}
        >
          {canceled ? (
            <Alert>
              <AlertTitle>Checkout canceled</AlertTitle>
              <AlertDescription>
                Choose an amount to try again.
              </AlertDescription>
            </Alert>
          ) : null}
          <Field>
            <div
              className="grid grid-cols-3 gap-2"
              role="group"
              aria-labelledby="donation-amount-label"
            >
              {PRESET_DONATION_DOLLARS.map((dollars) => (
                <Button
                  key={dollars}
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={busy}
                  onClick={() => checkout(dollars * 100)}
                >
                  {formatDonationUsd(dollars * 100)}
                </Button>
              ))}
              <Button
                type="button"
                variant={custom ? "default" : "outline"}
                size="lg"
                disabled={busy}
                aria-expanded={custom}
                onClick={() => {
                  setCustom(!custom);
                  createCheckout.reset();
                }}
              >
                Custom
              </Button>
            </div>
          </Field>
          {custom ? (
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor="custom-amount">
                Custom amount (USD)
              </FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  ref={customInput}
                  autoFocus
                  id="custom-amount"
                  inputMode="decimal"
                  placeholder="25.00"
                  value={customValue}
                  disabled={busy}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? "custom-amount-error" : undefined}
                  onChange={(event) => {
                    setCustomValue(event.target.value);
                    createCheckout.reset();
                  }}
                />
              </InputGroup>
              {invalid ? (
                <FieldError id="custom-amount-error">
                  Enter $1 to $10,000 with up to two decimal places.
                </FieldError>
              ) : null}
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? <Spinner /> : null}
                {busy
                  ? "Loading…"
                  : amount
                    ? `Donate ${formatDonationUsd(amount)}`
                    : "Donate"}
              </Button>
            </Field>
          ) : null}
          {busy && !custom ? (
            <div role="status" className="flex items-center gap-2">
              <Spinner />
              Loading…
            </div>
          ) : null}
          {createCheckout.error ? (
            <Alert variant="destructive">
              <AlertTitle>Checkout unavailable</AlertTitle>
              <AlertDescription>
                {createCheckout.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </form>
      </CardContent>
      <CardFooter>
        <PaymentDisclaimer />
      </CardFooter>
    </Card>
  );
}
