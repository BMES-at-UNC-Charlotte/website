import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/admin/sign-in");
  }

  if (!session.user.emailVerified || !session.user.adminUser) {
    redirect("/admin/sign-in?error=unauthorized");
  }

  return <>{children}</>;
}
