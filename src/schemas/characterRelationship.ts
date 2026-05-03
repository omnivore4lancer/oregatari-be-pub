import { z } from "zod";

export const updateCharacterRelationshipSchema = z
  .object({
    type: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type UpdateCharacterRelationshipInput = z.infer<
  typeof updateCharacterRelationshipSchema
>;
