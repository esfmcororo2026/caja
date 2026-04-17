import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.post("/", async (c) => {
  const { operaciones } = await c.req.json();
  const resultados = [];
  for (const op of operaciones) {
    try {
      await query(c.env, op.sql, op.args);
      resultados.push({ id: op.id, ok: true });
    } catch (e: any) {
      resultados.push({ id: op.id, ok: false, error: e.message });
    }
  }
  return c.json({ resultados });
});

export default route;
