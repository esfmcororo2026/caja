import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/ventas", async (c) => {
  const { desde, hasta } = c.req.query();
  const r = await query(c.env, `SELECT DATE(v.fecha) as dia, COUNT(*) as total_ventas, SUM(v.total) as monto_total FROM ventas v WHERE DATE(v.fecha) BETWEEN ? AND ? GROUP BY DATE(v.fecha) ORDER BY dia DESC`, [desde || "2000-01-01", hasta || "2099-12-31"]);
  return c.json(r.rows);
});

route.get("/ventas/detalle", async (c) => {
  const { desde, hasta } = c.req.query();
  const ventas = await query(c.env,
    `SELECT v.id, v.fecha, v.total, cl.nombre as cliente, u.nombre as cajero
     FROM ventas v
     LEFT JOIN clientes cl ON v.cliente_id = cl.id
     JOIN usuarios u ON v.usuario_id = u.id
     WHERE DATE(v.fecha) BETWEEN ? AND ?
     ORDER BY v.fecha DESC`,
    [desde || "2000-01-01", hasta || "2099-12-31"]
  );
  const detalle = await query(c.env,
    `SELECT dv.venta_id, dv.cantidad, dv.precio_unitario, dv.subtotal,
            dv.numeracion_desde, dv.numeracion_hasta,
            i.nombre as item, un.abreviatura as unidad
     FROM detalle_ventas dv
     JOIN ventas v ON dv.venta_id = v.id
     JOIN items i ON dv.item_id = i.id
     JOIN unidades un ON dv.unidad_id = un.id
     WHERE DATE(v.fecha) BETWEEN ? AND ?`,
    [desde || "2000-01-01", hasta || "2099-12-31"]
  );
  const detalleMap: Record<number, any[]> = {};
  for (const d of detalle.rows) {
    if (!detalleMap[d.venta_id]) detalleMap[d.venta_id] = [];
    detalleMap[d.venta_id].push(d);
  }
  const result = ventas.rows.map(v => ({ ...v, items: detalleMap[v.id] || [] }));
  return c.json(result);
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

route.get("/caja/sesion-activa/:usuario_id", async (c) => {
  const usuario_id = c.req.param("usuario_id");
  const r = await query(c.env, "SELECT * FROM caja_sesiones WHERE usuario_id = ? AND estado = 'abierta' ORDER BY fecha_apertura DESC LIMIT 1", [usuario_id]);
  if (!r.rows.length) return c.json({ sesion: null });
  return c.json({ sesion: r.rows[0] });
});

route.get("/caja/:id", async (c) => {
  const id = c.req.param("id");
  const sesion = await query(c.env, "SELECT * FROM caja_sesiones WHERE id = ?", [id]);
  if (!sesion.rows.length) return c.json({ error: "Sesión no encontrada" }, 404);
  const s = sesion.rows[0];
  const fechaCierre = s.fecha_cierre || "2099-12-31 23:59:59";
  const denominaciones = await query(c.env, "SELECT * FROM arqueo_denominaciones WHERE caja_sesion_id = ?", [id]);
  const ventas = await query(c.env,
    `SELECT COUNT(*) as total_transacciones, COALESCE(SUM(total), 0) as total_ventas
     FROM ventas
     WHERE usuario_id = ? AND fecha >= ? AND fecha <= ?`,
    [s.usuario_id, s.fecha_apertura, fechaCierre]
  );
  return c.json({ sesion: s, denominaciones: denominaciones.rows, ventas: ventas.rows[0] });
});

export default route;
