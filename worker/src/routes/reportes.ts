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

route.post("/personalizado", async (c) => {
  try {
    const body = await c.req.json();
    const { desde, hasta, tipo_cliente, cliente_id, categoria_id, item_id, codigo_id, cajero_id, solo_numeracion, agrupacion } = body;

    const args: any[] = [];
    const wheres: string[] = ["1=1"];

    wheres.push("DATE(v.fecha) BETWEEN ? AND ?");
    args.push(desde || "2000-01-01", hasta || "2099-12-31");

    if (tipo_cliente) { wheres.push("cl.tipo = ?"); args.push(tipo_cliente); }
    if (cliente_id)   { wheres.push("v.cliente_id = ?"); args.push(cliente_id); }
    if (categoria_id) { wheres.push("i.categoria_id = ?"); args.push(categoria_id); }
    if (item_id)      { wheres.push("dv.item_id = ?"); args.push(item_id); }
    if (codigo_id)    { wheres.push("i.codigo_id = ?"); args.push(codigo_id); }
    if (cajero_id)    { wheres.push("v.usuario_id = ?"); args.push(cajero_id); }
    if (solo_numeracion) { wheres.push("dv.numeracion_desde IS NOT NULL"); }

    const where = wheres.join(" AND ");

    let sql = "";
    if (agrupacion === "dia") {
      sql = `SELECT DATE(v.fecha) as grupo, COUNT(DISTINCT v.id) as total_ventas, SUM(dv.subtotal) as monto_total
             FROM ventas v
             JOIN detalle_ventas dv ON dv.venta_id = v.id
             JOIN items i ON dv.item_id = i.id
             LEFT JOIN clientes cl ON v.cliente_id = cl.id
             WHERE ${where} GROUP BY DATE(v.fecha) ORDER BY grupo DESC`;
    } else if (agrupacion === "tipo_cliente") {
      sql = `SELECT COALESCE(cl.tipo, 'SIN TIPO') as grupo, COUNT(DISTINCT v.id) as total_ventas, SUM(dv.subtotal) as monto_total
             FROM ventas v
             JOIN detalle_ventas dv ON dv.venta_id = v.id
             JOIN items i ON dv.item_id = i.id
             LEFT JOIN clientes cl ON v.cliente_id = cl.id
             WHERE ${where} GROUP BY cl.tipo ORDER BY monto_total DESC`;
    } else if (agrupacion === "categoria") {
      sql = `SELECT cat.nombre as grupo, COUNT(DISTINCT v.id) as total_ventas, SUM(dv.subtotal) as monto_total
             FROM ventas v
             JOIN detalle_ventas dv ON dv.venta_id = v.id
             JOIN items i ON dv.item_id = i.id
             JOIN categorias cat ON i.categoria_id = cat.id
             LEFT JOIN clientes cl ON v.cliente_id = cl.id
             WHERE ${where} GROUP BY cat.nombre ORDER BY monto_total DESC`;
    } else if (agrupacion === "item") {
      sql = `SELECT i.nombre as grupo, SUM(dv.cantidad) as total_cantidad, SUM(dv.subtotal) as monto_total, COUNT(DISTINCT v.id) as total_ventas
             FROM ventas v
             JOIN detalle_ventas dv ON dv.venta_id = v.id
             JOIN items i ON dv.item_id = i.id
             LEFT JOIN clientes cl ON v.cliente_id = cl.id
             WHERE ${where} GROUP BY i.nombre ORDER BY monto_total DESC`;
    } else if (agrupacion === "cajero") {
      sql = `SELECT u.nombre as grupo, COUNT(DISTINCT v.id) as total_ventas, SUM(dv.subtotal) as monto_total
             FROM ventas v
             JOIN detalle_ventas dv ON dv.venta_id = v.id
             JOIN items i ON dv.item_id = i.id
             JOIN usuarios u ON v.usuario_id = u.id
             LEFT JOIN clientes cl ON v.cliente_id = cl.id
             WHERE ${where} GROUP BY u.nombre ORDER BY monto_total DESC`;
    } else {
      // Sin agrupacion: detalle por fila
      sql = `SELECT v.id as venta_id, DATE(v.fecha) as fecha, strftime('%H:%M', v.fecha) as hora,
               cl.nombre as cliente, cl.ci, cl.tipo as tipo_cliente,
               u.nombre as cajero,
               cat.nombre as categoria, cd.nombre as codigo,
               i.nombre as item, un.abreviatura as unidad,
               dv.cantidad, dv.precio_unitario, dv.subtotal, v.total,
               dv.numeracion_desde, dv.numeracion_hasta
             FROM ventas v
             JOIN detalle_ventas dv ON dv.venta_id = v.id
             JOIN items i ON dv.item_id = i.id
             JOIN categorias cat ON i.categoria_id = cat.id
             LEFT JOIN codigos cd ON i.codigo_id = cd.id
             JOIN unidades un ON dv.unidad_id = un.id
             JOIN usuarios u ON v.usuario_id = u.id
             LEFT JOIN clientes cl ON v.cliente_id = cl.id
             WHERE ${where}
             ORDER BY v.fecha DESC`;
    }

    const r = await query(c.env, sql, args);
    return c.json({ rows: r.rows, agrupacion: agrupacion || "detalle" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

route.get("/meta", async (c) => {
  const [categorias, items, codigos, cajeros] = await Promise.all([
    query(c.env, "SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre"),
    query(c.env, "SELECT id, nombre FROM items WHERE activo = 1 ORDER BY nombre"),
    query(c.env, "SELECT id, nombre, descripcion FROM codigos WHERE activo = 1 ORDER BY nombre"),
    query(c.env, "SELECT id, nombre FROM usuarios WHERE activo = 1 ORDER BY nombre"),
  ]);
  return c.json({ categorias: categorias.rows, items: items.rows, codigos: codigos.rows, cajeros: cajeros.rows });
});

export default route;
