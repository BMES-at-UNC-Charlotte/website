import { z } from "zod";

export const employerRegistrationSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().trim().min(1, "Full name is required"),
  title: z.string().trim(),
  representativeCount: z
    .number()
    .int()
    .min(1, "Choose a representative count")
    .max(4),
  addressCountry: z.string().trim().min(1, "Country is required"),
  addressState: z.string().trim().min(1, "State is required"),
  addressPostalCode: z.string().trim().min(1, "Postal code is required"),
  addressCity: z.string().trim().min(1, "City is required"),
  addressStreet: z.string().trim().min(1, "Street address is required"),
  division: z.string().trim(),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().trim().email("Enter a valid email address"),
  fax: z.string().trim(),
  thirdPartyRecruiter: z.boolean(),
  alumni: z.boolean().optional(),
  website: z
    .string()
    .trim()
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .url("Enter a complete URL beginning with http:// or https://"),
      ]),
    ),
  overview: z.string().trim().min(1, "Company overview is required"),
  majorsRecruiting: z.array(z.string()),
  workAuthorizations: z.array(z.string()),
  workAuthorizationOther: z.string().trim(),
  degreeLevels: z.array(z.string()),
  positionsAvailable: z.array(z.string()),
});

export const checkoutSchema = employerRegistrationSchema.extend({
  packageId: z.string().min(1, "Choose a registration package"),
  priceId: z.string().min(1, "Choose a package tier"),
});

export type CheckoutValues = Omit<
  z.input<typeof checkoutSchema>,
  "thirdPartyRecruiter"
> & {
  thirdPartyRecruiter: boolean | undefined;
};

export const defaultValues: CheckoutValues = {
  companyName: "",
  contactName: "",
  title: "",
  representativeCount: 0,
  addressCountry: "",
  addressState: "",
  addressPostalCode: "",
  addressCity: "",
  addressStreet: "",
  division: "",
  phone: "",
  email: "",
  fax: "",
  thirdPartyRecruiter: undefined,
  alumni: undefined,
  website: "",
  overview: "",
  majorsRecruiting: [],
  workAuthorizations: [],
  workAuthorizationOther: "",
  degreeLevels: [],
  positionsAvailable: [],
  packageId: "",
  priceId: "",
};

export const submitRegistrationSchema = z.object({
  registration: employerRegistrationSchema,
  packageId: z.string().min(1),
  priceId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
});

export const finalizeRegistrationSchema = z
  .object({
    attemptId: z.string().min(1).optional(),
    idempotencyKey: z.string().uuid().optional(),
  })
  .refine((value) => value.attemptId ?? value.idempotencyKey);

export const additionalRepresentativeCount = (representativeCount: number) =>
  Math.max(0, representativeCount - 2);

export const representativeSurcharge = (
  representativeCount: number,
  unitAmount: number,
) => additionalRepresentativeCount(representativeCount) * unitAmount;
