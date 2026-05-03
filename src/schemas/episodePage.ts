import { z } from "zod";

const depthLayersSchema = z.object({
  foreground: z.string().optional(),
  midground: z.string().optional(),
  background: z.string().optional(),
});

const panelCharacterSchema = z.object({
  name: z.string(),
  panel_position: z.string().optional(),
  shot: z.string().optional(),
  emotion: z.string().optional(),
  facing: z.string().optional(),
  pose: z.string().optional(),
  camera_proximity: z.string().optional(),
  lines: z
    .array(
      z.object({
        text: z.string(),
        char_text_position: z.string().optional(),
        type: z.string().optional(),
        balloon_shape: z.string().optional(),
      })
    )
    .optional(),
});

export const episodePanelSchema = z.object({
  panelOrder: z.number().int().positive(),
  pagePosition: z.string().optional(),
  description: z.string().optional(),
  cameraAngle: z.string().optional(),
  perspectiveIntensity: z.string().optional(),
  depthLayers: depthLayersSchema.optional().default({}),
  background: z.string().optional(),
  characters: z.array(panelCharacterSchema).optional().default([]),
  effects: z.array(z.string()).optional().default([]),
  lensAndLighting: z.string().optional(),
  frame: z.string().optional().default("normal"),
  scale: z.number().optional().default(1.0),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const episodePageRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  heightRatio: z.string(),
  layoutType: z.string(),
  panels: z.array(episodePanelSchema),
});

export const saveEpisodePageSchema = z.object({
  pageNumber: z.number().int().positive(),
  instructions: z.string().optional(),
  rows: z.array(episodePageRowSchema),
});

export type SaveEpisodePageInput = z.infer<typeof saveEpisodePageSchema>;
