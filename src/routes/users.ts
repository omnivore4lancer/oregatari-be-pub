import { Hono } from "hono";
import { userUsecase } from "../lib/container.js";
import type { AppEnv } from "../lib/honoTypes.js";
import { syncUserSchema } from "../schemas/user.js";

const app = new Hono<AppEnv>();

app.post("/sync", async (c) => {
  const authUser = c.get("user");
  const result = syncUserSchema.safeParse({ uid: authUser.id, email: authUser.email });
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const user = await userUsecase.syncUser(result.data);
  return c.json(user);
});

export default app;
