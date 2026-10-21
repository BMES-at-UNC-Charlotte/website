import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { donationCheckoutInput } from "@/lib/donation";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  createDonationCheckout,
  synchronizeDonationSession,
} from "@/server/donation-payments";

export const donationRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(donationCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createDonationCheckout(input, ctx.headers);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Donation checkout could not be started", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Checkout could not be started. Your payment has not been submitted. Try again or contact Charlotte BMES.",
        });
      }
    }),
  paymentStatus: publicProcedure
    .input(z.object({ sessionId: z.string().startsWith("cs_").max(255) }))
    .query(async ({ input }) => {
      try {
        const payment = await synchronizeDonationSession(input.sessionId);
        if (!payment)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This contribution could not be found.",
          });
        return payment;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Donation payment could not be verified", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "We couldn't confirm your payment status. Check your receipt or contact us for help.",
        });
      }
    }),
});
