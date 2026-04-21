import { Hono } from "hono";
import { Env, query } from "../db/client";
import { authMiddleware } from "../middleware/auth";

const route = new Hono<{ Bindings: Env }>();
route.use("*", authMiddleware);

route.get("/categorias", async (c) => {
  const r = await query(c.env, "SELECT * FROM categorias WHERE activo = 1");
  return c.json(r.rows);
});

route.post("/categorias", async (c) => {
  try {
    const { nombre, descripcion } = await c.req.json();
    const r = await query(c.env, "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
    return c.json({ id: r.lastInsertRowid });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

route.put("/categorias/:id", async (c) => {
  const { nombre, descripcion } = await c.req.json();
  await query(c.env, "UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?", [nombre, descripcion, c.req.param("id")]);
  return c.json({ ok: true });
});

route.delete("/categorias/:id", async (c) => {
  await query(c.env, "UPDATE categorias SET activo = 0 WHERE id = ?", [c.req.param("id")]);
  return c.json({ ok: true });
});

route.get("/items", async (c) => {
  const r = await query(c.env, "SELECT * FROM items WHERE activo = 1");
  return c.json(r.rows);
});

route.post("/items", async (c) => {
  try {
    const body = await c.req.json();
    const { nombre, codigo_id, categoria_id, precio, unidad_id, tiene_stock, stock_actual, numeracion_inicio, numeracion_fin } = body;
    
    if (!nombre || !categoria_id || !unidad_id) {
      return c.json({ error: "Faltan campos requeridos: nombre, categoria_id, unidad_id" }, 400);
    }
    
    let stockCalc = stock_actual || 0;
    let numActual = null;
    if (numeracion_inicio && numeracion_fin) {
      stockCalc = numeracion_fin - numeracion_inicio + 1;
      numActual = numeracion_inicio;
    }
    
    const finalCodigoId = codigo_id && codigo_id > 0 ? codigo_id : null;
    const finalPrecio = precio || 0;
    
    const sql = "INSERT INTO items (nombre, codigo_id, categoria_id, precio, unidad_id, tiene_stock, stock_actual, numeracion_inicio, numeracion_fin, numeracion_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [nombre, finalCodigoId, categoria_id, finalPrecio, unidad_id, tiene_stock ? 1 : 0, stockCalc, numeracion_inicio || null, numeracion_fin || null, numActual];
    
    const r = await query(c.env, sql, params);
    return c.json({ id: r.lastInsertRowid });
  } catch (e: any) {
    console.error("Error creating item:", e.message);
    return c.json({ error: e.message, details: e.toString() }, 500);
  }
});

route.put("/items/:id", async (c) => {
  try {
    const { nombre, precio, unidad_id, tiene_stock, stock_actual, numeracion_inicio, numeracion_fin, usuario_id } = await c.req.json();
    const current = await query(c.env, "SELECT precio FROM items WHERE id = ?", [c.req.param("id")]);
    if (current.rows.length && current.rows[0].precio !== precio) {
      await query(c.env, "INSERT INTO precios_historial (item_id, precio_anterior, precio_nuevo, usuario_id) VALUES (?, ?, ?, ?)", [c.req.param("id"), current.rows[0].precio, precio, usuario_id]);
    }
    let stockCalc = stock_actual;
    if (numeracion_inicio && numeracion_fin) stockCalc = numeracion_fin - numeracion_inicio + 1;
    await query(c.env,
      "UPDATE items SET nombre = ?, precio = ?, unidad_id = ?, tiene_stock = ?, stock_actual = ?, numeracion_inicio = ?, numeracion_fin = ? WHERE id = ?",
      [nombre, precio, unidad_id, tiene_stock ? 1 : 0, stockCalc, numeracion_inicio || null, numeracion_fin || null, c.req.param("id")]
    );
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

route.delete("/items/:id", async (c) => {
  try {
    await query(c.env, "UPDATE items SET activo = 0 WHERE id = ?", [c.req.param("id")]);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

route.get("/unidades", async (c) => {
  const r = await query(c.env, "SELECT * FROM unidades");
  return c.json(r.rows);
});

route.post("/unidades", async (c) => {
  try {
    const { nombre, abreviatura } = await c.req.json();
    const r = await query(c.env, "INSERT INTO unidades (nombre, abreviatura) VALUES (?, ?)", [nombre, abreviatura]);
    return c.json({ id: r.lastInsertRowid });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

route.put("/unidades/:id", async (c) => {
  try {
    const { nombre, abreviatura } = await c.req.json();
    await query(c.env, "UPDATE unidades SET nombre = ?, abreviatura = ? WHERE id = ?", [nombre, abreviatura, c.req.param("id")]);
    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default route;
