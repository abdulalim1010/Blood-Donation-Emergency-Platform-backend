import z from "zod";


const BloodRequestZodSchema = z.object({
  bloodGroup: z.enum([
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
  ]),

  unitsNeeded: z
    .number()
    .int()
    .min(1, "At least 1 unit is required"),

  hospitalName: z
    .string()
    .min(2, "Hospital name is required"),

  location: z
    .string()
    .min(2, "Location is required"),

  contactNumber: z
    .string()
    .min(11, "Contact number must be at least 11 digits"),

  urgency: z
    .enum([
      "NORMAL",
      "URGENT",
      "EMERGENCY",
    ])
    .optional(),

  neededAt: z
    .string()
    .datetime("Invalid date format"),

  description: z
    .string()
    .optional(),
});

const UpdateBloodRequestZodSchema =
  BloodRequestZodSchema.partial();

export const BloodRequestValidation = {
  BloodRequestZodSchema,
  UpdateBloodRequestZodSchema,
};