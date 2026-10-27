import { z } from "zod";

export const contactSortFields = ["name", "company", "role", "city", "date"] as const;

// Sirf Cloudinary ka URL allowed hai (ya null, photo hatane ke liye)
const avatarUrlSchema = z
  .string()
  .url("Invalid image URL")
  .refine((u) => u.startsWith("https://res.cloudinary.com/"), "Image must be uploaded through the CRM")
  .nullish();

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  role: z.string().trim().min(2, "Role is required"),
  company: z.string().trim().min(2, "Company is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  city: z.string().trim().min(2, "City is required"),
  avatarUrl: avatarUrlSchema,
});

export const updateContactSchema = createContactSchema.partial();

// Query params URL se string ban kar aate hain, isliye z.coerce.number() use hua hai
export const listContactsQuerySchema = z.object({
  search: z.string().trim().optional(),
  city: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(9),
  sortBy: z.enum(contactSortFields).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
export type ContactSortField = (typeof contactSortFields)[number];
export type SortOrder = "asc" | "desc";