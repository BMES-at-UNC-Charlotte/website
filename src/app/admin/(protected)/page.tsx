import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { OfficerManager } from "@/app/admin/_components/officer-manager";

export default function AdminPage() {
  return (
    <Container contentClassName="space-y-10">
      <Typography variant="h1">Officer Dashboard</Typography>
      <OfficerManager />
    </Container>
  );
}
