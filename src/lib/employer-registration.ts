import { z } from "zod";

const optionalText = z.string().trim().max(500).optional();
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => !value || /^https?:\/\/.+/i.test(value),
    "Enter a complete URL beginning with http:// or https://",
  )
  .optional();

export const employerRegistrationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  contactName: z.string().trim().min(1, "Full name is required").max(200),
  title: optionalText,
  representativeCount: z.number().int().min(1).max(4),
  addressCountry: z.string().trim().min(1, "Country is required").max(100),
  addressState: z.string().trim().min(1, "State is required").max(100),
  addressPostalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .max(30),
  addressCity: z.string().trim().min(1, "City is required").max(100),
  addressStreet: z
    .string()
    .trim()
    .min(1, "Street address is required")
    .max(300),
  division: optionalText,
  phone: z.string().trim().min(1, "Phone is required").max(50),
  email: z.string().trim().email("Enter a valid email address").max(320),
  fax: optionalText,
  thirdPartyRecruiter: z.boolean(),
  alumni: z.boolean().optional(),
  website: optionalUrl,
  overview: z.string().trim().min(1, "Company overview is required").max(5000),
  majorsRecruiting: z.array(z.string().max(100)).max(20),
  workAuthorizations: z.array(z.string().max(100)).max(20),
  workAuthorizationOther: optionalText,
  degreeLevels: z.array(z.string().max(100)).max(20),
  positionsAvailable: z.array(z.string().max(100)).max(20),
});

export const submitRegistrationSchema = z.object({
  registration: employerRegistrationSchema,
  priceId: z.string().min(1),
  confirmationTokenId: z.string().startsWith("ctoken_"),
  idempotencyKey: z.string().uuid(),
});

export const finalizeRegistrationSchema = z.object({
  attemptId: z.string().min(1).optional(),
  idempotencyKey: z.string().uuid(),
});

export type EmployerRegistrationInput = z.infer<
  typeof employerRegistrationSchema
>;

export const additionalRepresentativeCount = (representativeCount: number) =>
  Math.max(0, representativeCount - 2);

export const representativeSurcharge = (
  representativeCount: number,
  unitAmount: number,
) => additionalRepresentativeCount(representativeCount) * unitAmount;
