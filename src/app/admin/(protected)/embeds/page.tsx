import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { EmbeddedPageManager } from "@/app/admin/_components/embed-manager";

export default function EmbeddedPagesPage() {
  return (
    <Container contentClassName="space-y-8">
      <div className="space-y-3">
        <Typography variant="h1">Embedded pages</Typography>
        <Typography variant="subtitle">
          Create short links to forms, presentations, and other embedded pages.
        </Typography>
      </div>
      <EmbeddedPageManager />
    </Container>
  );
}
