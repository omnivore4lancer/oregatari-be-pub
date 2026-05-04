import type { MiddlewareHandler } from "hono";
import { storyUsecase } from "../lib/container.js";
import type { AppEnv } from "../lib/honoTypes.js";

export const storyOwnershipMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const storyId = Number(c.req.param("storyId"));
  if (isNaN(storyId)) return await next();

  const owned = await storyUsecase.isOwnedByUid(storyId, c.get("user").id);
  if (!owned) return c.json({ error: "Forbidden" }, 403);

  await next();
};
