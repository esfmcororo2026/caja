import { Hono } from "hono";
import { Env, getDB } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/", async (c) => {
  const { desde, hasta } = c.req.query();
  const db = getDB(c.env);
  const r = await db.execute({
    sql: `SELECT v.*, cl.nombre as cliente_nombre, u.nombre as cajero
          FROM ventas v
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          JOIN usuarios u ON v.usuario_id = u.id
          WHERE v.fecha BETWEEN ? AND ?
          ORDER BY v.fecha DESC`,
    args: [desde || "2000-01-01", hasta || "2099-12-31"],
  });
  return c.json(r.rows);
});

route.post("/", async (c) => {
  const { cliente_id, usuario_id, total, detalle } = await c.req.json();
  const db = getDB(c.env);
  const venta = await db.execute({
    sql: "INSERT INTO ventas (cliente_id, usuario_id, total) VALUES (?, ?, ?)",
    args: [cliente_id || null, usuario_id, total],
  });
  const venta_id = Number(venta.lastInsertRowid);
  for (const d of detalle) {
    await db.execute({
      sql: "INSERT INTO detalle_ventas (venta_id, item_id, cantidad, precio_unitario, subtotal, unidad_id) VALUES (?, ?, ?, ?, ?, ?)",
      args: [venta_id, d.item_id, d.cantidad, d.precio_unitario, d.subtotal, d.unidad_id],
    });
    // Descontar stock si aplica
    await db.execute({
      sql: "UPDATE items SET stock_actual = stock_actual - ? WHERE id = ? AND tiene_stock = 1",
      args: [d.cantidad, d.item_id],
    });
    // Registrar movimiento inventario
    await db.execute({
      sql: "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'venta', ?, 'Venta #' || ?, ?)",
      args: [d.item_id, d.cantidad, venta_id, usuario_id],
    });
  }
  return c.json({ id: venta_id });
});

// Clientes
route.get("/clientes", async (c) => {
  const db = getDB(c.env);
  const r = await db.execute("SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre");
  return c.json(r.rows);
});

route.post("/clientes", async (c) => {
  const { nombre, ci, tipo } = await c.req.json();
  const db = getDB(c.env);
  const r = await db.execute({
    sql: "INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)",
    args: [nombre, ci || null, tipo || "otro"],
  });
  return c.json({ id: Number(r.lastInsertRowid) });
});

// Carga masiva de clientes CSV
route.post("/clientes/bulk", async (c) => {
  const { clientes } = await c.req.json();
  const db = getDB(c.env);
  for (const cl of clientes) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)",
      args: [cl.nombre, cl.ci || null, cl.tipo || "otro"],
    });
  }
  return c.json({ ok: true, total: clientes.length });
});

export default route;
