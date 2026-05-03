import { Hono } from "hono";
import { z } from "zod";
import { episodePageUsecase, jobUsecase } from "../lib/container.js";
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
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const runId = crypto.randomUUID();

  const upstream = await fetch(
    `${mastraUrl}/api/workflows/panel-layout-workflow/stream?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { episodeId } }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return c.json({ error: "Mastra error", detail }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});

app.post("/generate-prompt", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const runId = crypto.randomUUID();

  const upstream = await fetch(
    `${mastraUrl}/api/workflows/page-prompt-workflow/stream?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { episodeId } }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return c.json({ error: "Mastra error", detail }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});

const generateImageBodySchema = z.object({
  pageNumber: z.number().int().positive().optional(),
});

const WORKFLOW_BY_JOB_TYPE: Record<string, string> = {
  [JobType.PANEL_LAYOUT]: "panel-layout-full-workflow",
  [JobType.IMAGE_GENERATION]: "page-image-workflow",
};

app.get("/jobs", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const jobs = await jobUsecase.findRunningByEpisodeId(episodeId);

  // RUNNING ジョブの Mastra 実行状態を確認し、完了済みなら DB を更新する
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  await Promise.all(
    jobs.map(async (job) => {
      try {
        const workflowId = WORKFLOW_BY_JOB_TYPE[job.jobType] ?? "page-image-workflow";
        const res = await fetch(
          `${mastraUrl}/api/workflows/${workflowId}/runs/${job.mastraRunId}?fields=result,error`,
        );
        if (!res.ok) return;
        const run = (await res.json()) as { status: string; result?: { usedModel?: string; imageModel?: string | null }; error?: unknown };
        if (run.status === "success") await jobUsecase.markDone(job.id, run.result?.usedModel, run.result?.imageModel);
        else if (run.status === "failed") {
          const msg = run.error
            ? typeof run.error === "string"
              ? run.error
              : (run.error as Record<string, unknown>).message as string | undefined ?? JSON.stringify(run.error)
            : undefined;
          await jobUsecase.markFailed(job.id, msg);
        }
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
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";

  const createRes = await fetch(`${mastraUrl}/api/workflows/panel-layout-full-workflow/create-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!createRes.ok) {
    return c.json({ error: "Mastra error", detail: await createRes.text() }, 502);
  }
  const { runId } = (await createRes.json()) as { runId: string };

  const startRes = await fetch(
    `${mastraUrl}/api/workflows/panel-layout-full-workflow/start?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { episodeId } }),
    }
  );
  if (!startRes.ok) {
    return c.json({ error: "Mastra error", detail: await startRes.text() }, 502);
  }

  const job = await jobUsecase.create(episodeId, runId, undefined, JobType.PANEL_LAYOUT);
  return c.json({ jobId: job.id }, 201);
});

app.post("/generate-image-job", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const body = c.req.header("content-type")?.includes("application/json")
    ? generateImageBodySchema.parse(await c.req.json())
    : {};
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";

  const createRes = await fetch(`${mastraUrl}/api/workflows/page-image-workflow/create-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!createRes.ok) {
    return c.json({ error: "Mastra error", detail: await createRes.text() }, 502);
  }
  const { runId } = (await createRes.json()) as { runId: string };

  const startRes = await fetch(
    `${mastraUrl}/api/workflows/page-image-workflow/start?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { episodeId, ...body } }),
    }
  );
  if (!startRes.ok) {
    return c.json({ error: "Mastra error", detail: await startRes.text() }, 502);
  }

  const job = await jobUsecase.create(episodeId, runId, body.pageNumber);
  return c.json({ jobId: job.id }, 201);
});

app.post("/generate-image", async (c) => {
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const body = c.req.header("content-type")?.includes("application/json")
    ? generateImageBodySchema.parse(await c.req.json())
    : {};
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const runId = crypto.randomUUID();

  const upstream = await fetch(
    `${mastraUrl}/api/workflows/page-image-workflow/stream?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { episodeId, ...body } }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return c.json({ error: "Mastra error", detail }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});

export default app;
