import { Container } from "@/app/_components/container";
import { redirect } from "next/navigation";
import { Typography } from "@/app/_components/typography";
import { SponsorshipManager } from "@/app/admin/_components/sponsorship-manager";
import { getSession } from "@/server/better-auth/server";

export default async function SponsorshipPage() {
  const session = await getSession();
  if (!session?.user.emailVerified || session.user.adminUser?.role !== "ADMIN")
    redirect("/admin");
  return (
    <Container contentClassName="space-y-8">
      <Typography variant="h1">Sponsorships</Typography>
      <SponsorshipManager />
    </Container>
  );
}
