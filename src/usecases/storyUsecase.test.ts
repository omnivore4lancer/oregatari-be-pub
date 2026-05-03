import { describe, it, expect, vi, beforeEach } from "vitest";
import { StoryUsecase, StoryNotFoundError } from "./storyUsecase.js";
import type { StoryRepository } from "../repositories/storyRepository.js";

function makeRepo(overrides: Partial<StoryRepository> = {}): StoryRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as StoryRepository;
}

describe("StoryUsecase", () => {
  let repo: StoryRepository;
  let usecase: StoryUsecase;

  beforeEach(() => {
    repo = makeRepo();
    usecase = new StoryUsecase(repo);
  });

  describe("getStories", () => {
    it("findAll の結果をそのまま返す", async () => {
      const stories = [{ id: 1, name: "テスト" }];
      vi.mocked(repo.findAll).mockResolvedValue(stories as never);
      await expect(usecase.getStories(1)).resolves.toBe(stories);
    });
  });

  describe("getStory", () => {
    it("存在するストーリーを返す", async () => {
      const story = { id: 1, name: "テスト" };
      vi.mocked(repo.findById).mockResolvedValue(story as never);
      await expect(usecase.getStory(1)).resolves.toBe(story);
    });

    it("見つからないとき StoryNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getStory(99)).rejects.toThrow(StoryNotFoundError);
    });

    it("StoryNotFoundError のメッセージに id が含まれる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getStory(42)).rejects.toThrow("42");
    });
  });

  describe("createStory", () => {
    it("repo.create の結果をそのまま返す", async () => {
      const created = { id: 2, name: "新作" };
      vi.mocked(repo.create).mockResolvedValue(created as never);
      await expect(
        usecase.createStory({ name: "新作", genreIds: [1], worldSetting: "現代日本", era: "MODERN" }, 1)
      ).resolves.toBe(created);
    });
  });

  describe("updateStory", () => {
    it("repo.update の結果をそのまま返す", async () => {
      const updated = { id: 1, name: "更新後" };
      vi.mocked(repo.update).mockResolvedValue(updated as never);
      await expect(usecase.updateStory(1, { name: "更新後" })).resolves.toBe(updated);
    });
  });

  describe("deleteStory", () => {
    it("repo.delete を呼ぶ", async () => {
      vi.mocked(repo.delete).mockResolvedValue(undefined as never);
      await usecase.deleteStory(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
