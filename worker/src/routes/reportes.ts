import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/ventas", async (c) => {
  const { desde, hasta } = c.req.query();
  const r = await query(c.env, `SELECT DATE(v.fecha) as dia, COUNT(*) as total_ventas, SUM(v.total) as monto_total FROM ventas v WHERE v.fecha BETWEEN ? AND ? GROUP BY DATE(v.fecha) ORDER BY dia DESC`, [desde || "2000-01-01", hasta || "2099-12-31"]);
  return c.json(r.rows);
});

route.get("/ventas/detalle", async (c) => {
  const { desde, hasta } = c.req.query();
  const r = await query(c.env, `SELECT dv.*, i.nombre as item, v.fecha, cl.nombre as cliente FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id JOIN items i ON dv.item_id = i.id LEFT JOIN clientes cl ON v.cliente_id = cl.id WHERE v.fecha BETWEEN ? AND ? ORDER BY v.fecha DESC`, [desde || "2000-01-01", hasta || "2099-12-31"]);
  return c.json(r.rows);
});

route.post("/caja/abrir", async (c) => {
  const { usuario_id, monto_apertura } = await c.req.json();
  const abierta = await query(c.env, "SELECT id FROM caja_sesiones WHERE usuario_id = ? AND estado = 'abierta'", [usuario_id]);
  if (abierta.rows.length) return c.json({ error: "Ya hay una caja abierta" }, 400);
  const r = await query(c.env, "INSERT INTO caja_sesiones (usuario_id, monto_apertura) VALUES (?, ?)", [usuario_id, monto_apertura]);
  return c.json({ id: r.lastInsertRowid });
});

route.post("/caja/cerrar", async (c) => {
  const { caja_sesion_id, monto_cierre, denominaciones } = await c.req.json();
  await query(c.env, "UPDATE caja_sesiones SET estado = 'cerrada', fecha_cierre = datetime('now'), monto_cierre = ? WHERE id = ?", [monto_cierre, caja_sesion_id]);
  for (const d of denominaciones) {
    await query(c.env, "INSERT INTO arqueo_denominaciones (caja_sesion_id, tipo, denominacion, cantidad, subtotal) VALUES (?, ?, ?, ?, ?)", [caja_sesion_id, d.tipo, d.denominacion, d.cantidad, d.subtotal]);
  }
  return c.json({ ok: true });
});

route.get("/caja/:id", async (c) => {
  const id = c.req.param("id");
  const sesion = await query(c.env, "SELECT * FROM caja_sesiones WHERE id = ?", [id]);
  const denominaciones = await query(c.env, "SELECT * FROM arqueo_denominaciones WHERE caja_sesion_id = ?", [id]);
  const ventas = await query(c.env, `SELECT SUM(total) as total_ventas FROM ventas WHERE usuario_id = (SELECT usuario_id FROM caja_sesiones WHERE id = ?) AND fecha >= (SELECT fecha_apertura FROM caja_sesiones WHERE id = ?)`, [id, id]);
  return c.json({ sesion: sesion.rows[0], denominaciones: denominaciones.rows, ventas: ventas.rows[0] });
});

export default route;
