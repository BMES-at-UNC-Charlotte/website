import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { sponsorshipPriceIdsSchema } from "@/lib/sponsorship";
import {
  getSponsorshipCatalog,
  retrieveSponsorshipPrice,
} from "@/server/sponsorship-prices";

export const sponsorshipRouter = createTRPCRouter({
  configuration: adminProcedure.query(() => getSponsorshipCatalog()),
  save: adminProcedure
    .input(z.object({ priceIds: sponsorshipPriceIdsSchema }).strict())
    .mutation(async ({ ctx, input }) => {
      // Validate every price before replacing the saved list. Stripe is read-only here.
      await Promise.all(input.priceIds.map(retrieveSponsorshipPrice));
      await ctx.db.$transaction([
        ctx.db.sponsorshipPrice.deleteMany(),
        ctx.db.sponsorshipPrice.createMany({
          data: input.priceIds.map((priceId) => ({ priceId })),
        }),
      ]);
      return getSponsorshipCatalog();
    }),
});
