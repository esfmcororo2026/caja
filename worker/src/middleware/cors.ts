import { Context, Next } from "hono";

export async function corsMiddleware(c: Context, next: Next) {
  c.header("Access-Control-Allow-Origin", "https://esfmcororo2026.github.io");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (c.req.method === "OPTIONS") return c.text("", 204);
  await next();
}
