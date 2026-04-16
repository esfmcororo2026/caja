import { Hono } from "hono";
import { Env, getDB } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

// Reporte de ventas por rango de fechas
route.get("/ventas", async (c) => {
  const { desde, hasta } = c.req.query();
  const db = getDB(c.env);
  const r = await db.execute({
    sql: `SELECT DATE(v.fecha) as dia, COUNT(*) as total_ventas, SUM(v.total) as monto_total
          FROM ventas v
          WHERE v.fecha BETWEEN ? AND ?
          GROUP BY DATE(v.fecha)
          ORDER BY dia DESC`,
    args: [desde || "2000-01-01", hasta || "2099-12-31"],
  });
  return c.json(r.rows);
});

// Detalle de ventas por rango
route.get("/ventas/detalle", async (c) => {
  const { desde, hasta } = c.req.query();
  const db = getDB(c.env);
  const r = await db.execute({
    sql: `SELECT dv.*, i.nombre as item, v.fecha, cl.nombre as cliente
          FROM detalle_ventas dv
          JOIN ventas v ON dv.venta_id = v.id
          JOIN items i ON dv.item_id = i.id
          LEFT JOIN clientes cl ON v.cliente_id = cl.id
          WHERE v.fecha BETWEEN ? AND ?
          ORDER BY v.fecha DESC`,
    args: [desde || "2000-01-01", hasta || "2099-12-31"],
  });
  return c.json(r.rows);
});

// Apertura de caja
route.post("/caja/abrir", async (c) => {
  const { usuario_id, monto_apertura } = await c.req.json();
  const db = getDB(c.env);
  const abierta = await db.execute({
    sql: "SELECT id FROM caja_sesiones WHERE usuario_id = ? AND estado = 'abierta'",
    args: [usuario_id],
  });
  if (abierta.rows.length) return c.json({ error: "Ya hay una caja abierta" }, 400);
  const r = await db.execute({
    sql: "INSERT INTO caja_sesiones (usuario_id, monto_apertura) VALUES (?, ?)",
    args: [usuario_id, monto_apertura],
  });
  return c.json({ id: Number(r.lastInsertRowid) });
});

// Cierre de caja
route.post("/caja/cerrar", async (c) => {
  const { caja_sesion_id, monto_cierre, denominaciones } = await c.req.json();
  const db = getDB(c.env);
  await db.execute({
    sql: "UPDATE caja_sesiones SET estado = 'cerrada', fecha_cierre = datetime('now'), monto_cierre = ? WHERE id = ?",
    args: [monto_cierre, caja_sesion_id],
  });
  for (const d of denominaciones) {
    await db.execute({
      sql: "INSERT INTO arqueo_denominaciones (caja_sesion_id, tipo, denominacion, cantidad, subtotal) VALUES (?, ?, ?, ?, ?)",
      args: [caja_sesion_id, d.tipo, d.denominacion, d.cantidad, d.subtotal],
    });
  }
  return c.json({ ok: true });
});

// Arqueo de caja (ver sesión)
route.get("/caja/:id", async (c) => {
  const db = getDB(c.env);
  const sesion = await db.execute({
    sql: "SELECT * FROM caja_sesiones WHERE id = ?",
    args: [c.req.param("id")],
  });
  const denominaciones = await db.execute({
    sql: "SELECT * FROM arqueo_denominaciones WHERE caja_sesion_id = ?",
    args: [c.req.param("id")],
  });
  const ventasSesion = await db.execute({
    sql: `SELECT SUM(total) as total_ventas FROM ventas
          WHERE usuario_id = (SELECT usuario_id FROM caja_sesiones WHERE id = ?)
          AND fecha >= (SELECT fecha_apertura FROM caja_sesiones WHERE id = ?)`,
    args: [c.req.param("id"), c.req.param("id")],
  });
  return c.json({ sesion: sesion.rows[0], denominaciones: denominaciones.rows, ventas: ventasSesion.rows[0] });
});

export default route;
