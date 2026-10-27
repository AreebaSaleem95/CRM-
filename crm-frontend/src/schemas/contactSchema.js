import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  role: z.string().trim().min(2, "Role is required"),
  company: z.string().trim().min(2, "Company is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  city: z.string().trim().min(2, "City is required"),
});