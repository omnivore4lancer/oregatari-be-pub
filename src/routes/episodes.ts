import { Hono } from "hono";
import { characterUsecase, episodeUsecase, mastraClient } from "../lib/container.js";
import {
  createEpisodeSchema,
  updateEpisodeSchema,
  generateEpisodeSchema,
  type GenerateEpisodeInput,
} from "../schemas/episode.js";
import { EpisodeNotFoundError } from "../usecases/episodeUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono();

async function buildWorkflowInput(storyId: number, input: GenerateEpisodeInput) {
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
  const upstream = await mastraClient.stream("episode-generation-workflow", workflowInput);

  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
});

app.post("/generate/background", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const result = generateEpisodeSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);

  const workflowInput = await buildWorkflowInput(storyId, result.data);
  const data = await mastraClient.startAsync("episode-generation-workflow", workflowInput);
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

app.post("/:episodeId/publish", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const episodeId = numericId.parse(c.req.param("episodeId"));
  try {
    const episode = await episodeUsecase.publishEpisode(storyId, episodeId);
    return c.json(episode);
  } catch (e) {
    if (e instanceof EpisodeNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

app.post("/:episodeId/unpublish", async (c) => {
  const storyId = numericId.parse(c.req.param("storyId"));
  const episodeId = numericId.parse(c.req.param("episodeId"));
  try {
    const episode = await episodeUsecase.updateEpisode(storyId, episodeId, { status: "UNPUBLISHED" });
    return c.json(episode);
  } catch (e) {
    if (e instanceof EpisodeNotFoundError) return c.json({ error: e.message }, 404);
    throw e;
  }
});

export default app;
