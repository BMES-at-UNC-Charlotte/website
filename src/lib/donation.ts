import { z } from "zod";

export const PAYMENT_DISCLAIMER_PARAGRAPHS = [
  'This is not an official University of North Carolina at Charlotte ("University") website. This registration and payment portal is administered by a third-party payment processor. The payment processor is responsible for the security and system availability of the payment portal. The University does not endorse, recommend, guarantee, control, or accept responsibility for any product or service made available by the payment processor. The presence of a link to the payment processor\'s website does not imply any affiliation, endorsement, approval, or verification by the University.',
  "You understand that the payment processor's website may contain terms and privacy policies that are different from the University's terms and policies. You should review these provisions to ensure that you understand them, and to determine whether the website is suitable for you. The University does not review, and is not responsible for, these provisions.",
] as const;

export const PAYMENT_DISCLAIMER = PAYMENT_DISCLAIMER_PARAGRAPHS.join("\n\n");

const MIN_DONATION_CENTS = 100;
const MAX_DONATION_CENTS = 1_000_000;
export const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const sponsorshipTierSchema = z
  .string()
  .regex(/^price_[a-zA-Z0-9]+$/, "Choose a sponsorship package");
export const CUSTOM_SPONSORSHIP = "custom";

export const SPONSORSHIP_PREFERENCES = [
  "Company recognition",
  "Logo placement",
  "Promotion of employment opportunities",
  "Career or professional development events",
  "Opportunities to connect with students",
] as const;
export const PARTNERSHIP_INTERESTS = [
  "Professional development",
  "Networking",
  "Recruiting",
  "Technical events",
  "Outreach initiatives",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      !value ||
      (/^https?:\/\//i.test(value) &&
        z.string().url().safeParse(value).success),
    "Enter a complete URL beginning with https:// or http://",
  );
const amountSchema = z
  .number()
  .int()
  .min(MIN_DONATION_CENTS)
  .max(MAX_DONATION_CENTS);
export const sponsorRegistrationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactName: z.string().trim().min(1, "Contact name is required").max(200),
  email: z.string().trim().email("Enter a valid email address").max(254),
  phone: z.string().trim().min(1, "Phone number is required").max(50),
  website: optionalUrl,
  preferences: z
    .array(z.enum(SPONSORSHIP_PREFERENCES))
    .max(SPONSORSHIP_PREFERENCES.length),
  recruitingOpportunities: z.string().trim().max(4000),
  recruitingUrl: optionalUrl,
  partnershipInterests: z
    .array(z.enum(PARTNERSHIP_INTERESTS))
    .max(PARTNERSHIP_INTERESTS.length),
  notes: z.string().trim().max(4000),
});
export const sponsorshipFormSchema = sponsorRegistrationSchema.extend({
  tier: sponsorshipTierSchema,
});
export type SponsorshipFormValues = z.infer<typeof sponsorshipFormSchema>;
// Custom sponsorships are arranged by email, so only paid tiers need registration details.
export const sponsorshipSelectionFormSchema = z
  .custom<SponsorshipFormValues>()
  .superRefine((value, ctx) => {
    if (value?.tier === CUSTOM_SPONSORSHIP) return;
    const result = sponsorshipFormSchema.safeParse(value);
    if (!result.success)
      for (const issue of result.error.issues) ctx.addIssue(issue);
  });

export const logoSchema = z.object({
  name: z.string().trim().min(1).max(255),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  base64: z
    .string()
    .min(4)
    .max(Math.ceil(MAX_LOGO_BYTES / 3) * 4)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
export type SponsorLogo = z.infer<typeof logoSchema>;
export const donationCheckoutInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("individual"),
    amountCents: amountSchema,
    idempotencyKey: z.string().uuid(),
  }),
  z.object({
    kind: z.literal("sponsorship"),
    priceId: sponsorshipTierSchema,
    sponsor: sponsorRegistrationSchema,
    logo: logoSchema.optional(),
    idempotencyKey: z.string().uuid(),
  }),
]);
export type DonationCheckoutInput = z.infer<typeof donationCheckoutInput>;

export function createCheckoutKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function parseDonationCents(value: string): number | null {
  const normalized = value.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [dollars, fraction = ""] = normalized.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) &&
    cents >= MIN_DONATION_CENTS &&
    cents <= MAX_DONATION_CENTS
    ? cents
    : null;
}

export function formatDonationUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
