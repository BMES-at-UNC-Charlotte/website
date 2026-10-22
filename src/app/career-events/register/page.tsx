import { RegisterFormPage } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    attempt?: string | string[];
    canceled?: string | string[];
  }>;
}) {
  const { attempt, canceled } = await searchParams;

  return (
    <RegisterFormPage
      attemptId={typeof attempt === "string" ? attempt : undefined}
      previousAttemptIncomplete={canceled === "1"}
    />
  );
}
