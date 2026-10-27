import { z } from "zod";

export const leadStatuses = ["New", "Contacted", "Qualified", "Won", "Lost"] as const;
export const leadSources = ["Website", "Referral", "LinkedIn", "Email Campaign", "Event"] as const;
export const leadSortFields = [
  "name",
  "company",
  "status",
  "source",
  "value",
  "owner",
  "date",
] as const;

// Sirf Cloudinary ka URL allowed hai (ya null, photo hatane ke liye)
const avatarUrlSchema = z
  .string()
  .url("Invalid image URL")
  .refine((u) => u.startsWith("https://res.cloudinary.com/"), "Image must be uploaded through the CRM")
  .nullish();

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  company: z.string().trim().min(2, "Company is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  status: z.enum(leadStatuses),
  source: z.enum(leadSources),
  value: z.number().min(0, "Value cannot be negative"),
  avatarUrl: avatarUrlSchema,
});

export const updateLeadSchema = createLeadSchema.partial();

// Query params URL se string ban kar aate hain, isliye z.coerce.number() use hua hai
export const listLeadsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(leadStatuses).optional(),
  source: z.enum(leadSources).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(leadSortFields).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type LeadSortField = (typeof leadSortFields)[number];
export type SortOrder = "asc" | "desc";