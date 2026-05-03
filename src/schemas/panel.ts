import { z } from "zod";

export const panelSchema = z.object({
  id: z.string(),
  vertices: z.array(z.array(z.number())),
  prompt: z.string().default(""),
  imageUrl: z.string().nullable().optional(),
});

export const savePanelsSchema = z.array(panelSchema);

export type SavePanelsInput = z.infer<typeof savePanelsSchema>;
