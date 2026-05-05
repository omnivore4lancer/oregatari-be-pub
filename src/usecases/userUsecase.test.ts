import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserUsecase } from "./userUsecase.js";
import type { UserRepository } from "../repositories/userRepository.js";

function makeRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByUid: vi.fn(),
    upsertByUid: vi.fn(),
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

  describe("syncUser", () => {
    it("repo.upsertByUid の結果をそのまま返す", async () => {
      const synced = { user_id: 1, email: "a@example.com" };
      vi.mocked(repo.upsertByUid).mockResolvedValue(synced as never);
      await expect(usecase.syncUser({ uid: "uid-1", email: "a@example.com" })).resolves.toBe(synced);
    });
  });

  describe("findByUid", () => {
    it("repo.findByUid の結果をそのまま返す", async () => {
      const user = { user_id: 1, email: "a@example.com" };
      vi.mocked(repo.findByUid).mockResolvedValue(user as never);
      await expect(usecase.findByUid("uid-1")).resolves.toBe(user);
    });
  });
});
