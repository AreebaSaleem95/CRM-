import { z } from "zod";
import { leadStatuses, leadSources } from "../constants/lead";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  company: z.string().trim().min(2, "Company is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  status: z.enum(leadStatuses),
  source: z.enum(leadSources),
  value: z
    .number({ invalid_type_error: "Value is required" })
    .min(0, "Value cannot be negative"),
});