import { Hono } from "hono";
import { panelUsecase } from "../lib/container.js";
import { savePanelsSchema } from "../schemas/panel.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const panels = await panelUsecase.getPanels(storyId);
  return c.json(panels);
});

app.put("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = savePanelsSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const panels = await panelUsecase.savePanels(storyId, result.data);
  return c.json(panels);
});

export default app;
