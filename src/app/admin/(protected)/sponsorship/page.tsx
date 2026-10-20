import { Container } from "@/app/_components/container";
import { redirect } from "next/navigation";
import { Typography } from "@/app/_components/typography";
import { SponsorshipSettings } from "@/app/admin/_components/sponsorship-settings";
import { getSession } from "@/server/better-auth/server";

export default async function SponsorshipSettingsPage() {
  const session = await getSession();
  if (!session?.user.emailVerified || session.user.adminUser?.role !== "ADMIN")
    redirect("/admin");
  return (
    <Container contentClassName="space-y-8">
      <Typography variant="h1">Sponsorship prices</Typography>
      <Typography>
        Add the Stripe Price IDs to offer as sponsorships. Names, descriptions,
        and prices come from Stripe. Packages appear from lowest to highest
        price. Custom sponsorships always go to email.
      </Typography>
      <Typography>
        Each price must be active, fixed, one-time, in USD, and at least $1,
        with an active product in the Stripe account and mode configured for
        this site. It does not need to be the product&apos;s default price.
      </Typography>
      <SponsorshipSettings />
    </Container>
  );
}
