import "server-only";

import { db } from "@/server/db";

export function normalizeOfficerEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getAdminUser(email: string) {
  const normalizedEmail = normalizeOfficerEmail(email);
  if (!normalizedEmail) return null;

  return db.adminUser.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, role: true },
  });
}

export async function isOfficer(email: string) {
  return (await getAdminUser(email)) !== null;
}

export async function syncAdminUserForLogin(userId: string) {
  return db.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    });

    if (!user) return null;

    const email = normalizeOfficerEmail(user.email);

    await transaction.adminUser.updateMany({
      where: {
        userId,
        ...(email ? { email: { not: email } } : {}),
      },
      data: { userId: null },
    });

    if (!user.emailVerified || !email) return null;

    const adminUser = await transaction.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!adminUser) return null;

    return transaction.adminUser.update({
      where: { id: adminUser.id },
      data: { userId },
      select: { id: true, email: true, role: true },
    });
  });
}
