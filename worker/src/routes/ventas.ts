import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/", async (c) => {
  const { desde, hasta } = c.req.query();
  const r = await query(c.env, `SELECT v.*, cl.nombre as cliente_nombre, u.nombre as cajero FROM ventas v LEFT JOIN clientes cl ON v.cliente_id = cl.id JOIN usuarios u ON v.usuario_id = u.id WHERE v.fecha BETWEEN ? AND ? ORDER BY v.fecha DESC`, [desde || "2000-01-01", hasta || "2099-12-31"]);
  return c.json(r.rows);
});

route.post("/", async (c) => {
  const { cliente_id, usuario_id, total, detalle } = await c.req.json();
  const venta = await query(c.env, "INSERT INTO ventas (cliente_id, usuario_id, total) VALUES (?, ?, ?)", [cliente_id || null, usuario_id, total]);
  const venta_id = venta.lastInsertRowid;
  for (const d of detalle) {
    await query(c.env, "INSERT INTO detalle_ventas (venta_id, item_id, cantidad, precio_unitario, subtotal, unidad_id) VALUES (?, ?, ?, ?, ?, ?)", [venta_id, d.item_id, d.cantidad, d.precio_unitario, d.subtotal, d.unidad_id]);
    await query(c.env, "UPDATE items SET stock_actual = stock_actual - ? WHERE id = ? AND tiene_stock = 1", [d.cantidad, d.item_id]);
    await query(c.env, "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'venta', ?, ?, ?)", [d.item_id, d.cantidad, `Venta #${venta_id}`, usuario_id]);
  }
  return c.json({ id: venta_id });
});

route.get("/clientes", async (c) => {
  const r = await query(c.env, "SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre");
  return c.json(r.rows);
});

route.post("/clientes", async (c) => {
  const { nombre, ci, tipo } = await c.req.json();
  const r = await query(c.env, "INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)", [nombre, ci || null, tipo || "otro"]);
  return c.json({ id: r.lastInsertRowid });
});

route.post("/clientes/bulk", async (c) => {
  const { clientes } = await c.req.json();
  for (const cl of clientes) {
    await query(c.env, "INSERT OR IGNORE INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)", [cl.nombre, cl.ci || null, cl.tipo || "otro"]);
  }
  return c.json({ ok: true, total: clientes.length });
});

export default route;
