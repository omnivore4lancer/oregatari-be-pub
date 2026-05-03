import { Hono } from "hono";
import { z } from "zod";
import { episodePageUsecase, jobUsecase, mastraClient } from "../lib/container.js";
import { mastraErrorMessage } from "../lib/mastraClient.js";
import { saveEpisodePageSchema } from "../schemas/episodePage.js";
import { numericId } from "../lib/params.js";
import { JobType } from "../repositories/jobRepository.js";

const app = new Hono();

app.get("/", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const pages = await episodePageUsecase.getPages(episodeId);
  return c.json(pages);
});

app.put("/:pageNumber", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const result = saveEpisodePageSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const page = await episodePageUsecase.savePage(episodeId, result.data);
  return c.json(page);
});

app.delete("/", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  await episodePageUsecase.deletePages(episodeId);
  return c.json({ message: "Deleted" });
});

app.post("/generate", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const upstream = await mastraClient.stream("panel-layout-workflow", { episodeId });
  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
});

app.post("/generate-prompt", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const upstream = await mastraClient.stream("page-prompt-workflow", { episodeId });
  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
});

const generateImageBodySchema = z.object({
  pageNumber: z.number().int().positive().optional(),
});

app.get("/jobs", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const jobs = await jobUsecase.findRunningByEpisodeId(episodeId);

  // RUNNING ジョブの Mastra 実行状態を確認し、完了済みなら DB を更新する
  await Promise.all(
    jobs.map(async (job) => {
      try {
        const workflowId = mastraClient.workflowIdForJobType(job.jobType);
        const run = await mastraClient.getRunStatus(workflowId, job.mastraRunId);
        const result = run.result as { usedModel?: string; imageModel?: string | null } | undefined;
        if (run.status === "success") await jobUsecase.markDone(job.id, result?.usedModel, result?.imageModel);
        else if (run.status === "failed") await jobUsecase.markFailed(job.id, mastraErrorMessage(run.error) ?? undefined);
      } catch {
        // Mastra への疎通失敗は無視
      }
    }),
  );

  // RUNNING + 直近60秒以内に FAILED + 直近30秒以内に DONE になったジョブを返す
  const [stillRunning, recentFailed, recentDone] = await Promise.all([
    jobUsecase.findRunningByEpisodeId(episodeId),
    jobUsecase.findRecentlyFailedByEpisodeId(episodeId),
    jobUsecase.findRecentlyDoneByEpisodeId(episodeId),
  ]);

  return c.json([
    ...stillRunning.map((j) => ({ id: j.id, pageNumber: j.pageNumber, status: "running" as const, errorMessage: null, jobType: j.jobType.toLowerCase() as 'image_generation' | 'panel_layout', usedModel: j.usedModel ?? null, imageModel: j.imageModel ?? null })),
    ...recentFailed.map((j) => ({ id: j.id, pageNumber: j.pageNumber, status: "failed" as const, errorMessage: j.errorMessage, jobType: j.jobType.toLowerCase() as 'image_generation' | 'panel_layout', usedModel: j.usedModel ?? null, imageModel: j.imageModel ?? null })),
    ...recentDone.map((j) => ({ id: j.id, pageNumber: j.pageNumber, status: "done" as const, errorMessage: null, jobType: j.jobType.toLowerCase() as 'image_generation' | 'panel_layout', usedModel: j.usedModel ?? null, imageModel: j.imageModel ?? null })),
  ]);
});

app.post("/generate-layout-job", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const runId = await mastraClient.startJob("panel-layout-full-workflow", { episodeId });
  const job = await jobUsecase.create(episodeId, runId, undefined, JobType.PANEL_LAYOUT);
  return c.json({ jobId: job.id }, 201);
});

app.post("/generate-image-job", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const body = c.req.header("content-type")?.includes("application/json")
    ? generateImageBodySchema.parse(await c.req.json())
    : {};
  const runId = await mastraClient.startJob("page-image-workflow", { episodeId, ...body });
  const job = await jobUsecase.create(episodeId, runId, body.pageNumber);
  return c.json({ jobId: job.id }, 201);
});

app.post("/generate-image", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const body = c.req.header("content-type")?.includes("application/json")
    ? generateImageBodySchema.parse(await c.req.json())
    : {};
  const upstream = await mastraClient.stream("page-image-workflow", { episodeId, ...body });
  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
});

export default app;
