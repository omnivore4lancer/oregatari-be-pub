import { Hono } from "hono";
import { z } from "zod";
import { jobUsecase } from "../lib/container.js";
import { JobStatus, JobType } from "../repositories/jobRepository.js";

const app = new Hono();

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

  // RUNNING ジョブの Mastra 実行状態を確認し、完了済みなら DB を更新する
  const runningJobs = await jobUsecase.findRunning();
  if (runningJobs.length > 0) {
    const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
    await Promise.all(
      runningJobs.map(async (job) => {
        try {
          const workflowId = workflowIdForJobType(job.jobType);
          const res = await fetch(`${mastraUrl}/api/workflows/${workflowId}/runs/${job.mastraRunId}?fields=result,error`);
          if (!res.ok) return;
          const run = (await res.json()) as MastraRun;
          if (run.status === "success") await jobUsecase.markDone(job.id);
          else if (run.status === "failed") await jobUsecase.markFailed(job.id, errorMessage(run.error) ?? undefined);
        } catch {
          // Mastra への疎通失敗は無視
        }
      }),
    );
  }

  const [jobs, total] = await Promise.all([
    jobUsecase.findAll({ page, limit, status, jobType }),
    jobUsecase.countAll({ status, jobType }),
  ]);
  return c.json({ jobs, total, page, limit });
});

function workflowIdForJobType(jobType: string): string {
  if (jobType === JobType.COVER_IMAGE) return "cover-image-workflow";
  if (jobType === JobType.PANEL_LAYOUT) return "panel-layout-full-workflow";
  return "page-image-workflow";
}

type MastraRun = {
  status: string;
  result?: unknown;
  error?: unknown;
};

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    return (e.message as string) ?? (e.error as string) ?? JSON.stringify(error);
  }
  return String(error);
}

function finalEvent(run: MastraRun): string {
  const payload = JSON.stringify({
    status: run.status,
    result: run.result ?? null,
    error: errorMessage(run.error),
  });
  return `data: ${payload}\n\n`;
}

async function syncJobStatus(jobId: string, run: MastraRun) {
  if (run.status === "success") await jobUsecase.markDone(jobId);
  else if (run.status === "failed") await jobUsecase.markFailed(jobId, errorMessage(run.error) ?? undefined);
}

app.get("/:jobId", async (c) => {
  const jobId = c.req.param("jobId");
  const job = await jobUsecase.findById(jobId);
  if (!job) return c.json({ error: "Job not found" }, 404);

  if (job.status === JobStatus.RUNNING) {
    const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
    const workflowId = workflowIdForJobType(job.jobType);
    try {
      const res = await fetch(`${mastraUrl}/api/workflows/${workflowId}/runs/${job.mastraRunId}?fields=result,error`);
      if (res.ok) {
        const run = (await res.json()) as MastraRun;
        if (run.status === "success") await jobUsecase.markDone(job.id);
        else if (run.status === "failed") await jobUsecase.markFailed(job.id, errorMessage(run.error) ?? undefined);
      }
    } catch { /* Mastra 疎通失敗は無視 */ }

    const updated = await jobUsecase.findById(jobId);
    if (updated) return c.json({ id: updated.id, status: updated.status, errorMessage: updated.errorMessage });
  }

  return c.json({ id: job.id, status: job.status, errorMessage: job.errorMessage });
});

app.get("/:jobId/events", async (c) => {
  const jobId = c.req.param("jobId");
  const job = await jobUsecase.findById(jobId);
  if (!job) return c.json({ error: "Job not found" }, 404);

  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const base = `${mastraUrl}/api/workflows/${workflowIdForJobType(job.jobType)}`;

  // 完了済みチェック：ページ遷移後の再接続時に即返す
  const statusRes = await fetch(`${base}/runs/${job.mastraRunId}?fields=result,error`);
  if (statusRes.ok) {
    const run = (await statusRes.json()) as MastraRun;
    if (run.status === "success" || run.status === "failed") {
      await syncJobStatus(jobId, run);
      return new Response(finalEvent(run), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }
  }

  // 実行中：observe でストリームを FE に転送し、終了後に最終ステータスを emit + DB 更新
  const ac = new AbortController();
  c.req.raw.signal.addEventListener("abort", () => ac.abort());

  const upstream = await fetch(`${base}/observe?runId=${job.mastraRunId}`, {
    method: "POST",
    signal: ac.signal,
  });

  if (!upstream.ok) {
    return c.json({ error: "Mastra error", detail: await upstream.text() }, 502);
  }

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
      const finalRes = await fetch(`${base}/runs/${job.mastraRunId}?fields=result,error`);
      if (finalRes.ok) {
        const run = (await finalRes.json()) as MastraRun;
        await syncJobStatus(jobId, run);
        await writer.write(encoder.encode(finalEvent(run)));
      }
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
