import { Container } from "@/app/_components/container";
import { Typography } from "@/app/_components/typography";
import { OfficerManager } from "@/app/admin/_components/officer-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AdminPage() {
  return (
    <Container contentClassName="space-y-10">
      <Typography variant="h1">Officer Dashboard</Typography>
      <Card>
        <CardHeader>
          <CardTitle>Surveys</CardTitle>
          <CardDescription>
            Create survey pages, share QR codes, and manage when links are live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/admin/surveys" />}>
            Manage surveys
          </Button>
        </CardContent>
      </Card>
      <OfficerManager />
    </Container>
  );
}
