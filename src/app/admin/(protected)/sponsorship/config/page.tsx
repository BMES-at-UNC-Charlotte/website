import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { SponsorshipSettings } from "@/app/admin/_components/sponsorship-settings";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/better-auth/server";

export default async function SponsorshipConfigurationPage() {
  const session = await getSession();
  if (!session?.user.emailVerified || session.user.adminUser?.role !== "ADMIN")
    redirect("/admin");
  return (
    <Container contentClassName="space-y-8">
      <Button
        variant="outline"
        render={<Link href="/admin/sponsorship" />}
        nativeButton={false}
      >
        <ArrowLeft /> Sponsorships
      </Button>
      <Typography variant="h1">Sponsorship packages</Typography>
      <SponsorshipSettings />
    </Container>
  );
}
