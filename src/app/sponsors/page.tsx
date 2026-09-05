import { DonationForm } from "@/app/sponsors/_components/donation-form";
import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake } from "lucide-react";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor Us | Charlotte BMES",
  description:
    "Sponsor the Biomedical Engineering Society at UNC Charlotte. Choose an amount and complete payment on Stripe.",
};

const giftUses = [
  "Materials and equipment for student design projects",
  "Hands-on Mini BEE outreach activities",
  "Professional development and networking events",
  "Student participation in BMES conferences",
];

export default async function SponsorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <Container contentClassName="space-y-12 sm:space-y-16">
      <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="space-y-5">
          <Typography variant="caption" className="text-secondary uppercase">
            Charlotte BMES
          </Typography>
          <Typography variant="h1">Sponsor Us</Typography>
          <Typography variant="subtitle" className="max-w-3xl leading-relaxed">
            Donations help our members turn classroom ideas into working
            projects, bring biomedical engineering activities into the
            community, and connect students with professional opportunities.
          </Typography>
        </div>

        <DonationForm status={status} />
      </section>

      <section>
        <Card>
          <CardHeader>
            <HeartHandshake
              className="text-secondary mb-3 size-8"
              aria-hidden="true"
            />
            <CardTitle className="text-2xl">Your gift at work</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-disc space-y-3 pl-5 text-base">
              {giftUses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </Container>
  );
}
