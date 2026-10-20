import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { SurveyManager } from "@/app/admin/_components/survey-manager";

export default function SurveysPage() {
  return (
    <Container contentClassName="space-y-8">
      <div className="space-y-3">
        <Typography variant="h1">Surveys</Typography>
        <Typography variant="subtitle">
          Create short survey links to share with your audience. These pages
          aren’t listed on the public site.
        </Typography>
      </div>
      <SurveyManager />
    </Container>
  );
}
