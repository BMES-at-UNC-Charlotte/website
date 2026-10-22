import "server-only";

import { embeddedPagePathSchema, embeddedPageToday } from "@/lib/embeds";
import { db } from "@/server/db";

export async function expireEmbeddedPages(path?: string) {
  // Date-only values sort chronologically. The selected day stays open until
  // midnight in Charlotte, even when the server runs in UTC or DST changes.
  return db.embeddedPage.updateMany({
    where: {
      ...(path === undefined ? {} : { path }),
      closesOn: { lt: embeddedPageToday() },
    },
    data: { live: false, closesOn: null },
  });
}

export async function getLiveEmbeddedPage(path: string) {
  const parsed = embeddedPagePathSchema.safeParse(path);
  if (!parsed.success) return null;

  // Never load a closed page's content in the public request. Normal live
  // visits need only one indexed read, with the date enforced in the query.
  const page = await db.embeddedPage.findFirst({
    // Internal officer comments must never enter the public page payload.
    select: { path: true, url: true, closesOn: true },
    where: {
      path: parsed.data,
      live: true,
      OR: [{ closesOn: null }, { closesOn: { gte: embeddedPageToday() } }],
    },
  });
  if (page) return page;

  // Invalid/off/expired links share the same response. A conditional update
  // clears old dates without turning off a concurrently extended page.
  await expireEmbeddedPages(parsed.data);
  return null;
}
