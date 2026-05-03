import { Hono } from "hono";
import { z } from "zod";
import { characterUsecase, episodeUsecase } from "../lib/container.js";
import {
  createEpisodeSchema,
  updateEpisodeSchema,
} from "../schemas/episode.js";
import { EpisodeNotFoundError } from "../usecases/episodeUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

const generateEpisodeSchema = z.object({
  relation: z.enum(["STANDALONE", "SEQUEL"]).default("STANDALONE"),
  parentId: z.number().int().positive().optional(),
  characterIds: z.array(z.number().int().positive()).default([]),
  inheritRelation: z.boolean().default(true),
  titleHint: z.string().optional(),
  summaryHint: z.string().optional(),
});

async function buildWorkflowInput(storyId: number, input: z.infer<typeof generateEpisodeSchema>) {
  const [episodes, chars] = await Promise.all([
    episodeUsecase.getEpisodes(storyId),
    characterUsecase.getCharacters(storyId),
  ]);
  const selected = input.characterIds.length > 0
    ? chars.filter((c) => input.characterIds.includes(c.id))
    : chars;
  return {
    storyId,
    episodeNumber: episodes.length + 1,
    episodeType: input.relation as "STANDALONE" | "SEQUEL",
    inheritRelation: input.inheritRelation,
    parentEpisodeId: input.parentId,
    characters: selected.map((c) => ({ characterId: c.id, name: c.name, importance: 50 })),
    titleHint: input.titleHint,
    summaryHint: input.summaryHint,
  };
}

app.post("/generate/stream", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = generateEpisodeSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);

  const workflowInput = await buildWorkflowInput(storyId, result.data);
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";
  const runId = crypto.randomUUID();

  const upstream = await fetch(
    `${mastraUrl}/api/workflows/episode-generation-workflow/stream?runId=${runId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: workflowInput }),
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

app.post("/generate/background", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = generateEpisodeSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);

  const workflowInput = await buildWorkflowInput(storyId, result.data);
  const mastraUrl = process.env.MASTRA_URL ?? "http://localhost:4111";

  const upstream = await fetch(
    `${mastraUrl}/api/workflows/episode-generation-workflow/start-async`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputData: workflowInput }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    return c.json({ error: "Mastra error", detail }, 502);
  }

  const data = await upstream.json();
  return c.json(data, 202);
});

app.get("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const status = c.req.query("status");
  const relation = c.req.query("relation");
  const episodes = await episodeUsecase.getEpisodes(storyId, status, relation);
  return c.json(episodes);
});

app.get("/:episodeId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const episodeId = numericId.parse(c.req.param("episodeId"));
  try {
    const episode = await episodeUsecase.getEpisode(storyId, episodeId);
    return c.json(episode);
  } catch (e) {
    if (e instanceof EpisodeNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = createEpisodeSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const episode = await episodeUsecase.createEpisode(storyId, result.data);
  return c.json(episode, 201);
});

app.put("/:episodeId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const episodeId = numericId.parse(c.req.param("episodeId"));
  const result = updateEpisodeSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  try {
    const episode = await episodeUsecase.updateEpisode(storyId, episodeId, result.data);
    return c.json(episode);
  } catch (e) {
    if (e instanceof EpisodeNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.delete("/:episodeId", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const episodeId = numericId.parse(c.req.param("episodeId"));
  try {
    await episodeUsecase.deleteEpisode(storyId, episodeId);
    return c.json({ message: "Deleted" });
  } catch (e) {
    if (e instanceof EpisodeNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

export default app;
