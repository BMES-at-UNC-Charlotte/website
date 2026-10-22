import { type Metadata } from "next";
import { Container } from "@/app/_components/container";
import { ContributionStatus } from "./status";
export const metadata: Metadata = {
  title: "Contribution status | Charlotte BMES",
  robots: { index: false },
};
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;
  return (
    <Container>
      <ContributionStatus
        reference={typeof reference === "string" ? reference : undefined}
      />
    </Container>
  );
}
