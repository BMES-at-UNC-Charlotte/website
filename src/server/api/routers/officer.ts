import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  officerProcedure,
} from "@/server/api/trpc";
import { normalizeOfficerEmail } from "@/server/officer-access";
import { AdminRole } from "../../../../generated/prisma";

const officerEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .transform(normalizeOfficerEmail);

const adminUserSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  addedBy: {
    select: {
      name: true,
      email: true,
    },
  },
} as const;

export const officerRouter = createTRPCRouter({
  list: officerProcedure.query(({ ctx }) =>
    ctx.db.adminUser.findMany({
      orderBy: { email: "asc" },
      select: adminUserSelect,
    }),
  ),

  add: officerProcedure
    .input(
      z.object({
        email: officerEmailSchema,
        role: z.nativeEnum(AdminRole).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.adminUser.upsert({
        where: { email: input.email },
        update:
          ctx.adminUser.role === AdminRole.ADMIN && input.role
            ? { role: input.role }
            : {},
        create: {
          email: input.email,
          role:
            ctx.adminUser.role === AdminRole.ADMIN
              ? (input.role ?? AdminRole.OFFICER)
              : AdminRole.OFFICER,
          addedByUserId: ctx.session.user.id,
        },
        select: adminUserSelect,
      }),
    ),

  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        role: z.nativeEnum(AdminRole),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.adminUser.update({
        where: { id: input.id },
        data: { role: input.role },
        select: adminUserSelect,
      }),
    ),

  remove: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) =>
      ctx.db.adminUser.delete({
        where: { id: input.id },
        select: { id: true },
      }),
    ),
});
