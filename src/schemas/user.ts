import { z } from "zod";

export const syncUserSchema = z.object({
  uid: z.string().min(1),
  email: z.email(),
});

export type SyncUserInput = z.infer<typeof syncUserSchema>;
