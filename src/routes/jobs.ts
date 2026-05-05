import { Hono } from "hono";
import { z } from "zod";
import { jobUsecase, mastraClient } from "../lib/container.js";
import { mastraErrorMessage, type MastraRun } from "../lib/mastraClient.js";
import { JobStatus, JobType } from "../repositories/jobRepository.js";
import type { AppEnv } from "../lib/honoTypes.js";

const app = new Hono<AppEnv>();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: z.enum([JobStatus.RUNNING, JobStatus.DONE, JobStatus.FAILED]).optional(),
  jobType: z.enum([JobType.IMAGE_GENERATION, JobType.PANEL_LAYOUT, JobType.COVER_IMAGE]).optional(),
});

app.get("/", async (c) => {
  const result = listQuerySchema.safeParse(c.req.query());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const { page, limit, status, jobType } = result.data;
  const uid = c.get("user").id;

  // RUNNING ジョブの Mastra 実行状態を確認し、完了済みなら DB を更新する
  const runningJobs = await jobUsecase.findRunning();
  if (runningJobs.length > 0) {
    await Promise.all(
      runningJobs.map(async (job) => {
        try {
          const workflowId = mastraClient.workflowIdForJobType(job.jobType);
          const run = await mastraClient.getRunStatus(workflowId, job.mastraRunId);
          if (run.status === "success") await jobUsecase.markDone(job.id);
          else if (run.status === "failed") await jobUsecase.markFailed(job.id, mastraErrorMessage(run.error) ?? undefined);
        } catch {
          // Mastra への疎通失敗は無視
        }
      }),
    );
  }

  const [jobs, total] = await Promise.all([
    jobUsecase.findAll({ page, limit, status, jobType, uid }),
    jobUsecase.countAll({ status, jobType, uid }),
  ]);
  return c.json({ jobs, total, page, limit });
});

function finalEvent(run: MastraRun): string {
  const payload = JSON.stringify({
    status: run.status,
    result: run.result ?? null,
    error: mastraErrorMessage(run.error),
  });
  return `data: ${payload}\n\n`;
}

async function syncJobStatus(jobId: string, run: MastraRun) {
  if (run.status === "success") await jobUsecase.markDone(jobId);
  else if (run.status === "failed") await jobUsecase.markFailed(jobId, mastraErrorMessage(run.error) ?? undefined);
}

app.get("/:jobId", async (c) => {
  const uid = c.get("user").id;
  const jobId = c.req.param("jobId");
  const job = await jobUsecase.findByIdForUser(jobId, uid);
  if (!job) return c.json({ error: "Job not found" }, 404);

  if (job.status === JobStatus.RUNNING) {
    const workflowId = mastraClient.workflowIdForJobType(job.jobType);
    try {
      const run = await mastraClient.getRunStatus(workflowId, job.mastraRunId);
      if (run.status === "success") await jobUsecase.markDone(job.id);
      else if (run.status === "failed") await jobUsecase.markFailed(job.id, mastraErrorMessage(run.error) ?? undefined);
    } catch { /* Mastra 疎通失敗は無視 */ }

    const updated = await jobUsecase.findById(jobId);
    if (updated) return c.json({ id: updated.id, status: updated.status, errorMessage: updated.errorMessage });
  }

  return c.json({ id: job.id, status: job.status, errorMessage: job.errorMessage });
});

app.get("/:jobId/events", async (c) => {
  const uid = c.get("user").id;
  const jobId = c.req.param("jobId");
  const job = await jobUsecase.findByIdForUser(jobId, uid);
  if (!job) return c.json({ error: "Job not found" }, 404);

  const workflowId = mastraClient.workflowIdForJobType(job.jobType);

  // 完了済みチェック：ページ遷移後の再接続時に即返す
  try {
    const run = await mastraClient.getRunStatus(workflowId, job.mastraRunId);
    if (run.status === "success" || run.status === "failed") {
      await syncJobStatus(jobId, run);
      return new Response(finalEvent(run), {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }
  } catch { /* 疎通失敗は無視して observe へ進む */ }

  // 実行中：observe でストリームを FE に転送し、終了後に最終ステータスを emit + DB 更新
  const ac = new AbortController();
  c.req.raw.signal.addEventListener("abort", () => ac.abort());

  const upstream = await mastraClient.observe(workflowId, job.mastraRunId, ac.signal);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const reader = upstream.body!.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
      // ストリーム終了後に最終ステータスを確認して emit + DB 更新
      try {
        const run = await mastraClient.getRunStatus(workflowId, job.mastraRunId);
        await syncJobStatus(jobId, run);
        await writer.write(encoder.encode(finalEvent(run)));
      } catch { /* 疎通失敗は無視 */ }
    } catch {
      // FE 切断 (AbortError) など — 静かに終了
    } finally {
      writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
});

export default app;
