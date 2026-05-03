import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(100).optional(),
});

export const updateUserSchema = z
  .object({
    email: z.email().optional(),
    name: z.string().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
