import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import materials from "./materials.js";
import { materialUsecase } from "../lib/container.js";
import { MaterialNotFoundError } from "../usecases/materialUsecase.js";

vi.mock("../lib/container.js", () => ({
  materialUsecase: {
    getMaterials: vi.fn(),
    getMaterial: vi.fn(),
    createMaterial: vi.fn(),
    updateMaterial: vi.fn(),
    deleteMaterial: vi.fn(),
  },
}));

const app = new Hono().route("/stories/:storyId/materials", materials);

const validCreateBody = {
  groupId: 1,
  name: "テスト素材",
  aspectRatio: "16:9",
  artStyle: "アニメ調",
  locationMain: "室内",
  timeSlot: "昼",
  weather: "晴れ",
};

describe("materials routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories/:storyId/materials", () => {
    it("200 でマテリアル一覧を返す", async () => {
      const data = [{ id: 1, storyId: 1, name: "素材1" }];
      vi.mocked(materialUsecase.getMaterials).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/materials");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
      expect(materialUsecase.getMaterials).toHaveBeenCalledWith(1, undefined, undefined, "desc");
    });

    it("クエリパラメータを usecase に渡す", async () => {
      vi.mocked(materialUsecase.getMaterials).mockResolvedValue([] as never);
      await app.request("/stories/1/materials?groupId=2&search=bg&sort=asc");
      expect(materialUsecase.getMaterials).toHaveBeenCalledWith(1, 2, "bg", "asc");
    });
  });

  describe("GET /stories/:storyId/materials/:materialId", () => {
    it("200 でマテリアルを返す", async () => {
      const data = { id: 1, storyId: 1, name: "素材1" };
      vi.mocked(materialUsecase.getMaterial).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/materials/1");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(materialUsecase.getMaterial).mockRejectedValue(new MaterialNotFoundError(99));
      const res = await app.request("/stories/1/materials/99");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /stories/:storyId/materials", () => {
    it("201 で作成したマテリアルを返す", async () => {
      const created = { id: 2, storyId: 1, ...validCreateBody };
      vi.mocked(materialUsecase.createMaterial).mockResolvedValue(created as never);
      const res = await app.request("/stories/1/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCreateBody),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
    });
  });

  describe("PUT /stories/:storyId/materials/:materialId", () => {
    it("200 で更新したマテリアルを返す", async () => {
      const updated = { id: 1, storyId: 1, name: "更新後" };
      vi.mocked(materialUsecase.updateMaterial).mockResolvedValue(updated as never);
      const res = await app.request("/stories/1/materials/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "更新後" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updated);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(materialUsecase.updateMaterial).mockRejectedValue(new MaterialNotFoundError(99));
      const res = await app.request("/stories/1/materials/99", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "更新後" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /stories/:storyId/materials/:materialId", () => {
    it("200 で Deleted を返す", async () => {
      vi.mocked(materialUsecase.deleteMaterial).mockResolvedValue(undefined as never);
      const res = await app.request("/stories/1/materials/1", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Deleted" });
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(materialUsecase.deleteMaterial).mockRejectedValue(new MaterialNotFoundError(99));
      const res = await app.request("/stories/1/materials/99", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });
});
