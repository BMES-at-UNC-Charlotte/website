import { type Metadata } from "next";
import Image from "next/image";
import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { DonationForm } from "./_components/donation-form";
import { SponsorshipContact } from "./_components/sponsorship-contact";
import { SponsorshipPicker } from "./_components/sponsorship-picker";
import { Separator } from "@/components/ui/separator";
import { getSponsorshipCatalog } from "@/server/sponsorship-prices";

export const metadata: Metadata = {
  title: "Support Us | Charlotte BMES",
  description:
    "Support Charlotte BMES with an individual donation or contact us about a corporate sponsorship.",
};
export const dynamic = "force-dynamic";

export default async function SupportUsPage({
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
        <div className="space-y-5">
          <Typography variant="h2" id="individual-heading">
            Individual Supporter Donation
          </Typography>
          <Typography>
            A charitable contribution for parents, families, alumni, friends,
            and community members who would like to support our organization.
            Donations help fund student programs, educational activities,
            outreach events, professional development, supplies, and other
            organization initiatives.
          </Typography>
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
            <Typography>
              A sponsorship opportunity for employers, companies, professional
              organizations, and community partners that would like to
              financially support our organization and engage with our members.
            </Typography>
          </div>
          <SponsorshipContact />
        </div>
        <SponsorshipPicker tiers={catalog.tiers} />
      </section>
      <Separator />
      <section
        aria-labelledby="our-sponsors-heading"
        className="space-y-8 text-center"
      >
        <Typography variant="h2" id="our-sponsors-heading">
          Our Sponsors
        </Typography>
        <div className="mx-auto grid max-w-3xl items-center justify-items-center gap-10 sm:grid-cols-2">
          <Image
            src="/sponsors/honeywell.png"
            alt="Honeywell"
            width={800}
            height={147}
            sizes="(min-width: 640px) 350px, calc(100vw - 2rem)"
            className="h-16 w-auto max-w-full object-contain"
          />
          <Image
            src="/sponsors/solidworks.png"
            alt="Dassault Systèmes SOLIDWORKS"
            width={1280}
            height={263}
            sizes="(min-width: 640px) 350px, calc(100vw - 2rem)"
            className="h-16 w-auto max-w-full object-contain"
          />
        </div>
      </section>
    </Container>
  );
}
