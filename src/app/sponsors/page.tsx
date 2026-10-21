import { type Metadata } from "next";
import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { DonationForm } from "./_components/donation-form";
import { SponsorshipContact } from "./_components/sponsorship-contact";
import { SponsorshipPicker } from "./_components/sponsorship-picker";
import { Separator } from "@/components/ui/separator";
import {
  INDIVIDUAL_DESCRIPTION,
  SPONSORSHIP_DESCRIPTION,
} from "@/lib/donation";
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
        className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div className="space-y-5 lg:order-last">
          <Typography variant="h2" id="individual-heading">
            Individual Supporter Donation
          </Typography>
          <Typography>{INDIVIDUAL_DESCRIPTION}</Typography>
        </div>
        <DonationForm canceled={status === "canceled"} />
      </section>
      <Separator />
      <section
        aria-labelledby="sponsorship-heading"
        className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <div className="space-y-10 lg:order-last">
          <div className="space-y-5">
            <Typography variant="h2" id="sponsorship-heading">
              Employer &amp; Corporate Sponsorship
            </Typography>
            <Typography>{SPONSORSHIP_DESCRIPTION}</Typography>
          </div>
          <SponsorshipContact />
        </div>
        <SponsorshipPicker tiers={catalog.tiers} />
      </section>
    </Container>
  );
}
