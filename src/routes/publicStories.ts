import { Hono } from "hono";
import { episodePageUsecase, storyUsecase } from "../lib/container.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/stories/:storyId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const story = await storyUsecase.getPublicStory(storyId);
  if (!story) return c.json({ error: "Not found" }, 404);
  return c.json(story);
});

app.get("/episodes/:episodeId/pages", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const pages = await episodePageUsecase.getPublicPages(episodeId);
  if (!pages) return c.json({ error: "Not found" }, 404);
  return c.json(pages);
});

export default app;
