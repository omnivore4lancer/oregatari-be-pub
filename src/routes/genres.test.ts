import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import genres from "./genres.js";
import { genreUsecase } from "../lib/container.js";

vi.mock("../lib/container.js", () => ({
  genreUsecase: { getGenres: vi.fn() },
}));

const app = new Hono().route("/genres", genres);

describe("GET /genres", () => {
  beforeEach(() => vi.clearAllMocks());

  it("200 でジャンル一覧を返す", async () => {
    const data = [{ id: 1, name: "少年" }];
    vi.mocked(genreUsecase.getGenres).mockResolvedValue(data as never);
    const res = await app.request("/genres");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(data);
  });
});
