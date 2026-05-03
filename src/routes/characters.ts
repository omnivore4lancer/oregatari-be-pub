import { Hono } from "hono";
import { stream } from "hono/streaming";
import { characterUsecase, mastraClient } from "../lib/container.js";
import { forwardWorkflowStream } from "../lib/mastraClient.js";
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

  const { response: mastraRes } = await mastraClient.createAndStream(
    "character-three-view-workflow",
    { characterId: charId },
  );

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  return stream(c, async (s) => {
    await forwardWorkflowStream(s, mastraRes.body!, { sendDone: true });
  });
});

export default app;
