import { Hono } from "hono";
import { stream } from "hono/streaming";
import { characterUsecase } from "../lib/container.js";
import {
  createCharacterSchema,
  updateCharacterSchema,
} from "../schemas/character.js";
import { CharacterNotFoundError } from "../usecases/characterUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const characters = await characterUsecase.getCharacters(storyId);
  return c.json(characters);
});

app.get("/:charId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const charId = numericId.parse(c.req.param("charId"));
  try {
    const character = await characterUsecase.getCharacter(storyId, charId);
    return c.json(character);
  } catch (e) {
    if (e instanceof CharacterNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = createCharacterSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const character = await characterUsecase.createCharacter(storyId, result.data);
  return c.json(character, 201);
});

app.put("/:charId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const charId = numericId.parse(c.req.param("charId"));
  const result = updateCharacterSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  try {
    const character = await characterUsecase.updateCharacter(storyId, charId, result.data);
    return c.json(character);
  } catch (e) {
    if (e instanceof CharacterNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.delete("/:charId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const charId = numericId.parse(c.req.param("charId"));
  try {
    await characterUsecase.deleteCharacter(storyId, charId);
    return c.json({ message: "Deleted" });
  } catch (e) {
    if (e instanceof CharacterNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/:charId/generate-three-view", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const charId = numericId.parse(c.req.param("charId"));

  try {
    await characterUsecase.getCharacter(storyId, charId);
  } catch (e) {
    if (e instanceof CharacterNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }

  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const workflowId = "character-three-view-workflow";

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
      body: JSON.stringify({ inputData: { characterId: charId } }),
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
      await s.write(`data:${JSON.stringify({ done: true })}\n\n`);
    } finally {
      reader.releaseLock();
    }
  });
});

export default app;
