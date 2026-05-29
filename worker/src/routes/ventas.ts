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
  try {
    const { persona_id, cliente_id, usuario_id, total, detalle } = await c.req.json();
    const finalClienteId = persona_id || cliente_id || null;
    if (!finalClienteId) return c.json({ error: "Debe seleccionar una persona" }, 400);
    if (!usuario_id) return c.json({ error: "usuario_id requerido" }, 400);
    if (!detalle?.length) return c.json({ error: "El carrito está vacío" }, 400);

    const venta = await query(c.env, "INSERT INTO ventas (cliente_id, usuario_id, total) VALUES (?, ?, ?)", [finalClienteId, usuario_id, total]);
    const venta_id = venta.lastInsertRowid;
    for (const d of detalle) {
      const itemR = await query(c.env, "SELECT i.tiene_stock, cd.tiene_numeracion FROM items i LEFT JOIN codigos cd ON i.codigo_id = cd.id WHERE i.id = ?", [d.item_id]);
      const item = itemR.rows[0];
      let num_desde = null;
      let num_hasta = null;
      if (item?.tiene_numeracion) {
        // Usar lote activo mas antiguo (FIFO)
        const loteR = await query(c.env, "SELECT * FROM item_lotes WHERE item_id = ? AND activo = 1 AND stock_actual > 0 ORDER BY created_at ASC LIMIT 1", [d.item_id]);
        const lote = loteR.rows[0];
        if (lote) {
          num_desde = lote.numeracion_actual;
          num_hasta = Number(lote.numeracion_actual) + Number(d.cantidad) - 1;
          const nuevoActual = num_hasta + 1;
          const nuevoStock = Number(lote.stock_actual) - Number(d.cantidad);
          if (nuevoStock <= 0) {
            await query(c.env, "UPDATE item_lotes SET numeracion_actual = ?, stock_actual = 0, activo = 0 WHERE id = ?", [nuevoActual, lote.id]);
          } else {
            await query(c.env, "UPDATE item_lotes SET numeracion_actual = ?, stock_actual = ? WHERE id = ?", [nuevoActual, nuevoStock, lote.id]);
          }
          // Sincronizar stock en items con el lote activo
          const stockTotal = await query(c.env, "SELECT COALESCE(SUM(stock_actual),0) as total FROM item_lotes WHERE item_id = ? AND activo = 1", [d.item_id]);
          await query(c.env, "UPDATE items SET stock_actual = ?, numeracion_actual = ? WHERE id = ?", [stockTotal.rows[0].total, nuevoActual, d.item_id]);
        }
      } else if (item?.tiene_stock) {
        await query(c.env, "UPDATE items SET stock_actual = stock_actual - ? WHERE id = ?", [d.cantidad, d.item_id]);
      }
      await query(c.env,
        "INSERT INTO detalle_ventas (venta_id, item_id, cantidad, precio_unitario, subtotal, unidad_id, numeracion_desde, numeracion_hasta) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [venta_id, d.item_id, d.cantidad, d.precio_unitario, d.subtotal, d.unidad_id, num_desde, num_hasta]
      );
      await query(c.env, "INSERT INTO inventario_movimientos (item_id, tipo, cantidad, motivo, usuario_id) VALUES (?, 'venta', ?, ?, ?)", [d.item_id, d.cantidad, `Venta #${venta_id}`, usuario_id]);
    }
    return c.json({ id: venta_id });
  } catch (e: any) {
    console.error("Error en venta:", e.message);
    return c.json({ error: e.message }, 500);
  }
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
