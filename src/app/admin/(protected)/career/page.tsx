import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { EmployerEventsTable } from "@/app/admin/_components/employer-events-table";

export default function CareerAdminPage() {
  return (
    <Container contentClassName="space-y-10">
      <Typography variant="h1">Employer Events Dashboard</Typography>
      <EmployerEventsTable />
    </Container>
  );
}
