import type { MiddlewareHandler } from "hono";
import { storyUsecase, userUsecase } from "../lib/container.js";
import type { AppEnv } from "../lib/honoTypes.js";

export const storyOwnershipMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const storyId = Number(c.req.param("storyId"));
  if (isNaN(storyId)) return await next();

  const dbUser = await userUsecase.findByUid(c.get("user").id);
  if (!dbUser) return c.json({ error: "Forbidden" }, 403);

  const owned = await storyUsecase.isOwnedBy(storyId, dbUser.user_id);
  if (!owned) return c.json({ error: "Forbidden" }, 403);

  await next();
};
