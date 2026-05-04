import { Hono } from "hono";
import { storyUsecase } from "../lib/container.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/stories/:storyId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const story = await storyUsecase.getPublicStory(storyId);
  if (!story) return c.json({ error: "Not found" }, 404);
  return c.json(story);
});

export default app;
