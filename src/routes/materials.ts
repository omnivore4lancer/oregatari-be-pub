import { Hono } from "hono";
import { materialUsecase } from "../lib/container.js";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "../schemas/material.js";
import { MaterialNotFoundError } from "../usecases/materialUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const groupId = c.req.query("groupId") ? Number(c.req.query("groupId")) : undefined;
  const search = c.req.query("search");
  const sort = c.req.query("sort") === "asc" ? "asc" : "desc";
  const materials = await materialUsecase.getMaterials(storyId, groupId, search, sort);
  return c.json(materials);
});

app.get("/:materialId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const materialId = numericId.parse(c.req.param("materialId"));
  try {
    const material = await materialUsecase.getMaterial(storyId, materialId);
    return c.json(material);
  } catch (e) {
    if (e instanceof MaterialNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = createMaterialSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const material = await materialUsecase.createMaterial(storyId, result.data);
  return c.json(material, 201);
});

app.put("/:materialId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const materialId = numericId.parse(c.req.param("materialId"));
  const result = updateMaterialSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  try {
    const material = await materialUsecase.updateMaterial(storyId, materialId, result.data);
    return c.json(material);
  } catch (e) {
    if (e instanceof MaterialNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.delete("/:materialId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const materialId = numericId.parse(c.req.param("materialId"));
  try {
    await materialUsecase.deleteMaterial(storyId, materialId);
    return c.json({ message: "Deleted" });
  } catch (e) {
    if (e instanceof MaterialNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

export default app;
