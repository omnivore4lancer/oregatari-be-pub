import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import characters from "./characters.js";
import { characterUsecase } from "../lib/container.js";
import { CharacterNotFoundError } from "../usecases/characterUsecase.js";

vi.mock("../lib/container.js", () => ({
  characterUsecase: {
    getCharacters: vi.fn(),
    getCharacter: vi.fn(),
    createCharacter: vi.fn(),
    updateCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
  },
}));

const app = new Hono().route("/stories/:storyId/characters", characters);

describe("characters routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /stories/:storyId/characters", () => {
    it("200 でキャラクター一覧を返す", async () => {
      const data = [{ id: 1, storyId: 1, name: "主人公" }];
      vi.mocked(characterUsecase.getCharacters).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/characters");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
      expect(characterUsecase.getCharacters).toHaveBeenCalledWith(1);
    });
  });

  describe("GET /stories/:storyId/characters/:charId", () => {
    it("200 でキャラクターを返す", async () => {
      const data = { id: 1, storyId: 1, name: "主人公" };
      vi.mocked(characterUsecase.getCharacter).mockResolvedValue(data as never);
      const res = await app.request("/stories/1/characters/1");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(characterUsecase.getCharacter).mockRejectedValue(new CharacterNotFoundError(99));
      const res = await app.request("/stories/1/characters/99");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /stories/:storyId/characters", () => {
    it("201 で作成したキャラクターを返す", async () => {
      const created = { id: 2, storyId: 1, name: "新キャラ" };
      vi.mocked(characterUsecase.createCharacter).mockResolvedValue(created as never);
      const res = await app.request("/stories/1/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新キャラ" }),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
    });
  });

  describe("PUT /stories/:storyId/characters/:charId", () => {
    it("200 で更新したキャラクターを返す", async () => {
      const updated = { id: 1, storyId: 1, name: "更新後" };
      vi.mocked(characterUsecase.updateCharacter).mockResolvedValue(updated as never);
      const res = await app.request("/stories/1/characters/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "更新後" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updated);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(characterUsecase.updateCharacter).mockRejectedValue(
        new CharacterNotFoundError(99)
      );
      const res = await app.request("/stories/1/characters/99", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "更新後" }),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /stories/:storyId/characters/:charId", () => {
    it("200 で Deleted を返す", async () => {
      vi.mocked(characterUsecase.deleteCharacter).mockResolvedValue(undefined as never);
      const res = await app.request("/stories/1/characters/1", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Deleted" });
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(characterUsecase.deleteCharacter).mockRejectedValue(
        new CharacterNotFoundError(99)
      );
      const res = await app.request("/stories/1/characters/99", { method: "DELETE" });
      expect(res.status).toBe(404);
    });
  });
});
