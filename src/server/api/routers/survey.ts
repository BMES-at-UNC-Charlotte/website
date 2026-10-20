import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { surveyInputSchema } from "@/lib/surveys";
import { createTRPCRouter, officerProcedure } from "@/server/api/trpc";
import { expireSurveys } from "@/server/surveys";

function surveyWriteError(error: unknown): never {
  // Prisma can have separate class identities across development hot reloads.
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "That short link is already in use. Choose another one.",
      });
    }
    if (error.code === "P2025") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Survey not found." });
    }
  }
  throw error;
}

export const surveyRouter = createTRPCRouter({
  list: officerProcedure.query(async ({ ctx }) => {
    await expireSurveys();
    return ctx.db.survey.findMany({ orderBy: { createdAt: "desc" } });
  }),

  create: officerProcedure
    .input(surveyInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.survey.create({ data: input });
      } catch (error) {
        surveyWriteError(error);
      }
    }),

  update: officerProcedure
    .input(z.object({ id: z.string().cuid(), values: surveyInputSchema }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.survey.update({
          where: { id: input.id },
          data: input.values,
        });
      } catch (error) {
        surveyWriteError(error);
      }
    }),

  setLive: officerProcedure
    .input(z.object({ id: z.string().cuid(), live: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Clear an old closing date before re-enabling a survey.
      await expireSurveys();
      try {
        return await ctx.db.survey.update({
          where: { id: input.id },
          data: { live: input.live },
        });
      } catch (error) {
        surveyWriteError(error);
      }
    }),

  remove: officerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.survey.delete({ where: { id: input.id } });
      } catch (error) {
        surveyWriteError(error);
      }
    }),
});
