import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import users from "./users.js";
import { userUsecase } from "../lib/container.js";
import type { AppEnv } from "../lib/honoTypes.js";

vi.mock("../lib/container.js", () => ({
  userUsecase: {
    syncUser: vi.fn(),
  },
}));

const app = new Hono<AppEnv>()
  .use("/*", async (c, next) => {
    c.set("user", { id: "uid-1", email: "test@example.com" } as never);
    await next();
  })
  .route("/users", users);

describe("users routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("POST /users/sync", () => {
    it("ユーザーを upsert して返す", async () => {
      const synced = { user_id: 1, email: "test@example.com" };
      vi.mocked(userUsecase.syncUser).mockResolvedValue(synced as never);
      const res = await app.request("/users/sync", { method: "POST" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(synced);
    });
  });
});
