import { type Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatSurveyDate, surveyEmbedUrl } from "@/lib/surveys";
import { getLiveSurvey } from "@/server/surveys";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Survey | Charlotte BMES",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const survey = path?.length === 1 ? await getLiveSurvey(path[0]!) : null;
  const embedUrl = survey ? surveyEmbedUrl(survey.formUrl) : null;

  if (!survey || !embedUrl) {
    return (
      <Container className="pt-12" contentClassName="flex justify-center py-16">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>
              <Typography variant="h2">
                This survey link is invalid or has expired
              </Typography>
            </CardTitle>
            <CardDescription>
              Check the link or contact the person who shared it with you.
            </CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      className="flex h-dvh min-h-0 flex-col pt-12"
      contentClassName="flex min-h-0 flex-1 flex-col px-0 pt-0 pb-5 sm:px-6 sm:pt-0 sm:pb-6"
    >
      {/* Match Google Forms' standard content column inside the iframe. */}
      <div className="relative z-10 mx-auto flex w-9/10 max-w-[640px] shrink-0 items-center justify-end gap-1 py-1">
        <Typography
          variant="caption"
          className="text-foreground mr-auto translate-y-1.5"
        >
          {survey.closesOn
            ? `Open through ${formatSurveyDate(survey.closesOn)} at 11:59 PM (Charlotte time).`
            : "Having trouble with the form?"}
        </Typography>
        <Button
          variant="outline"
          size="xs"
          className="translate-y-1.5"
          nativeButton={false}
          render={
            <a
              href={survey.formUrl}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <ExternalLink />
          Open in new tab
        </Button>
      </div>
      <div className="relative min-h-0 flex-1">
        <iframe
          title={`Survey: ${survey.path}`}
          src={embedUrl}
          className="block h-full w-full border-0"
          referrerPolicy="no-referrer"
        />
        {/* Keep the visual top gutter in place while the form scrolls. */}
        <div
          aria-hidden="true"
          className="bg-background pointer-events-none absolute inset-x-0 top-0 h-3"
        />
      </div>
    </Container>
  );
}
