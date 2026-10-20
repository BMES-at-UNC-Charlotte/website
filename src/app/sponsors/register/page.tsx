import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { SponsorshipForm } from "../_components/sponsorship-form";
import { SponsorshipContact } from "../_components/sponsorship-contact";
import { getSponsorshipCatalog } from "@/server/sponsorship-prices";

export const metadata: Metadata = {
  title: "Sponsor registration | Charlotte BMES",
};
export const dynamic = "force-dynamic";

export default async function SponsorRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; status?: string }>;
}) {
  const [{ tier, status }, catalog] = await Promise.all([
    searchParams,
    getSponsorshipCatalog(),
  ]);
  if (tier === "custom") redirect("/sponsors#sponsorship-heading");
  const selected = catalog.tiers.find((item) => item.priceId === tier);
  return (
    <Container contentClassName="space-y-8">
      <header className="max-w-3xl space-y-4">
        <Typography variant="h1">Sponsor registration</Typography>
        <Typography>
          Tell us about your company and how you&apos;d like to connect with
          Charlotte BMES.
        </Typography>
      </header>
      {catalog.tiers.length && (!tier || selected) ? (
        <SponsorshipForm
          initialTier={selected?.priceId ?? catalog.tiers[0]!.priceId}
          tiers={catalog.tiers}
          canceled={status === "canceled"}
        />
      ) : (
        <div className="max-w-3xl space-y-6">
          <Typography>
            This sponsorship package is unavailable. Email us to arrange your
            sponsorship.
          </Typography>
          <SponsorshipContact />
        </div>
      )}
    </Container>
  );
}
