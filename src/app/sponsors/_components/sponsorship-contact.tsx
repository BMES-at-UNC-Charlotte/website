import { Mail } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { Button } from "@/components/ui/button";
import { SPONSORSHIP_EMAIL, SPONSORSHIP_MAILTO } from "@/lib/sponsorship";

export function SponsorshipContact({
  title = "Prefer to talk first?",
}: {
  title?: string;
}) {
  return (
    <div className="space-y-3">
      <Typography variant="h4" as="h3">
        {title}
      </Typography>
      <Typography>
        Email us about benefits, recruiting, or a partnership that fits your
        company.
      </Typography>
      <Button
        variant="secondary"
        size="lg"
        render={<a href={SPONSORSHIP_MAILTO} />}
        nativeButton={false}
      >
        <Mail aria-hidden="true" />
        {SPONSORSHIP_EMAIL}
      </Button>
    </div>
  );
}
