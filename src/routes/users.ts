import { Hono } from "hono";
import { userUsecase } from "../lib/container.js";
import type { AppEnv } from "../lib/honoTypes.js";
import { createUserSchema, syncUserSchema, updateUserSchema } from "../schemas/user.js";
import { UserNotFoundError } from "../usecases/userUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono<AppEnv>();

app.post("/sync", async (c) => {
  const authUser = c.get("user");
  const result = syncUserSchema.safeParse({ uid: authUser.id, email: authUser.email });
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const user = await userUsecase.syncUser(result.data);
  return c.json(user);
});

app.get("/", async (c) => {
  const users = await userUsecase.getUsers();
  return c.json(users);
});

app.get("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  try {
    const user = await userUsecase.getUser(id);
    return c.json(user);
  } catch (e) {
    if (e instanceof UserNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/", async (c) => {
  const result = createUserSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const user = await userUsecase.registerUser(result.data);
  return c.json(user, 201);
});

app.put("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  const result = updateUserSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const user = await userUsecase.updateUser(id, result.data);
  return c.json(user);
});

app.delete("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  await userUsecase.deleteUser(id);
  return c.json({ message: "Deleted" });
});

export default app;
