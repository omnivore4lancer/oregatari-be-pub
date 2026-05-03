import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import publishSettings from "./publishSettings.js";
import { publishSettingsUsecase } from "../lib/container.js";

vi.mock("../lib/container.js", () => ({
  publishSettingsUsecase: {
    getPublishSettings: vi.fn(),
    upsertPublishSettings: vi.fn(),
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
});
