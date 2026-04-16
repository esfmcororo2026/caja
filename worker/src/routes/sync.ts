import { Hono } from "hono";
import { Env, getDB } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

// Recibir cola de operaciones offline
route.post("/", async (c) => {
  const { operaciones } = await c.req.json();
  const db = getDB(c.env);
  const resultados = [];
  for (const op of operaciones) {
    try {
      await db.execute({ sql: op.sql, args: op.args });
      resultados.push({ id: op.id, ok: true });
    } catch (e: any) {
      resultados.push({ id: op.id, ok: false, error: e.message });
    }
  }
  return c.json({ resultados });
});

export default route;
