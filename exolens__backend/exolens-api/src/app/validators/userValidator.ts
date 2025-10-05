import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(3, "The name must be at least 3 characters long."),
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "The password must be at least 6 characters long."),
});

export type RegisterUserDto = z.infer<typeof registerUserSchema>;