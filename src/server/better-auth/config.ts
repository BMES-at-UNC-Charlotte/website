import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";

import { env } from "@/env";
import { db } from "@/server/db";
import {
  isOfficer,
  normalizeOfficerEmail,
  syncAdminUserForLogin,
} from "@/server/officer-access";

export const auth = betterAuth({
  baseURL:
    env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`,
  database: prismaAdapter(db, {
    provider: "postgresql", // or "sqlite" or "mysql"
  }),
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.emailVerified || !(await isOfficer(user.email))) {
            return false;
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          if (!(await syncAdminUserForLogin(session.userId))) {
            return false;
          }
        },
      },
    },
  },
  plugins: [
    customSession(async ({ user, session }) => ({
      user: {
        ...user,
        adminUser: await db.adminUser.findFirst({
          where: {
            email: normalizeOfficerEmail(user.email),
            OR: [{ userId: user.id }, { userId: null }],
          },
          select: { id: true, email: true, role: true },
        }),
      },
      session,
    })),
  ],
});

export type Session = typeof auth.$Infer.Session;
