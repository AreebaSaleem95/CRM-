import { z } from 'zod';

export const taskValidationSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Task description must be at least 3 characters long' })
    .max(100, { message: 'Task description cannot exceed 100 characters' }),
  dealId: z.any().optional(),
  relatedDeal: z.string().optional(),
  category: z.string().default('Follow-up'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueDate: z.string().min(1, { message: 'Due date is required' }),
});