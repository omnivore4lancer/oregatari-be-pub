import { Hono } from "hono";
import { materialGroupUsecase } from "../lib/container.js";
import { createMaterialGroupSchema } from "../schemas/materialGroup.js";
import { MaterialGroupNotFoundError } from "../usecases/materialGroupUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const groups = await materialGroupUsecase.getGroups(storyId);
  return c.json(groups);
});

app.post("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = createMaterialGroupSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const group = await materialGroupUsecase.createGroup(storyId, result.data);
  return c.json(group, 201);
});

app.delete("/:groupId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const groupId = numericId.parse(c.req.param("groupId"));
  try {
    await materialGroupUsecase.deleteGroup(storyId, groupId);
    return c.json({ message: "Deleted" });
  } catch (e) {
    if (e instanceof MaterialGroupNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

export default app;
