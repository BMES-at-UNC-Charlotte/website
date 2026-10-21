"use client";

import Link from "next/link";
import { useAppForm } from "@/app/_components/form";
import { PaymentDisclaimer } from "@/app/_components/payment-disclaimer";
import { Typography } from "@/app/_components/typography";
import { type RadioCardOption } from "@/app/_components/form/radio-card-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { CUSTOM_SPONSORSHIP, formatDonationUsd } from "@/lib/donation";
import {
  CUSTOM_SPONSORSHIP_MAILTO,
  type SponsorshipTier,
} from "@/lib/sponsorship";

export function sponsorshipOptions(
  tiers: SponsorshipTier[],
): RadioCardOption[] {
  return [
    ...tiers.map((tier) => ({
      value: tier.priceId,
      title: tier.name,
      description: tier.description,
      action: formatDonationUsd(tier.amount),
    })),
    {
      value: CUSTOM_SPONSORSHIP,
      title: "Custom sponsorship",
      description: "A different amount or partnership, arranged by email.",
    },
  ];
}

export function SponsorshipPicker({ tiers }: { tiers: SponsorshipTier[] }) {
  const form = useAppForm({
    defaultValues: { tier: tiers[0]?.priceId ?? CUSTOM_SPONSORSHIP },
  });

  return (
    <Card>
      <CardHeader>
        <Typography variant="h3">Become a Sponsor</Typography>
      </CardHeader>
      <CardContent>
        <form.AppField name="tier">
          {(field) => (
            <field.RadioCardField
              label="Sponsorship package"
              hideLabel
              options={sponsorshipOptions(tiers)}
            />
          )}
        </form.AppField>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <form.Subscribe selector={(state) => state.values.tier}>
          {(value) => {
            const selected = tiers.find((tier) => tier.priceId === value);
            return selected ? (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  render={
                    <Link
                      href={`/sponsors/register?tier=${selected.priceId}`}
                    />
                  }
                  nativeButton={false}
                >
                  Continue to registration
                </Button>
                <PaymentDisclaimer />
              </>
            ) : (
              <Button
                size="lg"
                className="w-full"
                render={<a href={CUSTOM_SPONSORSHIP_MAILTO} />}
                nativeButton={false}
              >
                Email us about a custom sponsorship
              </Button>
            );
          }}
        </form.Subscribe>
      </CardFooter>
    </Card>
  );
}
