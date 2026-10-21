import { type Metadata } from "next";
import Link from "next/link";
import { Container } from "@/app/_components/container";
import { PaymentDisclaimer } from "@/app/_components/payment-disclaimer";
import { Typography } from "@/app/_components/typography";
import { DonationForm } from "./_components/donation-form";
import { SponsorshipContact } from "./_components/sponsorship-contact";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDonationUsd, INDIVIDUAL_DESCRIPTION } from "@/lib/donation";
import { CUSTOM_SPONSORSHIP_MAILTO } from "@/lib/sponsorship";
import { getSponsorshipCatalog } from "@/server/sponsorship-prices";

export const metadata: Metadata = {
  title: "Donate & sponsor | Charlotte BMES",
  description:
    "Support Charlotte BMES with an individual donation or contact us about a corporate sponsorship.",
};
export const dynamic = "force-dynamic";

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, catalog] = await Promise.all([
    searchParams,
    getSponsorshipCatalog(),
  ]);
  return (
    <Container contentClassName="space-y-12 sm:space-y-16">
      <header className="max-w-3xl space-y-4">
        <Typography variant="h1">Support Charlotte BMES</Typography>
        <Typography>
          Help students build, learn, and connect through biomedical
          engineering.
        </Typography>
      </header>
      <section
        aria-labelledby="individual-heading"
        className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12"
      >
        <div className="space-y-5">
          <Typography variant="h2" id="individual-heading">
            Individual Supporter Donation
          </Typography>
          <Typography>{INDIVIDUAL_DESCRIPTION}</Typography>
        </div>
        <DonationForm canceled={status === "canceled"} />
      </section>
      <Separator />
      <section aria-labelledby="sponsorship-heading" className="space-y-8">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <header className="space-y-4">
            <Typography variant="h2" id="sponsorship-heading">
              Employer &amp; Corporate Sponsorship
            </Typography>
            <Typography>
              Support student programs and connect with Charlotte BMES members
              through professional development, recruiting, and outreach.
            </Typography>
          </header>
          <SponsorshipContact />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.tiers.map((tier) => (
            <Card key={tier.priceId}>
              <CardHeader className="space-y-3">
                <Typography variant="h3">{tier.name}</Typography>
                <Typography>{formatDonationUsd(tier.amount)}</Typography>
              </CardHeader>
              {tier.description ? (
                <CardContent className="flex-1">
                  <Typography>{tier.description}</Typography>
                </CardContent>
              ) : null}
              <CardFooter className="mt-auto flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  render={
                    <Link href={`/sponsors/register?tier=${tier.priceId}`} />
                  }
                  nativeButton={false}
                >
                  Choose {tier.name}
                </Button>
                <PaymentDisclaimer />
              </CardFooter>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <Typography variant="h3">Custom sponsorship</Typography>
            </CardHeader>
            <CardContent className="flex-1">
              <Typography>
                Have a different amount or partnership in mind? Contact us to
                work out the details together.
              </Typography>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                render={<a href={CUSTOM_SPONSORSHIP_MAILTO} />}
                nativeButton={false}
              >
                Discuss a custom sponsorship
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </Container>
  );
}
