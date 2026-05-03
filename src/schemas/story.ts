import { z } from "zod";

const eraEnum = z.enum(["MODERN", "MEDIEVAL", "FUTURE"]);

export const createStorySchema = z.object({
  name: z.string().min(1).max(200),
  genreIds: z.array(z.number().int().positive()).min(1).max(3),
  worldSetting: z.string().min(1),
  era: eraEnum,
  additionalElements: z.string().optional(),
});

export const updateStorySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    genreIds: z.array(z.number().int().positive()).min(1).max(3).optional(),
    worldSetting: z.string().optional(),
    era: eraEnum.optional(),
    additionalElements: z.string().optional(),
    eraBg: z.string().optional(),
    intro: z.string().optional(),
    dev: z.string().optional(),
    climax: z.string().optional(),
    conclusion: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
