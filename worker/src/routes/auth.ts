import { Hono } from "hono";
import { Env, query } from "../db/client";
import { SCHEMA } from "../db/schema";

const route = new Hono<{ Bindings: Env }>();

route.post("/init", async (c) => {
  try {
    const statements = SCHEMA.split(";").filter((s) => s.trim());
    for (const sql of statements) {
      await query(c.env, sql);
    }
    await query(c.env, `INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol) VALUES ('Administrador', 'admin@caja.com', 'admin123', 'admin')`);
    await query(c.env, `INSERT OR IGNORE INTO unidades (id, nombre, abreviatura) VALUES (1, 'Unidad', 'u')`);
    await query(c.env, `INSERT OR IGNORE INTO unidades (id, nombre, abreviatura) VALUES (2, 'Pieza', 'pza')`);
    await query(c.env, `INSERT OR IGNORE INTO unidades (id, nombre, abreviatura) VALUES (3, 'Cuartilla', 'crt')`);
    await query(c.env, `INSERT OR IGNORE INTO unidades (id, nombre, abreviatura) VALUES (4, 'Arroba', 'arr')`);
    return c.json({ ok: true, mensaje: "Base de datos inicializada" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

route.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const result = await query(c.env, "SELECT * FROM usuarios WHERE email = ? AND password_hash = ? AND activo = 1", [email, password]);
    if (!result.rows.length) return c.json({ error: "Credenciales inválidas" }, 401);
    const user = result.rows[0];
    const payload = { id: user.id, nombre: user.nombre, rol: user.rol, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 };
    const token = btoa(JSON.stringify({ alg: "none" })) + "." + btoa(JSON.stringify(payload)) + ".";
    return c.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default route;
