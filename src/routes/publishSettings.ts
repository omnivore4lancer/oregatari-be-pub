import { Hono } from "hono";
import { publishSettingsUsecase, jobUsecase, mastraClient } from "../lib/container.js";
import { publishSettingsSchema } from "../schemas/publishSettings.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const settings = await publishSettingsUsecase.getPublishSettings(storyId);
  return c.json(settings ?? null);
});

app.put("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = publishSettingsSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const settings = await publishSettingsUsecase.upsertPublishSettings(storyId, result.data);
  return c.json(settings);
});

app.post("/release", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const settings = await publishSettingsUsecase.publishStory(storyId);
  return c.json(settings);
});

app.delete("/release", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const settings = await publishSettingsUsecase.unpublishStory(storyId);
  return c.json(settings);
});

app.post("/generate-cover-image-job", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const runId = await mastraClient.startJob("cover-image-workflow", { storyId });
  const job = await jobUsecase.createCoverImageJob(storyId, runId);
  return c.json({ jobId: job.id }, 201);
});

export default app;
