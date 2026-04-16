import { Context, Next } from "hono";
import { Env } from "../db/client";

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return c.json({ error: "No autorizado" }, 401);
  }
  const token = auth.split(" ")[1];
  try {
    const [header, payload] = token.split(".").slice(0, 2);
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ error: "Token expirado" }, 401);
    }
    c.set("user", decoded);
    await next();
  } catch {
    return c.json({ error: "Token inválido" }, 401);
  }
}
