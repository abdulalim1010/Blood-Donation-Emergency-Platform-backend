import { z } from "zod";

const PatientProfileZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  phoneNo: z.string().min(11, "Phone number must be at least 11 digits"),
  address: z.string().min(2, "Address is required"),
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
});

const UpdatePatientProfileZodSchema = PatientProfileZodSchema.partial();

export const PatientValidation = {
  PatientProfileZodSchema,
  UpdatePatientProfileZodSchema,
};