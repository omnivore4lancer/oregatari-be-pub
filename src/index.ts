import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError } from "zod";
import { MastraError } from "./lib/mastraClient.js";
import { authMiddleware } from "./middleware/auth.js";
import { storyOwnershipMiddleware } from "./middleware/storyOwnership.js";
import users from "./routes/users.js";
import stories from "./routes/stories.js";
import characters from "./routes/characters.js";
import genres from "./routes/genres.js";
import episodes from "./routes/episodes.js";
import materialGroups from "./routes/materialGroups.js";
import materials from "./routes/materials.js";
import panels from "./routes/panels.js";
import publishSettings from "./routes/publishSettings.js";
import characterRelationships from "./routes/characterRelationships.js";
import episodePages from "./routes/episodePages.js";
import jobs from "./routes/jobs.js";
import publicStories from "./routes/publicStories.js";

const app = new Hono();

const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) throw new Error("CORS_ORIGIN environment variable is required");

app.use(
  "/*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.route("/public", publicStories);
app.get("/ping", (c) => c.json({ ok: true }));

app.use("/*", authMiddleware);

app.onError((err, c) => {
  if (err instanceof ZodError) return c.json({ error: "Validation error", details: err.issues }, 400)
  if (err instanceof MastraError) return c.json({ error: "Mastra error", detail: err.detail }, 502)
  console.error(err)
  return c.json({ error: err.message || "Internal Server Error" }, 500)
})

app.route("/users", users);
app.route("/genres", genres);
app.use("/stories/:storyId", storyOwnershipMiddleware);
app.use("/stories/:storyId/*", storyOwnershipMiddleware);
app.route("/stories", stories);
app.route("/stories/:storyId/characters", characters);
app.route("/stories/:storyId/episodes", episodes);
app.route("/stories/:storyId/material-groups", materialGroups);
app.route("/stories/:storyId/materials", materials);
app.route("/stories/:storyId/panels", panels);
app.route("/stories/:storyId/publish", publishSettings);
app.route("/stories/:storyId/character-relationships", characterRelationships);
app.route("/stories/:storyId/episodes/:episodeId/pages", episodePages);
app.route("/jobs", jobs);

export default app;
