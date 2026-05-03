import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserUsecase, UserNotFoundError } from "./userUsecase.js";
import type { UserRepository } from "../repositories/userRepository.js";

function makeRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as UserRepository;
}

describe("UserUsecase", () => {
  let repo: UserRepository;
  let usecase: UserUsecase;

  beforeEach(() => {
    repo = makeRepo();
    usecase = new UserUsecase(repo);
  });

  describe("getUsers", () => {
    it("findAll の結果をそのまま返す", async () => {
      const users = [{ user_id: 1, email: "a@example.com" }];
      vi.mocked(repo.findAll).mockResolvedValue(users as never);
      await expect(usecase.getUsers()).resolves.toBe(users);
    });
  });

  describe("getUser", () => {
    it("存在するユーザーを返す", async () => {
      const user = { user_id: 1, email: "a@example.com" };
      vi.mocked(repo.findById).mockResolvedValue(user as never);
      await expect(usecase.getUser(1)).resolves.toBe(user);
    });

    it("見つからないとき UserNotFoundError を投げる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getUser(99)).rejects.toThrow(UserNotFoundError);
    });

    it("UserNotFoundError のメッセージに id が含まれる", async () => {
      vi.mocked(repo.findById).mockResolvedValue(null as never);
      await expect(usecase.getUser(42)).rejects.toThrow("42");
    });
  });

  describe("registerUser", () => {
    it("repo.create の結果をそのまま返す", async () => {
      const created = { user_id: 2, email: "b@example.com" };
      vi.mocked(repo.create).mockResolvedValue(created as never);
      await expect(usecase.registerUser({ email: "b@example.com" })).resolves.toBe(created);
    });
  });

  describe("updateUser", () => {
    it("repo.update の結果をそのまま返す", async () => {
      const updated = { user_id: 1, email: "new@example.com" };
      vi.mocked(repo.update).mockResolvedValue(updated as never);
      await expect(usecase.updateUser(1, { email: "new@example.com" })).resolves.toBe(updated);
    });
  });

  describe("deleteUser", () => {
    it("repo.delete を呼ぶ", async () => {
      vi.mocked(repo.delete).mockResolvedValue(undefined as never);
      await usecase.deleteUser(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
