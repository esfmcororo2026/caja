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
    const lote = await query(c.env, "SELECT * FROM item_lotes WHERE id = ? AND activo = 1 AND stock_actual > 0", [lote_id]);
    if (!lote.rows.length) return c.json({ error: "Lote no encontrado o sin stock" }, 404);
    const stock = lote.rows[0].stock_actual;
    // Solo desactivar el lote - sin tocar ventas ni ingresos
    await query(c.env, "UPDATE item_lotes SET activo = 0 WHERE id = ?", [lote_id]);
    // Registrar como 'retiro' - tipo exclusivo, no confundible con venta ni egreso economico
    await query(c.env,
      "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'retiro', ?, ?, ?)",
      [item_id, stock, motivo, usuario_id]
    );
    // Recalcular stock total del item
    const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [item_id]);
    await query(c.env, "UPDATE items SET stock_actual = ? WHERE id = ?", [stockTotal.rows[0].total, item_id]);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Baja y reposicion: item vendido dañado, se repone con el siguiente del stock
route.post("/baja-reposicion", async (c) => {
  try {
    const { item_id, numero_baja, motivo, usuario_id } = await c.req.json();
    if (!item_id || !motivo?.trim() || !numero_baja) return c.json({ error: "item_id, numero_baja y motivo son requeridos" }, 400);

    // Validar que el número de baja fue realmente vendido
    const ventaR = await query(c.env,
      "SELECT dv.* FROM detalle_ventas dv JOIN ventas v ON dv.venta_id = v.id WHERE dv.item_id = ? AND ? BETWEEN dv.numeracion_desde AND dv.numeracion_hasta LIMIT 1",
      [item_id, numero_baja]
    );
    if (!ventaR.rows.length) return c.json({ error: `El N° ${numero_baja} no corresponde a ninguna venta registrada de este item` }, 400);

    // Verificar que no se haya dado de baja antes
    const yaRegistrado = await query(c.env,
      "SELECT id FROM inventario_movimientos WHERE item_id = ? AND tipo = 'baja_reposicion' AND motivo LIKE ?",
      [item_id, `%N° ${numero_baja}%`]
    );
    if (yaRegistrado.rows.length) return c.json({ error: `El N° ${numero_baja} ya fue registrado como baja anteriormente` }, 400);

    // Verificar stock disponible para reponer
    const loteR = await query(c.env,
      "SELECT * FROM item_lotes WHERE item_id = ? AND activo = 1 AND stock_actual > 0 ORDER BY created_at ASC LIMIT 1",
      [item_id]);
    if (!loteR.rows.length) return c.json({ error: "No hay stock disponible para entregar como reposición" }, 400);

    const lote = loteR.rows[0];
    const numeroReposicion = lote.numeracion_actual;
    const nuevoStock = Number(lote.stock_actual) - 1;

    if (nuevoStock <= 0) {
      await query(c.env, "UPDATE item_lotes SET stock_actual = 0, activo = 0 WHERE id = ?", [lote.id]);
    } else {
      await query(c.env, "UPDATE item_lotes SET stock_actual = stock_actual - 1, numeracion_actual = numeracion_actual + 1 WHERE id = ?", [lote.id]);
    }

    // Registrar con los números de baja y reposición en el motivo para trazabilidad
    const motivoCompleto = `[BAJA N° ${numero_baja} → REPOSICIÓN N° ${numeroReposicion}] ${motivo}`;
    await query(c.env,
      "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'baja_reposicion', 1, ?, ?)",
      [item_id, motivoCompleto, usuario_id]);

    const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [item_id]);
    await query(c.env, "UPDATE items SET stock_actual = ? WHERE id = ?", [stockTotal.rows[0].total, item_id]);
    return c.json({ ok: true, numero_reposicion: numeroReposicion });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Devolucion: cliente devuelve item, vuelve al stock sin generar ingreso economico
route.post("/devolucion", async (c) => {
  try {
    const { item_id, lote_id, cantidad, motivo, usuario_id } = await c.req.json();
    if (!item_id || !motivo?.trim() || !cantidad) return c.json({ error: "Faltan campos requeridos" }, 400);
    // Sumar al lote indicado o al mas reciente activo
    const loteTarget = lote_id
      ? await query(c.env, "SELECT * FROM item_lotes WHERE id = ? AND item_id = ?", [lote_id, item_id])
      : await query(c.env, "SELECT * FROM item_lotes WHERE item_id = ? AND activo = 1 ORDER BY created_at DESC LIMIT 1", [item_id]);
    if (!loteTarget.rows.length) return c.json({ error: "No se encontró lote para la devolución" }, 400);
    const lote = loteTarget.rows[0];
    await query(c.env, "UPDATE item_lotes SET stock_actual = stock_actual + ?, activo = 1 WHERE id = ?", [cantidad, lote.id]);
    await query(c.env,
      "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'devolucion', ?, ?, ?)",
      [item_id, cantidad, motivo, usuario_id]);
    const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [item_id]);
    await query(c.env, "UPDATE items SET stock_actual = ? WHERE id = ?", [stockTotal.rows[0].total, item_id]);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default route;
