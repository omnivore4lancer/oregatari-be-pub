import { describe, it, expect, vi, beforeEach } from "vitest";
import { CharacterUsecase, CharacterNotFoundError } from "./characterUsecase.js";
import type { CharacterRepository } from "../repositories/characterRepository.js";

function makeRepo(overrides: Partial<CharacterRepository> = {}): CharacterRepository {
  return {
    findByStoryId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as CharacterRepository;
}

describe("CharacterUsecase", () => {
  let repo: CharacterRepository;
  let usecase: CharacterUsecase;

  beforeEach(() => {
    repo = makeRepo();
    usecase = new CharacterUsecase(repo);
  });

  describe("getCharacters", () => {
    it("findByStoryId の結果をそのまま返す", async () => {
      const chars = [{ id: 1, storyId: 10, name: "アリス" }];
      vi.mocked(repo.findByStoryId).mockResolvedValue(chars as never);
      await expect(usecase.getCharacters(10)).resolves.toBe(chars);
    });
  });

  describe("getCharacter", () => {
    it("存在するキャラクターを返す", async () => {
      const char = { id: 1, storyId: 10, name: "アリス" };
      vi.mocked(repo.findById).mockResolvedValue(char as never);
      await expect(usecase.getCharacter(10, 1)).resolves.toBe(char);
    });

    it("見つからないとき CharacterNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getCharacter(10, 99)).rejects.toThrow(CharacterNotFoundError);
    });

    it("storyId が一致しないとき CharacterNotFoundError を投げる（所有権チェック）", async () => {
      const char = { id: 1, storyId: 99, name: "アリス" };
      vi.mocked(repo.findById).mockResolvedValue(char as never);
      await expect(usecase.getCharacter(10, 1)).rejects.toThrow(CharacterNotFoundError);
    });

    it("CharacterNotFoundError のメッセージに id が含まれる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getCharacter(10, 42)).rejects.toThrow("42");
    });
  });

  describe("createCharacter", () => {
    it("repo.create の結果をそのまま返す", async () => {
      const created = { id: 2, storyId: 10, name: "ボブ" };
      vi.mocked(repo.create).mockResolvedValue(created as never);
      await expect(
        usecase.createCharacter(10, { name: "ボブ", isProtagonist: false, skills: [] })
      ).resolves.toBe(created);
    });
  });

  describe("updateCharacter", () => {
    it("存在して所有権があるとき repo.update を呼ぶ", async () => {
      const char = { id: 1, storyId: 10, name: "アリス" };
      vi.mocked(repo.findById).mockResolvedValue(char as never);
      const updated = { ...char, name: "更新後" };
      vi.mocked(repo.update).mockResolvedValue(updated as never);
      await expect(usecase.updateCharacter(10, 1, { name: "更新後" })).resolves.toBe(updated);
    });

    it("見つからないとき CharacterNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.updateCharacter(10, 99, {})).rejects.toThrow(CharacterNotFoundError);
    });

    it("storyId が一致しないとき CharacterNotFoundError を投げる（所有権チェック）", async () => {
      const char = { id: 1, storyId: 99, name: "アリス" };
      vi.mocked(repo.findById).mockResolvedValue(char as never);
      await expect(usecase.updateCharacter(10, 1, { name: "更新後" })).rejects.toThrow(CharacterNotFoundError);
    });
  });

  describe("deleteCharacter", () => {
    it("存在して所有権があるとき repo.delete を呼ぶ", async () => {
      const char = { id: 1, storyId: 10, name: "アリス" };
      vi.mocked(repo.findById).mockResolvedValue(char as never);
      vi.mocked(repo.delete).mockResolvedValue(undefined as never);
      await usecase.deleteCharacter(10, 1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it("見つからないとき CharacterNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.deleteCharacter(10, 99)).rejects.toThrow(CharacterNotFoundError);
    });

    it("storyId が一致しないとき CharacterNotFoundError を投げる", async () => {
      const char = { id: 1, storyId: 99, name: "アリス" };
      vi.mocked(repo.findById).mockResolvedValue(char as never);
      await expect(usecase.deleteCharacter(10, 1)).rejects.toThrow(CharacterNotFoundError);
    });
  });
});
