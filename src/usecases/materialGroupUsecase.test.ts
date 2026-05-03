import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialGroupUsecase, MaterialGroupNotFoundError } from "./materialGroupUsecase.js";
import type { MaterialGroupRepository } from "../repositories/materialGroupRepository.js";

function makeRepo(overrides: Partial<MaterialGroupRepository> = {}): MaterialGroupRepository {
  return {
    findByStoryId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as MaterialGroupRepository;
}

describe("MaterialGroupUsecase", () => {
  let repo: MaterialGroupRepository;
  let usecase: MaterialGroupUsecase;

  beforeEach(() => {
    repo = makeRepo();
    usecase = new MaterialGroupUsecase(repo);
  });

  describe("getGroups", () => {
    it("findByStoryId の結果をそのまま返す", async () => {
      const groups = [{ id: 1, storyId: 10, name: "背景" }];
      vi.mocked(repo.findByStoryId).mockResolvedValue(groups as never);
      await expect(usecase.getGroups(10)).resolves.toBe(groups);
    });
  });

  describe("createGroup", () => {
    it("repo.create の結果をそのまま返す", async () => {
      const created = { id: 2, storyId: 10, name: "小物" };
      vi.mocked(repo.create).mockResolvedValue(created as never);
      await expect(usecase.createGroup(10, { name: "小物" })).resolves.toBe(created);
    });
  });

  describe("deleteGroup", () => {
    it("存在して所有権があるとき repo.delete を呼ぶ", async () => {
      const group = { id: 1, storyId: 10, name: "背景" };
      vi.mocked(repo.findById).mockResolvedValue(group as never);
      vi.mocked(repo.delete).mockResolvedValue(undefined as never);
      await usecase.deleteGroup(10, 1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it("見つからないとき MaterialGroupNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.deleteGroup(10, 99)).rejects.toThrow(MaterialGroupNotFoundError);
    });

    it("storyId が一致しないとき MaterialGroupNotFoundError を投げる（所有権チェック）", async () => {
      const group = { id: 1, storyId: 99, name: "背景" };
      vi.mocked(repo.findById).mockResolvedValue(group as never);
      await expect(usecase.deleteGroup(10, 1)).rejects.toThrow(MaterialGroupNotFoundError);
    });

    it("MaterialGroupNotFoundError のメッセージに id が含まれる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.deleteGroup(10, 42)).rejects.toThrow("42");
    });
  });
});
