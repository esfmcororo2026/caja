import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/categorias", async (c) => {
  const r = await query(c.env, "SELECT * FROM categorias WHERE activo = 1");
  return c.json(r.rows);
});

route.post("/categorias", async (c) => {
  const { nombre, descripcion } = await c.req.json();
  const r = await query(c.env, "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
  return c.json({ id: r.lastInsertRowid });
});

route.put("/categorias/:id", async (c) => {
  const { nombre, descripcion } = await c.req.json();
  await query(c.env, "UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?", [nombre, descripcion, c.req.param("id")]);
  return c.json({ ok: true });
});

route.delete("/categorias/:id", async (c) => {
  await query(c.env, "UPDATE categorias SET activo = 0 WHERE id = ?", [c.req.param("id")]);
  return c.json({ ok: true });
});

route.get("/items", async (c) => {
  const r = await query(c.env, `SELECT i.*, c.nombre as categoria, u.nombre as unidad_nombre, u.abreviatura FROM items i JOIN categorias c ON i.categoria_id = c.id JOIN unidades u ON i.unidad_id = u.id WHERE i.activo = 1`);
  return c.json(r.rows);
});

route.post("/items", async (c) => {
  const { nombre, categoria_id, precio, unidad_id, tiene_stock, stock_actual } = await c.req.json();
  const r = await query(c.env, "INSERT INTO items (nombre, categoria_id, precio, unidad_id, tiene_stock, stock_actual) VALUES (?, ?, ?, ?, ?, ?)", [nombre, categoria_id, precio, unidad_id, tiene_stock ? 1 : 0, stock_actual || 0]);
  return c.json({ id: r.lastInsertRowid });
});

route.put("/items/:id", async (c) => {
  const { nombre, precio, unidad_id, tiene_stock, stock_actual, usuario_id } = await c.req.json();
  const current = await query(c.env, "SELECT precio FROM items WHERE id = ?", [c.req.param("id")]);
  if (current.rows.length && current.rows[0].precio !== precio) {
    await query(c.env, "INSERT INTO precios_historial (item_id, precio_anterior, precio_nuevo, usuario_id) VALUES (?, ?, ?, ?)", [c.req.param("id"), current.rows[0].precio, precio, usuario_id]);
  }
  await query(c.env, "UPDATE items SET nombre = ?, precio = ?, unidad_id = ?, tiene_stock = ?, stock_actual = ? WHERE id = ?", [nombre, precio, unidad_id, tiene_stock ? 1 : 0, stock_actual, c.req.param("id")]);
  return c.json({ ok: true });
});

route.delete("/items/:id", async (c) => {
  await query(c.env, "UPDATE items SET activo = 0 WHERE id = ?", [c.req.param("id")]);
  return c.json({ ok: true });
});

route.get("/unidades", async (c) => {
  const r = await query(c.env, "SELECT * FROM unidades");
  return c.json(r.rows);
});

route.post("/unidades", async (c) => {
  const { nombre, abreviatura } = await c.req.json();
  const r = await query(c.env, "INSERT INTO unidades (nombre, abreviatura) VALUES (?, ?)", [nombre, abreviatura]);
  return c.json({ id: r.lastInsertRowid });
});

export default route;
