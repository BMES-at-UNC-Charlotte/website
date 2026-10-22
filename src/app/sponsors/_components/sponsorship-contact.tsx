import { Mail } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { Button } from "@/components/ui/button";
import { SPONSORSHIP_EMAIL } from "@/lib/sponsorship";

export function SponsorshipContact({
  title = "Prefer to talk first?",
  description = "Email us about benefits, recruiting, or a partnership that fits your company.",
  href = `mailto:${SPONSORSHIP_EMAIL}?subject=${encodeURIComponent("Charlotte BMES sponsorship inquiry")}`,
}: {
  title?: string;
  description?: string;
  href?: string;
}) {
  return (
    <div className="space-y-3">
      <Typography variant="h4" as="h3">
        {title}
      </Typography>
      <Typography>{description}</Typography>
      <Button
        variant="secondary"
        size="lg"
        render={<a href={href} />}
        nativeButton={false}
      >
        <Mail aria-hidden="true" />
        {SPONSORSHIP_EMAIL}
      </Button>
    </div>
  );
}
