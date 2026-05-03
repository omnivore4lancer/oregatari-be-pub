import { Hono } from "hono";
import { publishSettingsUsecase, jobUsecase } from "../lib/container.js";
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

app.post("/generate-cover-image-job", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";

  const createRes = await fetch(`${mastraUrl}/api/workflows/cover-image-workflow/create-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!createRes.ok) {
    return c.json({ error: "Mastra error", detail: await createRes.text() }, 502);
  }
  const { runId } = (await createRes.json()) as { runId: string };

  const startRes = await fetch(
    `${mastraUrl}/api/workflows/cover-image-workflow/start?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { storyId } }),
    },
  );
  if (!startRes.ok) {
    return c.json({ error: "Mastra error", detail: await startRes.text() }, 502);
  }

  const job = await jobUsecase.createCoverImageJob(storyId, runId);
  return c.json({ jobId: job.id }, 201);
});

export default app;
