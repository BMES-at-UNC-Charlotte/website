import { z } from "zod";

export const SURVEY_TIME_ZONE = "America/New_York";

export function surveyToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SURVEY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isSurveyExpired(closesOn: string | null, now = new Date()) {
  return closesOn !== null && closesOn < surveyToday(now);
}

export function surveyEmbedUrl(formUrl: string) {
  try {
    const url = new URL(formUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    if (url.hostname === "docs.google.com") {
      if (
        url.protocol !== "https:" ||
        !/^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[\w-]+\/viewform\/?$/.test(
          url.pathname,
        )
      ) {
        return null;
      }
      url.searchParams.set("embedded", "true");
      return url.toString();
    }
    return formUrl;
  } catch {
    return null;
  }
}

export const surveyPathSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter a short link.")
  .max(64, "Use 64 characters or fewer.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use letters, numbers, and single hyphens between words.",
  );

const closingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid closing date.")
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value &&
      value >= "2000-01-01"
    );
  }, "Enter a valid closing date.");

export const surveyInputSchema = z
  .object({
    comment: z.string().trim().max(2000),
    path: surveyPathSchema,
    formUrl: z
      .string()
      .trim()
      .max(2048)
      .url("Enter a valid URL.")
      .refine(
        (value) => surveyEmbedUrl(value) !== null,
        "Enter an HTTP or HTTPS URL. For Google Forms, paste the full responder link ending in /viewform.",
      ),
    live: z.boolean(),
    closesOn: closingDateSchema.nullable(),
  })
  .superRefine((value, context) => {
    if (isSurveyExpired(value.closesOn)) {
      context.addIssue({
        code: "custom",
        path: ["closesOn"],
        message: "Choose today or a future closing date, or clear the date.",
      });
    }
  });

export type SurveyInput = z.infer<typeof surveyInputSchema>;

export function formatSurveyDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
