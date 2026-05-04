import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import stories from "./stories.js";
import { storyUsecase, mastraClient } from "../lib/container.js";
import { StoryNotFoundError } from "../usecases/storyUsecase.js";
import type { AppEnv } from "../lib/honoTypes.js";

vi.mock("../lib/container.js", () => ({
  storyUsecase: {
    getStories: vi.fn(),
    getStory: vi.fn(),
    createStory: vi.fn(),
    updateStory: vi.fn(),
    deleteStory: vi.fn(),
  },
  mastraClient: {
    createAndStream: vi.fn(),
  },
}));

vi.mock("../lib/mastraClient.js", () => ({
  forwardWorkflowStream: vi.fn().mockResolvedValue(undefined),
}));

const app = new Hono<AppEnv>()
  .use("/*", async (c, next) => {
    c.set("user", { id: "uid-1" } as never);
    await next();
  })
  .route("/stories", stories);

const validCreateBody = {
  name: "テスト作品",
  genreIds: [1],
  worldSetting: "現代日本",
  era: "MODERN",
};

describe("stories routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories", () => {
    it("200 でストーリー一覧を返す", async () => {
      const data = [{ id: 1, name: "テスト" }];
      vi.mocked(storyUsecase.getStories).mockResolvedValue(data as never);
      const res = await app.request("/stories");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });
  });

  describe("GET /stories/:id", () => {
    it("200 でストーリーを返す", async () => {
      const data = { id: 1, name: "テスト" };
      vi.mocked(storyUsecase.getStory).mockResolvedValue(data as never);
      const res = await app.request("/stories/1");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(storyUsecase.getStory).mockRejectedValue(new StoryNotFoundError(99));
      const res = await app.request("/stories/99");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /stories", () => {
    it("201 で作成したストーリーを返す", async () => {
      const created = { id: 2, ...validCreateBody };
      vi.mocked(storyUsecase.createStory).mockResolvedValue(created as never);
      const res = await app.request("/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCreateBody),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
    });

    it("バリデーションエラーのとき 400 を返す", async () => {
      const res = await app.request("/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "不完全なボディ" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /stories/:id", () => {
    it("200 で更新したストーリーを返す", async () => {
      const updated = { id: 1, name: "更新後" };
      vi.mocked(storyUsecase.updateStory).mockResolvedValue(updated as never);
      const res = await app.request("/stories/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "更新後" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updated);
    });
  });

  describe("DELETE /stories/:id", () => {
    it("200 で Deleted を返す", async () => {
      vi.mocked(storyUsecase.deleteStory).mockResolvedValue(undefined as never);
      const res = await app.request("/stories/1", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Deleted" });
    });
  });

  describe("POST /stories/:id/generate", () => {
    it("text/event-stream で SSE を返す", async () => {
      const emptyBody = new ReadableStream({ start(c) { c.close(); } });
      vi.mocked(mastraClient.createAndStream).mockResolvedValue({
        runId: "run-1",
        response: new Response(emptyBody),
      } as never);
      const res = await app.request("/stories/1/generate", { method: "POST" });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/event-stream");
    });
  });
});
