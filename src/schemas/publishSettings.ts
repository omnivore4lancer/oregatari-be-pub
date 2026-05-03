import { z } from "zod";

export const publishSettingsSchema = z.object({
  characterIds: z.array(z.number().int().positive()).default([]),
  visualStyle: z.string().optional(),
  layout: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string().max(20)).max(5).default([]),
  coverImageUrl: z.string().optional(),
});

export type PublishSettingsInput = z.infer<typeof publishSettingsSchema>;
