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
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <Container>
      <ContributionStatus
        sessionId={typeof session_id === "string" ? session_id : undefined}
      />
    </Container>
  );
}
