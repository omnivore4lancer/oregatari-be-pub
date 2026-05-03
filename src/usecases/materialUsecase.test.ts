import { describe, it, expect, vi, beforeEach } from "vitest";
import { MaterialUsecase, MaterialNotFoundError } from "./materialUsecase.js";
import type { MaterialRepository } from "../repositories/materialRepository.js";

function makeRepo(overrides: Partial<MaterialRepository> = {}): MaterialRepository {
  return {
    findByStoryId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as MaterialRepository;
}

describe("MaterialUsecase", () => {
  let repo: MaterialRepository;
  let usecase: MaterialUsecase;

  beforeEach(() => {
    repo = makeRepo();
    usecase = new MaterialUsecase(repo);
  });

  describe("getMaterials", () => {
    it("findByStoryId の結果をそのまま返す", async () => {
      const materials = [{ id: 1, storyId: 10, title: "資料A" }];
      vi.mocked(repo.findByStoryId).mockResolvedValue(materials as never);
      await expect(usecase.getMaterials(10)).resolves.toBe(materials);
    });

    it("groupId・search・sort をフィルタとして渡す", async () => {
      vi.mocked(repo.findByStoryId).mockResolvedValue([] as never);
      await usecase.getMaterials(10, 3, "キーワード", "asc");
      expect(repo.findByStoryId).toHaveBeenCalledWith(10, 3, "キーワード", "asc");
    });

    it("sort 未指定のとき desc をデフォルトで渡す", async () => {
      vi.mocked(repo.findByStoryId).mockResolvedValue([] as never);
      await usecase.getMaterials(10);
      expect(repo.findByStoryId).toHaveBeenCalledWith(10, undefined, undefined, "desc");
    });
  });

  describe("getMaterial", () => {
    it("存在する資料を返す", async () => {
      const material = { id: 1, storyId: 10, title: "資料A" };
      vi.mocked(repo.findById).mockResolvedValue(material as never);
      await expect(usecase.getMaterial(10, 1)).resolves.toBe(material);
    });

    it("見つからないとき MaterialNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getMaterial(10, 99)).rejects.toThrow(MaterialNotFoundError);
    });

    it("storyId が一致しないとき MaterialNotFoundError を投げる（所有権チェック）", async () => {
      const material = { id: 1, storyId: 99, title: "資料A" };
      vi.mocked(repo.findById).mockResolvedValue(material as never);
      await expect(usecase.getMaterial(10, 1)).rejects.toThrow(MaterialNotFoundError);
    });

    it("MaterialNotFoundError のメッセージに id が含まれる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getMaterial(10, 42)).rejects.toThrow("42");
    });
  });

  describe("createMaterial", () => {
    it("repo.create の結果をそのまま返す", async () => {
      const created = { id: 2, storyId: 10, name: "資料B" };
      vi.mocked(repo.create).mockResolvedValue(created as never);
      await expect(
        usecase.createMaterial(10, {
          groupId: 1,
          name: "資料B",
          aspectRatio: "16:9",
          artStyle: "アニメ調",
          locationMain: "室内",
          timeSlot: "昼",
          weather: "晴れ",
        })
      ).resolves.toBe(created);
    });
  });

  describe("updateMaterial", () => {
    it("存在して所有権があるとき repo.update を呼ぶ", async () => {
      const material = { id: 1, storyId: 10, name: "資料A" };
      vi.mocked(repo.findById).mockResolvedValue(material as never);
      const updated = { ...material, name: "更新後" };
      vi.mocked(repo.update).mockResolvedValue(updated as never);
      await expect(usecase.updateMaterial(10, 1, { name: "更新後" })).resolves.toBe(updated);
    });

    it("見つからないとき MaterialNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.updateMaterial(10, 99, { name: "dummy" })).rejects.toThrow(
        MaterialNotFoundError
      );
    });

    it("storyId が一致しないとき MaterialNotFoundError を投げる（所有権チェック）", async () => {
      const material = { id: 1, storyId: 99, title: "資料A" };
      vi.mocked(repo.findById).mockResolvedValue(material as never);
      await expect(usecase.updateMaterial(10, 1, { name: "更新後" })).rejects.toThrow(MaterialNotFoundError);
    });
  });

  describe("deleteMaterial", () => {
    it("存在して所有権があるとき repo.delete を呼ぶ", async () => {
      const material = { id: 1, storyId: 10, title: "資料A" };
      vi.mocked(repo.findById).mockResolvedValue(material as never);
      vi.mocked(repo.delete).mockResolvedValue(undefined as never);
      await usecase.deleteMaterial(10, 1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it("見つからないとき MaterialNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.deleteMaterial(10, 99)).rejects.toThrow(MaterialNotFoundError);
    });

    it("storyId が一致しないとき MaterialNotFoundError を投げる", async () => {
      const material = { id: 1, storyId: 99, title: "資料A" };
      vi.mocked(repo.findById).mockResolvedValue(material as never);
      await expect(usecase.deleteMaterial(10, 1)).rejects.toThrow(MaterialNotFoundError);
    });
  });
});
