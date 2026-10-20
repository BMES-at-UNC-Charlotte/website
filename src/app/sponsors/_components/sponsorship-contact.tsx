import { Mail } from "lucide-react";
import { Typography } from "@/app/_components/typography";
import { Button } from "@/components/ui/button";
import { SPONSORSHIP_EMAIL, SPONSORSHIP_MAILTO } from "@/lib/sponsorship";

export function SponsorshipContact() {
  return (
    <div className="space-y-4">
      <Typography>
        Let&apos;s talk about your sponsorship. Email us to discuss benefits,
        recruiting opportunities, or a partnership that fits your company.
      </Typography>
      <Button
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
