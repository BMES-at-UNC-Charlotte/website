"use client";

import { Typography } from "@/app/_components/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  formatDonationUsd,
  parseDonationCents,
  PRESET_DONATION_DOLLARS,
} from "@/lib/donation";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

type DonationFormProps = {
  status?: string;
};

export function DonationForm({ status }: DonationFormProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [pendingKey, setPendingKey] = useState<number | "custom" | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const createCheckout = api.donation.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onSettled: () => {
      setPendingKey(null);
    },
  });

  const customCents = parseDonationCents(customValue);
  const busy = createCheckout.isPending;

  function startCheckout(amountCents: number, key: number | "custom") {
    if (busy) return;
    setPendingKey(key);
    createCheckout.mutate({ amountCents });
  }

  function openCustom() {
    setCustomOpen(true);
    requestAnimationFrame(() => customInputRef.current?.focus());
  }

  return (
    <Card className="border-secondary/30 bg-card ring-secondary/20">
      <CardHeader>
        <CardTitle className="text-2xl">Choose an amount</CardTitle>
        <CardDescription>
          Preset amounts go straight to Stripe. Use custom to enter your own.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {status === "success" ? (
          <Typography className="bg-primary/10 text-foreground rounded-3xl px-4 py-3">
            Thank you for sponsoring Charlotte BMES.
          </Typography>
        ) : null}
        {status === "canceled" ? (
          <Typography className="bg-muted text-muted-foreground rounded-3xl px-4 py-3">
            Checkout was canceled. You can choose an amount and try again.
          </Typography>
        ) : null}

        <div className="grid grid-cols-3 gap-2">
          {PRESET_DONATION_DOLLARS.map((dollars) => {
            const pending = pendingKey === dollars;
            return (
              <Button
                key={dollars}
                type="button"
                variant="outline"
                className="h-12 w-full text-base"
                disabled={busy}
                aria-label={`Donate ${formatDonationUsd(dollars * 100)} on Stripe`}
                onClick={() => startCheckout(dollars * 100, dollars)}
              >
                {pending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  `$${dollars}`
                )}
              </Button>
            );
          })}
          <Button
            type="button"
            variant={customOpen ? "default" : "outline"}
            className="h-12 w-full text-base"
            disabled={busy}
            aria-expanded={customOpen}
            aria-controls="custom-donation"
            onClick={openCustom}
          >
            Custom
          </Button>
        </div>

        {customOpen ? (
          <form
            id="custom-donation"
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (customCents === null) return;
              startCheckout(customCents, "custom");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom amount</Label>
              <InputGroup className="h-12">
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  ref={customInputRef}
                  id="custom-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="25"
                  value={customValue}
                  aria-invalid={customValue.length > 0 && customCents === null}
                  onChange={(event) => setCustomValue(event.target.value)}
                />
              </InputGroup>
              {customValue.length > 0 && customCents === null ? (
                <Typography variant="caption" className="text-destructive">
                  Enter an amount between $1 and $10,000.
                </Typography>
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={busy || customCents === null}
            >
              {pendingKey === "custom" ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : null}
              {pendingKey === "custom"
                ? "Redirecting to Stripe"
                : customCents
                  ? `Donate ${formatDonationUsd(customCents)}`
                  : "Donate"}
              {pendingKey === "custom" ? null : (
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              )}
            </Button>
          </form>
        ) : null}
      </CardContent>
      <CardFooter>
        <Typography
          variant="caption"
          className={cn(
            "text-muted-foreground",
            createCheckout.error && "text-destructive",
          )}
        >
          {createCheckout.error
            ? createCheckout.error.message
            : "You'll finish payment on Stripe's checkout page."}
        </Typography>
      </CardFooter>
    </Card>
  );
}
