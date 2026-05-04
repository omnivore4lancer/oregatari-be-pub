import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

let cachedKey: JsonWebKey | null = null;

async function getJwksKey(): Promise<JsonWebKey> {
  if (cachedKey) return cachedKey;
  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
  const { keys } = (await res.json()) as { keys: JsonWebKey[] };
  cachedKey = keys[0];
  return cachedKey;
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const key = await getJwksKey();
    const payload = await verify(token, key, "ES256");
    c.set("user", { id: payload.sub as string, email: payload.email as string | undefined });
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
