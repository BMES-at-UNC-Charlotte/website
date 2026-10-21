import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "@/server/api/trpc";
import { sponsorshipPriceIdsSchema } from "@/lib/sponsorship";
import { sponsorRegistrationSchema } from "@/lib/donation";
import { getStripe } from "@/server/stripe";
import {
  getSponsorshipCatalog,
  retrieveSponsorshipPrice,
} from "@/server/sponsorship-prices";

// Historical registrations can refer to prices that are no longer offered.
async function getSponsorPackages(priceIds: (string | null)[]) {
  const ids = [...new Set(priceIds.filter((id): id is string => Boolean(id)))];
  const packages = await Promise.all(
    ids.map(async (priceId) => {
      try {
        const price = await getStripe().prices.retrieve(priceId, {
          expand: ["product"],
        });
        const product = price.product;
        if (typeof product === "string" || product.deleted) return null;
        return {
          priceId,
          name: product.name,
          description: product.description ?? "",
        };
      } catch {
        // Stripe availability must not hide completed sponsorship records.
        return null;
      }
    }),
  );
  return new Map(
    packages.flatMap((item) => (item ? [[item.priceId, item] as const] : [])),
  );
}

function readSponsorRegistration(value: unknown) {
  const parsed = sponsorRegistrationSchema
    .extend({
      preferences: z.array(z.string()),
      partnershipInterests: z.array(z.string()),
    })
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

const completedSponsorship = {
  kind: "sponsorship",
  status: "SUCCEEDED",
} as const;
const recordInput = z.object({ id: z.string().cuid() });
const PAGE_SIZE = 25;
// Divisible by three so base64 chunks can be joined without intermediate padding.
const LOGO_CHUNK_BYTES = 768 * 1024;

export const sponsorshipRouter = createTRPCRouter({
  list: adminProcedure
    .input(z.object({ page: z.number().int().min(0).max(100000).default(0) }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.db.donationCheckout.findMany({
        where: completedSponsorship,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: input.page * PAGE_SIZE,
        take: PAGE_SIZE + 1,
        select: {
          id: true,
          sponsor: true,
          amount: true,
          currency: true,
          updatedAt: true,
          stripePriceId: true,
        },
      });
      const page = records.slice(0, PAGE_SIZE);
      const packages = await getSponsorPackages(
        page.map((record) => record.stripePriceId),
      );
      return {
        hasMore: records.length > PAGE_SIZE,
        items: page.map((record) => {
          const sponsor = readSponsorRegistration(record.sponsor);
          return {
            id: record.id,
            companyName: sponsor?.companyName ?? "Unknown company",
            contactName: sponsor?.contactName ?? "",
            email: sponsor?.email ?? "",
            amount: record.amount,
            currency: record.currency,
            // Payment synchronization stops updating a record once it succeeds.
            sponsoredAt: record.updatedAt,
            packageName:
              packages.get(record.stripePriceId ?? "")?.name ?? "Sponsorship",
          };
        }),
      };
    }),
  detail: adminProcedure.input(recordInput).query(async ({ ctx, input }) => {
    const record = await ctx.db.donationCheckout.findFirst({
      where: { id: input.id, ...completedSponsorship },
      select: {
        id: true,
        sponsor: true,
        amount: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        stripePriceId: true,
        stripeCheckoutSessionId: true,
        stripePaymentIntentId: true,
        logoName: true,
        logoContentType: true,
      },
    });
    if (!record)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sponsorship not found.",
      });
    const packages = await getSponsorPackages([record.stripePriceId]);
    return {
      id: record.id,
      registration: readSponsorRegistration(record.sponsor),
      amount: record.amount,
      currency: record.currency,
      registeredAt: record.createdAt,
      sponsoredAt: record.updatedAt,
      package: packages.get(record.stripePriceId ?? "") ?? null,
      priceId: record.stripePriceId,
      checkoutSessionId: record.stripeCheckoutSessionId,
      paymentIntentId: record.stripePaymentIntentId,
      hasLogo: Boolean(record.logoName && record.logoContentType),
    };
  }),
  logo: adminProcedure
    .input(recordInput.extend({ chunk: z.number().int().min(0).max(6) }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.donationCheckout.findFirst({
        where: { id: input.id, ...completedSponsorship },
        select: { logoData: true, logoName: true, logoContentType: true },
      });
      if (
        !record?.logoData ||
        !["image/png", "image/jpeg", "image/webp"].includes(
          record.logoContentType ?? "",
        )
      )
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sponsor logo not found.",
        });
      const bytes = Buffer.from(record.logoData);
      const start = input.chunk * LOGO_CHUNK_BYTES;
      if (start >= bytes.length)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid logo chunk.",
        });
      return {
        name: record.logoName,
        contentType: record.logoContentType!,
        base64: bytes
          .subarray(start, start + LOGO_CHUNK_BYTES)
          .toString("base64"),
        nextChunk:
          start + LOGO_CHUNK_BYTES < bytes.length ? input.chunk + 1 : null,
      };
    }),
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
