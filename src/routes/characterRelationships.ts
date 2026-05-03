import { Hono } from "hono";
import { characterRelationshipUsecase } from "../lib/container.js";
import { numericId } from "../lib/params.js";
import { updateCharacterRelationshipSchema } from "../schemas/characterRelationship.js";

const app = new Hono();

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const relationships = await characterRelationshipUsecase.getRelationships(storyId);
  return c.json(relationships);
});

app.patch("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  const result = updateCharacterRelationshipSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: result.error.message }, 400);
  const updated = await characterRelationshipUsecase.updateRelationship(id, result.data);
  return c.json(updated);
});

app.delete("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  await characterRelationshipUsecase.deleteRelationship(id);
  return c.body(null, 204);
});

export default app;
