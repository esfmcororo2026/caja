import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/stock", async (c) => {
  const r = await query(c.env, `SELECT i.id, i.nombre, i.stock_actual, u.nombre as unidad, c.nombre as categoria FROM items i JOIN unidades u ON i.unidad_id = u.id JOIN categorias c ON i.categoria_id = c.id WHERE i.tiene_stock = 1 AND i.activo = 1`);
  return c.json(r.rows);
});

route.get("/movimientos", async (c) => {
  const { desde, hasta, item_id } = c.req.query();
  const args = item_id ? [desde || "2000-01-01", hasta || "2099-12-31", item_id] : [desde || "2000-01-01", hasta || "2099-12-31"];
  const r = await query(c.env, `SELECT m.*, i.nombre as item, u.nombre as usuario FROM inventario_movimientos m JOIN items i ON m.item_id = i.id JOIN usuarios u ON m.usuario_id = u.id WHERE m.fecha BETWEEN ? AND ? ${item_id ? "AND m.item_id = ?" : ""} ORDER BY m.fecha DESC`, args);
  return c.json(r.rows);
});

route.post("/movimientos", async (c) => {
  const { item_id, tipo, cantidad, motivo, usuario_id } = await c.req.json();
  await query(c.env, "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)", [item_id, tipo, cantidad, motivo, usuario_id]);
  const delta = tipo === "ingreso" ? cantidad : -cantidad;
  await query(c.env, "UPDATE items SET stock_actual = stock_actual + ? WHERE id = ? AND tiene_stock = 1", [delta, item_id]);
  return c.json({ ok: true });
});

export default route;
