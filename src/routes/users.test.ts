import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import users from "./users.js";
import { userUsecase } from "../lib/container.js";
import { UserNotFoundError } from "../usecases/userUsecase.js";

vi.mock("../lib/container.js", () => ({
  userUsecase: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    registerUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

const app = new Hono().route("/users", users);

describe("users routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("GET /users", () => {
    it("200 でユーザー一覧を返す", async () => {
      const data = [{ id: 1, email: "alice@example.com" }];
      vi.mocked(userUsecase.getUsers).mockResolvedValue(data as never);
      const res = await app.request("/users");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });
  });

  describe("GET /users/:id", () => {
    it("200 でユーザーを返す", async () => {
      const data = { id: 1, email: "alice@example.com" };
      vi.mocked(userUsecase.getUser).mockResolvedValue(data as never);
      const res = await app.request("/users/1");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(data);
    });

    it("存在しないとき 404 を返す", async () => {
      vi.mocked(userUsecase.getUser).mockRejectedValue(new UserNotFoundError(99));
      const res = await app.request("/users/99");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /users", () => {
    it("201 で作成したユーザーを返す", async () => {
      const created = { id: 2, email: "bob@example.com" };
      vi.mocked(userUsecase.registerUser).mockResolvedValue(created as never);
      const res = await app.request("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bob@example.com" }),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(created);
    });
  });

  describe("PUT /users/:id", () => {
    it("200 で更新したユーザーを返す", async () => {
      const updated = { id: 1, email: "alice@example.com", name: "Alice Updated" };
      vi.mocked(userUsecase.updateUser).mockResolvedValue(updated as never);
      const res = await app.request("/users/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice Updated" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(updated);
    });
  });

  describe("DELETE /users/:id", () => {
    it("200 で Deleted を返す", async () => {
      vi.mocked(userUsecase.deleteUser).mockResolvedValue(undefined as never);
      const res = await app.request("/users/1", { method: "DELETE" });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "Deleted" });
    });
  });
});
