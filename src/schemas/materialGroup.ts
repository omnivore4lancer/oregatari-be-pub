import { z } from "zod";

export const createMaterialGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateMaterialGroupInput = z.infer<typeof createMaterialGroupSchema>;
