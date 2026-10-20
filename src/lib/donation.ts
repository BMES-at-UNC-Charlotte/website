import { z } from "zod";

export const PRESET_DONATION_DOLLARS = [10, 20, 50, 100, 500] as const;
export const MIN_DONATION_CENTS = 100;
export const MAX_DONATION_CENTS = 1_000_000;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const INDIVIDUAL_DESCRIPTION =
  "A charitable contribution for parents, families, alumni, friends, and community members who would like to support our organization. Donations help fund student programs, educational activities, outreach events, professional development, supplies, and other organization initiatives.";
export const SPONSORSHIP_DESCRIPTION =
  "A sponsorship opportunity for employers, companies, professional organizations, and community partners that would like to financially support our organization and engage with our members.";
export const sponsorshipTierSchema = z
  .string()
  .regex(/^price_[a-zA-Z0-9]+$/, "Choose a sponsorship package");

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
export const sponsorDefaults: SponsorshipFormValues = {
  tier: "",
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  preferences: [],
  recruitingOpportunities: "",
  recruitingUrl: "",
  partnershipInterests: [],
  notes: "",
};

const logoSchema = z.object({
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
