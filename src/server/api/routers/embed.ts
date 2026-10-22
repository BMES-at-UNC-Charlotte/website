import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { embeddedPageInputSchema } from "@/lib/embeds";
import { createTRPCRouter, officerProcedure } from "@/server/api/trpc";
import { expireEmbeddedPages } from "@/server/embeds";

function embeddedPageWriteError(error: unknown): never {
  // Prisma can have separate class identities across development hot reloads.
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "That short link is already in use. Choose another one.",
      });
    }
    if (error.code === "P2025") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Embedded page not found.",
      });
    }
  }
  throw error;
}

export const embedRouter = createTRPCRouter({
  list: officerProcedure.query(async ({ ctx }) => {
    await expireEmbeddedPages();
    return ctx.db.embeddedPage.findMany({ orderBy: { createdAt: "desc" } });
  }),

  create: officerProcedure
    .input(embeddedPageInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.embeddedPage.create({ data: input });
      } catch (error) {
        embeddedPageWriteError(error);
      }
    }),

  update: officerProcedure
    .input(z.object({ id: z.string().cuid(), values: embeddedPageInputSchema }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.embeddedPage.update({
          where: { id: input.id },
          data: input.values,
        });
      } catch (error) {
        embeddedPageWriteError(error);
      }
    }),

  setLive: officerProcedure
    .input(z.object({ id: z.string().cuid(), live: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Clear an old closing date before re-enabling a page.
      await expireEmbeddedPages();
      try {
        return await ctx.db.embeddedPage.update({
          where: { id: input.id },
          data: { live: input.live },
        });
      } catch (error) {
        embeddedPageWriteError(error);
      }
    }),

  remove: officerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.embeddedPage.delete({ where: { id: input.id } });
      } catch (error) {
        embeddedPageWriteError(error);
      }
    }),
});
