import { z } from "zod";

const episodeStatusEnum = z.enum(["UNPUBLISHED", "PUBLISHED"]);
const episodeRelationEnum = z.enum(["SEQUEL", "PARALLEL", "STANDALONE"]);
const generatingStateEnum = z.enum(["GENERATING", "DONE"]);

const episodeCharacterSchema = z.object({
  characterId: z.number().int().positive(),
  importance: z.number().int().min(0).max(100).default(50),
});

export const createEpisodeSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  status: episodeStatusEnum.default("UNPUBLISHED"),
  relation: episodeRelationEnum.default("STANDALONE"),
  generatingState: generatingStateEnum.default("DONE"),
  parentId: z.number().int().positive().optional(),
  characters: z.array(episodeCharacterSchema).default([]),
  inheritRelation: z.boolean().default(true),
});

export const updateEpisodeSchema = z
  .object({
    number: z.number().int().positive().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    status: episodeStatusEnum.optional(),
    relation: episodeRelationEnum.optional(),
    generatingState: generatingStateEnum.optional(),
    parentId: z.number().int().positive().nullable().optional(),
    characters: z.array(episodeCharacterSchema).optional(),
    inheritRelation: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateEpisodeInput = z.infer<typeof createEpisodeSchema>;
export type UpdateEpisodeInput = z.infer<typeof updateEpisodeSchema>;

export const generateEpisodeSchema = z.object({
  relation: z.enum(["STANDALONE", "SEQUEL"]).default("STANDALONE"),
  parentId: z.number().int().positive().optional(),
  characterIds: z.array(z.number().int().positive()).default([]),
  inheritRelation: z.boolean().default(true),
  titleHint: z.string().optional(),
  summaryHint: z.string().optional(),
});

export type GenerateEpisodeInput = z.infer<typeof generateEpisodeSchema>;
