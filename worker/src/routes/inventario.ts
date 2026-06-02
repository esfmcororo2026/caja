import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

// Stock: todos los lotes activos agrupados por item
route.get("/stock", async (c) => {
  const r = await query(c.env, `
    SELECT
      l.id as lote_id, l.numeracion_inicio, l.numeracion_fin, l.numeracion_actual, l.stock_actual, l.created_at,
      i.id as item_id, i.nombre, i.precio,
      u.nombre as unidad,
      cat.nombre as categoria,
      cd.nombre as codigo
    FROM item_lotes l
    JOIN items i ON l.item_id = i.id
    JOIN unidades u ON i.unidad_id = u.id
    JOIN categorias cat ON i.categoria_id = cat.id
    LEFT JOIN codigos cd ON i.codigo_id = cd.id
    WHERE l.activo = 1 AND l.stock_actual > 0 AND i.activo = 1
    ORDER BY i.nombre, l.created_at ASC
  `);
  return c.json(r.rows);
});

// Movimientos con filtro de fechas
route.get("/movimientos", async (c) => {
  const { desde, hasta } = c.req.query();
  const r = await query(c.env, `
    SELECT m.*, i.nombre as item, u.nombre as usuario
    FROM inventario_movimientos m
    JOIN items i ON m.item_id = i.id
    JOIN usuarios u ON m.usuario_id = u.id
    WHERE date(m.fecha) BETWEEN ? AND ?
    ORDER BY m.fecha DESC
  `, [desde || "2000-01-01", hasta || "2099-12-31"]);
  return c.json(r.rows);
});

// Registrar movimiento manual (ingreso/ajuste/egreso sobre un lote)
route.post("/movimientos", async (c) => {
  try {
    const { item_id, lote_id, tipo, cantidad, motivo, usuario_id } = await c.req.json();
    await query(c.env, "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, ?, ?, ?, ?)",
      [item_id, tipo, cantidad, motivo, usuario_id]);
    const delta = tipo === "ingreso" ? cantidad : -cantidad;
    if (lote_id) {
      await query(c.env, "UPDATE item_lotes SET stock_actual = stock_actual + ? WHERE id = ?", [delta, lote_id]);
    }
    // Sincronizar stock total en items
    const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [item_id]);
    await query(c.env, "UPDATE items SET stock_actual = ? WHERE id = ?", [stockTotal.rows[0].total, item_id]);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Agregar nuevo lote a un item existente
route.post("/lotes", async (c) => {
  try {
    const { item_id, numeracion_inicio, numeracion_fin, motivo, usuario_id } = await c.req.json();
    if (!item_id || !numeracion_inicio || !numeracion_fin) {
      return c.json({ error: "Faltan campos requeridos" }, 400);
    }
    const stock = numeracion_fin - numeracion_inicio + 1;
    const r = await query(c.env,
      "INSERT INTO item_lotes (item_id, numeracion_inicio, numeracion_fin, numeracion_actual, stock_actual) VALUES (?, ?, ?, ?, ?)",
      [item_id, numeracion_inicio, numeracion_fin, numeracion_inicio, stock]
    );
    // Registrar en movimientos
    await query(c.env, "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'ingreso', ?, ?, ?)",
      [item_id, stock, motivo || `Nuevo lote ${numeracion_inicio}-${numeracion_fin}`, usuario_id]);
    // Actualizar stock total en items
    const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [item_id]);
    await query(c.env, "UPDATE items SET stock_actual = ? WHERE id = ?", [stockTotal.rows[0].total, item_id]);
    return c.json({ id: r.lastInsertRowid });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Retirar lote (desactivar con justificacion)
route.post("/retirar-lote", async (c) => {
  try {
    const { lote_id, item_id, motivo, usuario_id } = await c.req.json();
    if (!lote_id || !motivo?.trim()) return c.json({ error: "lote_id y motivo requeridos" }, 400);
    const lote = await query(c.env, "SELECT * FROM item_lotes WHERE id = ?", [lote_id]);
    if (!lote.rows.length) return c.json({ error: "Lote no encontrado" }, 404);
    const stock = lote.rows[0].stock_actual;
    await query(c.env, "UPDATE item_lotes SET activo = 0 WHERE id = ?", [lote_id]);
    await query(c.env, "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'egreso', ?, ?, ?)",
      [item_id, stock, `RETIRO DE LOTE: ${motivo}`, usuario_id]);
    const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [item_id]);
    await query(c.env, "UPDATE items SET stock_actual = ? WHERE id = ?", [stockTotal.rows[0].total, item_id]);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default route;
