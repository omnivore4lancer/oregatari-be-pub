import { Hono } from "hono";
import { genreUsecase } from "../lib/container.js";

const app = new Hono();

app.get("/", async (c) => {
  const genres = await genreUsecase.getGenres();
  return c.json(genres);
});

export default app;
