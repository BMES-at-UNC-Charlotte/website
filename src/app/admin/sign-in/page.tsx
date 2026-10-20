import { Container } from "@/app/_components/container";
import { GoogleSignInButton } from "@/app/admin/sign-in/_components/google-sign-in-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

type AdminSignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminSignInPage({
  searchParams,
}: AdminSignInPageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);

  if (session?.user.emailVerified && session.user.adminUser) {
    redirect("/admin");
  }

  return (
    <Container contentClassName="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Sign In</CardTitle>
          <CardDescription>
            Sign in with an authorized officer account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <GoogleSignInButton />
            {params.error ? (
              <Alert variant="destructive">
                <AlertDescription>
                  The selected account is not authorized to access this page.
                </AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </Container>
  );
}
