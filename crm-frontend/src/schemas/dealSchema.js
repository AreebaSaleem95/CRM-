import { z } from 'zod';

export const dealValidationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: 'Deal title must be at least 3 characters long' })
    .max(120, { message: 'Deal title cannot exceed 120 characters' }),
  company: z
    .string()
    .trim()
    .min(2, { message: 'Company name is required' })
    .max(100, { message: 'Company name cannot exceed 100 characters' }),
  contactName: z
    .string()
    .trim()
    .max(80, { message: 'Contact name cannot exceed 80 characters' })
    .optional()
    .or(z.literal('')),
  value: z.coerce
    .number({ invalid_type_error: 'Deal value must be a valid number' })
    .min(1, { message: 'Deal value must be greater than 0' }),
  currency: z
    .string()
    .default('PKR'),
  stage: z
    .string()
    .min(1, { message: 'Please select a pipeline stage' })
    .default('Lead In'),
  priority: z
    .enum(['Low', 'Medium', 'High'], {
      errorMap: () => ({ message: 'Please select a valid priority level' })
    })
    .default('Medium'),
  dueDate: z
    .string()
    .optional()
    .or(z.literal('')),
  assigned_to: z
    .union([z.number(), z.string(), z.null()])
    .optional()
});