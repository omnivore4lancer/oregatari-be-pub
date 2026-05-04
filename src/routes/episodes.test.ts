import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import episodes from "./episodes.js";
import { episodeUsecase, characterUsecase, mastraClient } from "../lib/container.js";
import { EpisodeNotFoundError } from "../usecases/episodeUsecase.js";

vi.mock("../lib/container.js", () => ({
  episodeUsecase: {
    getEpisodes: vi.fn(),
    getEpisode: vi.fn(),
    createEpisode: vi.fn(),
    updateEpisode: vi.fn(),
    deleteEpisode: vi.fn(),
  },
  characterUsecase: {
    getCharacters: vi.fn(),
  },
  mastraClient: {
    stream: vi.fn(),
    startAsync: vi.fn(),
  },
}));

const app = new Hono().route("/stories/:storyId/episodes", episodes);

describe("episodes routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories/:storyId/episodes", () => {
    it("200 でエピソード一覧を返す", async () => {
      const data = [{ id: 1, storyId: 1, title: "第1話" }];
      vi.mocked(episodeUsecase.getEpisodes).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/episodes");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
      expect(episodeUsecase.getEpisodes).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it("クエリパラメータを usecase に渡す", async () => {
      vi.mocked(episodeUsecase.getEpisodes).mockResolvedValue([] as never);
      await app.request("/stories/1/episodes?status=PUBLISHED&relation=SEQUEL");
      expect(episodeUsecase.getEpisodes).toHaveBeenCalledWith(1, "PUBLISHED", "SEQUEL");
    });
  });

  describe("GET /stories/:storyId/episodes/:episodeId", () => {
    it("200 でエピソードを返す", async () => {
      const data = { id: 1, storyId: 1, title: "第1話" };
      vi.mocked(episodeUsecase.getEpisode).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/episodes/1");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(episodeUsecase.getEpisode).mockRejectedValue(new EpisodeNotFoundError(99));
      const res = await app.request("/stories/1/episodes/99");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /stories/:storyId/episodes", () => {
    it("201 で作成したエピソードを返す", async () => {
      const created = { id: 2, storyId: 1, title: "第2話" };
      vi.mocked(episodeUsecase.createEpisode).mockResolvedValue(created as never);
      const res = await app.request("/stories/1/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: 2, title: "第2話" }),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
    });
  });

  describe("PUT /stories/:storyId/episodes/:episodeId", () => {
    it("200 で更新したエピソードを返す", async () => {
      const updated = { id: 1, storyId: 1, title: "更新後" };
      vi.mocked(episodeUsecase.updateEpisode).mockResolvedValue(updated as never);
      const res = await app.request("/stories/1/episodes/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "更新後" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updated);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(episodeUsecase.updateEpisode).mockRejectedValue(new EpisodeNotFoundError(99));
      const res = await app.request("/stories/1/episodes/99", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "更新後" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /stories/:storyId/episodes/:episodeId", () => {
    it("200 で Deleted を返す", async () => {
      vi.mocked(episodeUsecase.deleteEpisode).mockResolvedValue(undefined as never);
      const res = await app.request("/stories/1/episodes/1", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Deleted" });
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(episodeUsecase.deleteEpisode).mockRejectedValue(new EpisodeNotFoundError(99));
      const res = await app.request("/stories/1/episodes/99", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /stories/:storyId/episodes/generate/stream", () => {
    it("text/event-stream で SSE を返す", async () => {
      const emptyBody = new ReadableStream({ start(c) { c.close(); } });
      vi.mocked(episodeUsecase.getEpisodes).mockResolvedValue([] as never);
      vi.mocked(characterUsecase.getCharacters).mockResolvedValue([] as never);
      vi.mocked(mastraClient.stream).mockResolvedValue(new Response(emptyBody) as never);
      const res = await app.request("/stories/1/episodes/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
    });

    it("バリデーションエラーのとき 400 を返す", async () => {
      const res = await app.request("/stories/1/episodes/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relation: "INVALID" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /stories/:storyId/episodes/generate/background", () => {
    it("202 で runId を返す", async () => {
      const data = { runId: "run-123", status: "PENDING" };
      vi.mocked(episodeUsecase.getEpisodes).mockResolvedValue([] as never);
      vi.mocked(characterUsecase.getCharacters).mockResolvedValue([] as never);
      vi.mocked(mastraClient.startAsync).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/episodes/generate/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(202);
      expect(await res.json()).toEqual(data);
    });
  });
});
