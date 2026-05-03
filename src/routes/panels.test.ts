import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import panels from "./panels.js";
import { panelUsecase } from "../lib/container.js";

vi.mock("../lib/container.js", () => ({
  panelUsecase: {
    getPanels: vi.fn(),
    savePanels: vi.fn(),
  },
}));

const app = new Hono().route("/stories/:storyId/panels", panels);

const validPanel = { id: "p1", vertices: [[0, 0], [1, 0], [1, 1], [0, 1]], prompt: "" };

describe("panels routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories/:storyId/panels", () => {
    it("200 でパネル一覧を返す", async () => {
      const data = [{ id: "p1", storyId: 1 }];
      vi.mocked(panelUsecase.getPanels).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/panels");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
      expect(panelUsecase.getPanels).toHaveBeenCalledWith(1);
    });
  });

  describe("PUT /stories/:storyId/panels", () => {
    it("200 で保存したパネルを返す", async () => {
      const saved = [validPanel];
      vi.mocked(panelUsecase.savePanels).mockResolvedValue(saved as never);
      const res = await app.request("/stories/1/panels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([validPanel]),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(saved);
    });
  });
});
