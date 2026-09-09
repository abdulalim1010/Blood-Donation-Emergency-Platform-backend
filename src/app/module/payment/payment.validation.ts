import { z } from "zod";

const CreatePaymentZodSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Donation amount must be greater than 0"),

  message: z
    .string()
    .max(500)
    .optional(),

  isAnonymous: z
    .boolean()
    .optional()
    .default(false),
});

export const PaymentValidation = {
  CreatePaymentZodSchema,
};