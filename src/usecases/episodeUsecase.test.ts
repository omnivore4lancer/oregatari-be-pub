import { describe, it, expect, vi, beforeEach } from "vitest";
import { EpisodeUsecase, EpisodeNotFoundError } from "./episodeUsecase.js";
import type { EpisodeRepository } from "../repositories/episodeRepository.js";
import type { EpisodePageRepository } from "../repositories/episodePageRepository.js";

function makeRepo(overrides: Partial<EpisodeRepository> = {}): EpisodeRepository {
  return {
    findByStoryId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as EpisodeRepository;
}

function makePageRepo(overrides: Partial<EpisodePageRepository> = {}): EpisodePageRepository {
  return {
    findByEpisodeId: vi.fn(),
    findByEpisodeIdAndPageNumber: vi.fn(),
    upsert: vi.fn(),
    findPublicByEpisodeId: vi.fn(),
    findPageUrlsByEpisodeId: vi.fn().mockResolvedValue([]),
    updateDisplayImageUrl: vi.fn(),
    deleteByEpisodeId: vi.fn(),
    ...overrides,
  } as unknown as EpisodePageRepository;
}

describe("EpisodeUsecase", () => {
  let repo: EpisodeRepository;
  let usecase: EpisodeUsecase;

  beforeEach(() => {
    repo = makeRepo();
    usecase = new EpisodeUsecase(repo, makePageRepo());
  });

  describe("getEpisodes", () => {
    it("findByStoryId の結果をそのまま返す", async () => {
      const episodes = [{ id: 1, storyId: 10, title: "第1話" }];
      vi.mocked(repo.findByStoryId).mockResolvedValue(episodes as never);
      await expect(usecase.getEpisodes(10)).resolves.toBe(episodes);
    });

    it("status と relation をフィルタとして渡す", async () => {
      vi.mocked(repo.findByStoryId).mockResolvedValue([] as never);
      await usecase.getEpisodes(10, "PUBLISHED", "SEQUEL");
      expect(repo.findByStoryId).toHaveBeenCalledWith(10, "PUBLISHED", "SEQUEL");
    });
  });

  describe("getEpisode", () => {
    it("存在するエピソードを返す", async () => {
      const episode = { id: 1, storyId: 10, title: "第1話" };
      vi.mocked(repo.findById).mockResolvedValue(episode as never);
      await expect(usecase.getEpisode(10, 1)).resolves.toBe(episode);
    });

    it("見つからないとき EpisodeNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getEpisode(10, 99)).rejects.toThrow(EpisodeNotFoundError);
    });

    it("storyId が一致しないとき EpisodeNotFoundError を投げる（所有権チェック）", async () => {
      const episode = { id: 1, storyId: 99, title: "第1話" };
      vi.mocked(repo.findById).mockResolvedValue(episode as never);
      await expect(usecase.getEpisode(10, 1)).rejects.toThrow(EpisodeNotFoundError);
    });

    it("EpisodeNotFoundError のメッセージに id が含まれる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getEpisode(10, 42)).rejects.toThrow("42");
    });
  });

  describe("createEpisode", () => {
    it("repo.create の結果をそのまま返す", async () => {
      const created = { id: 2, storyId: 10, title: "第2話" };
      vi.mocked(repo.create).mockResolvedValue(created as never);
      await expect(
        usecase.createEpisode(10, {
          number: 2,
          title: "第2話",
          status: "UNPUBLISHED",
          relation: "STANDALONE",
          generatingState: "DONE",
          characters: [],
          inheritRelation: true,
        })
      ).resolves.toBe(created);
    });
  });

  describe("updateEpisode", () => {
    it("存在して所有権があるとき repo.update を呼ぶ", async () => {
      const episode = { id: 1, storyId: 10, title: "第1話" };
      vi.mocked(repo.findById).mockResolvedValue(episode as never);
      const updated = { ...episode, title: "更新後" };
      vi.mocked(repo.update).mockResolvedValue(updated as never);
      await expect(usecase.updateEpisode(10, 1, { title: "更新後" })).resolves.toBe(updated);
    });

    it("見つからないとき EpisodeNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.updateEpisode(10, 99, {})).rejects.toThrow(EpisodeNotFoundError);
    });

    it("storyId が一致しないとき EpisodeNotFoundError を投げる（所有権チェック）", async () => {
      const episode = { id: 1, storyId: 99, title: "第1話" };
      vi.mocked(repo.findById).mockResolvedValue(episode as never);
      await expect(usecase.updateEpisode(10, 1, { title: "更新後" })).rejects.toThrow(EpisodeNotFoundError);
    });
  });

  describe("deleteEpisode", () => {
    it("存在して所有権があるとき repo.delete を呼ぶ", async () => {
      const episode = { id: 1, storyId: 10, title: "第1話" };
      vi.mocked(repo.findById).mockResolvedValue(episode as never);
      vi.mocked(repo.delete).mockResolvedValue(undefined as never);
      await usecase.deleteEpisode(10, 1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it("storyId が一致しないとき EpisodeNotFoundError を投げる", async () => {
      const episode = { id: 1, storyId: 99, title: "第1話" };
      vi.mocked(repo.findById).mockResolvedValue(episode as never);
      await expect(usecase.deleteEpisode(10, 1)).rejects.toThrow(EpisodeNotFoundError);
    });
  });
});
