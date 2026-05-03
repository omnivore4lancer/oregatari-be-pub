import { z } from "zod";

export const createMaterialSchema = z.object({
  groupId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  aspectRatio: z.string().min(1),
  artStyle: z.string().min(1),
  locationMain: z.string().min(1),
  locationDetail: z.string().optional(),
  worldSetting: z.string().optional(),
  timeSlot: z.string().min(1),
  weather: z.string().min(1),
  skyDesc: z.string().optional(),
  lighting: z.string().optional(),
  fgLStructure: z.string().optional(),
  fgLTexture: z.string().optional(),
  fgLFurniture: z.string().optional(),
  fgLProps: z.string().optional(),
  mgCGround: z.string().optional(),
  mgCDecoration: z.string().optional(),
  mgCAtmosphere: z.string().optional(),
  mgRStructure: z.string().optional(),
  mgRItems: z.string().optional(),
  bgBuilding: z.string().optional(),
  bgTerrain: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const updateMaterialSchema = createMaterialSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
