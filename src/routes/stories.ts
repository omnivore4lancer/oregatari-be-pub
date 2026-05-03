import { Hono } from "hono";
import { stream } from "hono/streaming";
import { storyUsecase, userUsecase, mastraClient } from "../lib/container.js";
import { forwardWorkflowStream } from "../lib/mastraClient.js";
import type { AppEnv } from "../lib/honoTypes.js";
import { createStorySchema, updateStorySchema } from "../schemas/story.js";
import { StoryNotFoundError } from "../usecases/storyUsecase.js";
import { numericId } from "../lib/params.js";

const app = new Hono<AppEnv>();

async function resolveUserId(uid: string): Promise<number | null> {
  const user = await userUsecase.findByUid(uid);
  return user?.user_id ?? null;
}

app.get("/", async (c) => {
  const userId = await resolveUserId(c.get("user").id);
  if (!userId) return c.json({ error: "User not found" }, 404);
  const stories = await storyUsecase.getStories(userId);
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
  const userId = await resolveUserId(c.get("user").id);
  if (!userId) return c.json({ error: "User not found" }, 404);
  const result = createStorySchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ error: "Validation error", details: result.error.issues }, 400);
  const story = await storyUsecase.createStory(result.data, userId);
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
  const { response: mastraRes } = await mastraClient.createAndStream(
    "story-generation-workflow",
    { storyId: id }
  )

  c.header("Content-Type", "text/event-stream")
  c.header("Cache-Control", "no-cache")
  c.header("Connection", "keep-alive")

  return stream(c, async (s) => {
    await forwardWorkflowStream(s, mastraRes.body!)
  })
})

export default app;
