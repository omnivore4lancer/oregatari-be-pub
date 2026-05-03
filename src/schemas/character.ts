import { z } from "zod";

export const archetypeRoleSchema = z.enum(['MENTOR', 'SHADOW', 'HERALD', 'SHAPESHIFTER']).optional()

export const createCharacterSchema = z.object({
  isProtagonist: z.boolean().default(false),
  name: z.string().min(1),
  role: z.string().optional(),
  archetypeRole: archetypeRoleSchema,
  age: z.string().optional(),
  gender: z.string().optional(),
  overview: z.string().optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  motivation: z.string().optional(),
  background: z.string().optional(),
  skills: z.array(z.string()).default([]),
  avatarColor: z.string().optional(),
});

export const updateCharacterSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.string().optional(),
    archetypeRole: archetypeRoleSchema,
    age: z.string().optional(),
    gender: z.string().optional(),
    overview: z.string().optional(),
    appearance: z.string().optional(),
    personality: z.string().optional(),
    motivation: z.string().optional(),
    background: z.string().optional(),
    skills: z.array(z.string()).optional(),
    avatarColor: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
