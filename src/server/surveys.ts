import "server-only";

import { surveyPathSchema, surveyToday } from "@/lib/surveys";
import { db } from "@/server/db";

export async function expireSurveys(path?: string) {
  // Date-only values sort chronologically. The selected day stays open until
  // midnight in Charlotte, even when the server runs in UTC or DST changes.
  return db.survey.updateMany({
    where: {
      ...(path === undefined ? {} : { path }),
      closesOn: { lt: surveyToday() },
    },
    data: { live: false, closesOn: null },
  });
}

export async function getLiveSurvey(path: string) {
  const parsed = surveyPathSchema.safeParse(path);
  if (!parsed.success) return null;

  // Never load a closed survey's content in the public request. Normal live
  // visits need only one indexed read, with the date enforced in the query.
  const survey = await db.survey.findFirst({
    // Internal officer comments must never enter the public page payload.
    select: { path: true, formUrl: true, closesOn: true },
    where: {
      path: parsed.data,
      live: true,
      OR: [{ closesOn: null }, { closesOn: { gte: surveyToday() } }],
    },
  });
  if (survey) return survey;

  // Invalid/off/expired links share the same response. A conditional update
  // clears old dates without turning off a concurrently extended survey.
  await expireSurveys(parsed.data);
  return null;
}
