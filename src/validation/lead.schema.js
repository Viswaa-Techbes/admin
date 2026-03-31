import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  plan: z.string().optional(),
  service: z.string().optional(),
  pincode: z.string().optional(),
  paymentId: z.string().optional(),
});
