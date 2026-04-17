import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/", async (c) => {
  const r = await query(c.env, "SELECT * FROM codigos WHERE activo = 1 ORDER BY nombre");
  return c.json(r.rows);
});

route.post("/", async (c) => {
  const { nombre, descripcion, tiene_numeracion, tiene_precio, tiene_stock } = await c.req.json();
  const r = await query(c.env,
    "INSERT INTO codigos (nombre, descripcion, tiene_numeracion, tiene_precio, tiene_stock) VALUES (?, ?, ?, ?, ?)",
    [nombre, descripcion || null, tiene_numeracion ? 1 : 0, tiene_precio ? 1 : 0, tiene_stock ? 1 : 0]
  );
  return c.json({ id: r.lastInsertRowid });
});

route.put("/:id", async (c) => {
  const { nombre, descripcion, tiene_numeracion, tiene_precio, tiene_stock } = await c.req.json();
  await query(c.env,
    "UPDATE codigos SET nombre = ?, descripcion = ?, tiene_numeracion = ?, tiene_precio = ?, tiene_stock = ? WHERE id = ?",
    [nombre, descripcion || null, tiene_numeracion ? 1 : 0, tiene_precio ? 1 : 0, tiene_stock ? 1 : 0, c.req.param("id")]
  );
  return c.json({ ok: true });
});

route.delete("/:id", async (c) => {
  await query(c.env, "UPDATE codigos SET activo = 0 WHERE id = ?", [c.req.param("id")]);
  return c.json({ ok: true });
});

export default route;
