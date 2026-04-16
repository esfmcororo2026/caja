import { Hono } from "hono";
import { Env, getDB } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

// Categorias
route.get("/categorias", async (c) => {
  const db = getDB(c.env);
  const r = await db.execute("SELECT * FROM categorias WHERE activo = 1");
  return c.json(r.rows);
});

route.post("/categorias", async (c) => {
  const { nombre, descripcion } = await c.req.json();
  const db = getDB(c.env);
  const r = await db.execute({ sql: "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)", args: [nombre, descripcion] });
  return c.json({ id: Number(r.lastInsertRowid) });
});

route.put("/categorias/:id", async (c) => {
  const { nombre, descripcion } = await c.req.json();
  const db = getDB(c.env);
  await db.execute({ sql: "UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?", args: [nombre, descripcion, c.req.param("id")] });
  return c.json({ ok: true });
});

route.delete("/categorias/:id", async (c) => {
  const db = getDB(c.env);
  await db.execute({ sql: "UPDATE categorias SET activo = 0 WHERE id = ?", args: [c.req.param("id")] });
  return c.json({ ok: true });
});

// Items
route.get("/items", async (c) => {
  const db = getDB(c.env);
  const r = await db.execute(`
    SELECT i.*, c.nombre as categoria, u.nombre as unidad_nombre, u.abreviatura
    FROM items i
    JOIN categorias c ON i.categoria_id = c.id
    JOIN unidades u ON i.unidad_id = u.id
    WHERE i.activo = 1
  `);
  return c.json(r.rows);
});

route.post("/items", async (c) => {
  const { nombre, categoria_id, precio, unidad_id, tiene_stock, stock_actual } = await c.req.json();
  const db = getDB(c.env);
  const r = await db.execute({
    sql: "INSERT INTO items (nombre, categoria_id, precio, unidad_id, tiene_stock, stock_actual) VALUES (?, ?, ?, ?, ?, ?)",
    args: [nombre, categoria_id, precio, unidad_id, tiene_stock ? 1 : 0, stock_actual || 0],
  });
  return c.json({ id: Number(r.lastInsertRowid) });
});

route.put("/items/:id", async (c) => {
  const { nombre, precio, unidad_id, tiene_stock, stock_actual, usuario_id } = await c.req.json();
  const db = getDB(c.env);
  const current = await db.execute({ sql: "SELECT precio FROM items WHERE id = ?", args: [c.req.param("id")] });
  if (current.rows.length && current.rows[0].precio !== precio) {
    await db.execute({
      sql: "INSERT INTO precios_historial (item_id, precio_anterior, precio_nuevo, usuario_id) VALUES (?, ?, ?, ?)",
      args: [c.req.param("id"), current.rows[0].precio, precio, usuario_id],
    });
  }
  await db.execute({
    sql: "UPDATE items SET nombre = ?, precio = ?, unidad_id = ?, tiene_stock = ?, stock_actual = ? WHERE id = ?",
    args: [nombre, precio, unidad_id, tiene_stock ? 1 : 0, stock_actual, c.req.param("id")],
  });
  return c.json({ ok: true });
});

route.delete("/items/:id", async (c) => {
  const db = getDB(c.env);
  await db.execute({ sql: "UPDATE items SET activo = 0 WHERE id = ?", args: [c.req.param("id")] });
  return c.json({ ok: true });
});

// Unidades
route.get("/unidades", async (c) => {
  const db = getDB(c.env);
  const r = await db.execute("SELECT * FROM unidades");
  return c.json(r.rows);
});

route.post("/unidades", async (c) => {
  const { nombre, abreviatura } = await c.req.json();
  const db = getDB(c.env);
  const r = await db.execute({ sql: "INSERT INTO unidades (nombre, abreviatura) VALUES (?, ?)", args: [nombre, abreviatura] });
  return c.json({ id: Number(r.lastInsertRowid) });
});

export default route;
