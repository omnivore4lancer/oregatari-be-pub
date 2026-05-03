import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import materialGroups from "./materialGroups.js";
import { materialGroupUsecase } from "../lib/container.js";
import { MaterialGroupNotFoundError } from "../usecases/materialGroupUsecase.js";

vi.mock("../lib/container.js", () => ({
  materialGroupUsecase: {
    getGroups: vi.fn(),
    createGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
}));

const app = new Hono().route("/stories/:storyId/material-groups", materialGroups);

describe("materialGroups routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories/:storyId/material-groups", () => {
    it("200 でグループ一覧を返す", async () => {
      const data = [{ id: 1, storyId: 1, name: "背景" }];
      vi.mocked(materialGroupUsecase.getGroups).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/material-groups");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
      expect(materialGroupUsecase.getGroups).toHaveBeenCalledWith(1);
    });
  });

  describe("POST /stories/:storyId/material-groups", () => {
    it("201 で作成したグループを返す", async () => {
      const created = { id: 2, storyId: 1, name: "新グループ" };
      vi.mocked(materialGroupUsecase.createGroup).mockResolvedValue(created as never);
      const res = await app.request("/stories/1/material-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新グループ" }),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
    });
  });

  describe("DELETE /stories/:storyId/material-groups/:groupId", () => {
    it("200 で Deleted を返す", async () => {
      vi.mocked(materialGroupUsecase.deleteGroup).mockResolvedValue(undefined as never);
      const res = await app.request("/stories/1/material-groups/1", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Deleted" });
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(materialGroupUsecase.deleteGroup).mockRejectedValue(
        new MaterialGroupNotFoundError(99)
      );
      const res = await app.request("/stories/1/material-groups/99", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });
});
