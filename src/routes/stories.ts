import { Hono } from "hono";
import { stream } from "hono/streaming";
import { storyUsecase } from "../lib/container.js";
import { createStorySchema, updateStorySchema } from "../schemas/story.js";
import { StoryNotFoundError } from "../usecases/storyUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/", async (c) => {
  const stories = await storyUsecase.getStories();
  return c.json(stories);
});

app.get("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  try {
    const story = await storyUsecase.getStory(id);
    return c.json(story);
  } catch (e) {
    if (e instanceof StoryNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/", async (c) => {
  const result = createStorySchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const story = await storyUsecase.createStory(result.data);
  return c.json(story, 201);
});

app.put("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  const result = updateStorySchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const story = await storyUsecase.updateStory(id, result.data);
  return c.json(story);
});

app.delete("/:id", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  await storyUsecase.deleteStory(id);
  return c.json({ message: "Deleted" });
});

app.post("/:id/generate", async (c) => {
  const id = numericId.parse(c.req.param("id"));
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const workflowId = "story-generation-workflow";

  const createRunRes = await fetch(`${mastraUrl}/api/workflows/${workflowId}/create-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!createRunRes.ok) {
    return c.json({ error: "Failed to create Mastra run" }, 502);
  }
  const { runId } = await createRunRes.json() as { runId: string };

  const mastraRes = await fetch(
    `${mastraUrl}/api/workflows/${workflowId}/stream?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: { storyId: id } }),
    },
  );

  if (!mastraRes.ok || !mastraRes.body) {
    return c.json({ error: "Mastra workflow stream failed" }, 502);
  }

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  return stream(c, async (s) => {
    const reader = mastraRes.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    const flush = async () => {
      let depth = 0;
      let inStr = false;
      let esc = false;
      let start = -1;

      for (let i = 0; i < buf.length; i++) {
        const ch = buf[i];
        if (esc) { esc = false; continue; }
        if (ch === "\\" && inStr) { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === "{") { if (depth++ === 0) start = i; }
        else if (ch === "}" && depth > 0 && --depth === 0 && start >= 0) {
          try {
            const ev = JSON.parse(buf.slice(start, i + 1));
            if (ev.type === "workflow-step-output" && ev.from === "USER") {
              const text: string = ev.payload?.output;
              if (text) await s.write(`data:${JSON.stringify({ text })}\n\n`);
            }
          } catch { /* ignore */ }
          start = -1;
        }
      }
      buf = start >= 0 ? buf.slice(start) : "";
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        await flush();
      }
    } finally {
      reader.releaseLock();
    }
  });
});

export default app;
