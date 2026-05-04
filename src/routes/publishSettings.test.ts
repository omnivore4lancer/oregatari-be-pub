import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import publishSettings from "./publishSettings.js";
import { publishSettingsUsecase, jobUsecase, mastraClient } from "../lib/container.js";

vi.mock("../lib/container.js", () => ({
  publishSettingsUsecase: {
    getPublishSettings: vi.fn(),
    upsertPublishSettings: vi.fn(),
    publishStory: vi.fn(),
    unpublishStory: vi.fn(),
  },
  jobUsecase: {
    createCoverImageJob: vi.fn(),
  },
  mastraClient: {
    startJob: vi.fn(),
  },
}));

const app = new Hono().route("/stories/:storyId/publish", publishSettings);

describe("publishSettings routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories/:storyId/publish", () => {
    it("200 で公開設定を返す", async () => {
      const data = { storyId: 1, publishedAt: "2024-01-01" };
      vi.mocked(publishSettingsUsecase.getPublishSettings).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/publish");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });

    it("設定が未登録のとき null を返す", async () => {
      vi.mocked(publishSettingsUsecase.getPublishSettings).mockResolvedValue(null as never);
      const res = await app.request("/stories/1/publish");
      expect(res.status).toBe(200);
      expect(await res.json()).toBeNull();
    });
  });

  describe("PUT /stories/:storyId/publish", () => {
    it("200 で公開設定を返す", async () => {
      const saved = { storyId: 1, publishedAt: "2024-06-01" };
      vi.mocked(publishSettingsUsecase.upsertPublishSettings).mockResolvedValue(saved as never);
      const res = await app.request("/stories/1/publish", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedAt: "2024-06-01" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(saved);
    });
  });

  describe("POST /stories/:storyId/publish/release", () => {
    it("200 で publishedAt が設定された設定を返す", async () => {
      const published = { storyId: 1, publishedAt: "2024-06-01T00:00:00.000Z" };
      vi.mocked(publishSettingsUsecase.publishStory).mockResolvedValue(published as never);
      const res = await app.request("/stories/1/publish/release", { method: "POST" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(published);
    });
  });

  describe("DELETE /stories/:storyId/publish/release", () => {
    it("200 で publishedAt が null になった設定を返す", async () => {
      const unpublished = { storyId: 1, publishedAt: null };
      vi.mocked(publishSettingsUsecase.unpublishStory).mockResolvedValue(unpublished as never);
      const res = await app.request("/stories/1/publish/release", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(unpublished);
    });
  });

  describe("POST /stories/:storyId/publish/generate-cover-image-job", () => {
    it("201 で jobId を返す", async () => {
      vi.mocked(mastraClient.startJob).mockResolvedValue("run-123" as never);
      vi.mocked(jobUsecase.createCoverImageJob).mockResolvedValue({ id: 10 } as never);
      const res = await app.request("/stories/1/publish/generate-cover-image-job", {
        method: "POST",
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ jobId: 10 });
      expect(mastraClient.startJob).toHaveBeenCalledWith("cover-image-workflow", { storyId: 1 });
      expect(jobUsecase.createCoverImageJob).toHaveBeenCalledWith(1, "run-123");
    });
  });
});
