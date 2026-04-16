import { Hono } from "hono";
import { Env, getDB } from "../db/client";
import { SCHEMA } from "../db/schema";

const route = new Hono<{ Bindings: Env }>();

// Inicializar BD con el schema
route.post("/init", async (c) => {
  const db = getDB(c.env);
  const statements = SCHEMA.split(";").filter((s) => s.trim());
  for (const sql of statements) {
    await db.execute(sql);
  }
  // Insertar usuario admin por defecto si no existe
  await db.execute(`
    INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, rol)
    VALUES ('Administrador', 'admin@caja.com', 'admin123', 'admin')
  `);
  // Insertar unidades por defecto
  await db.execute(`
    INSERT OR IGNORE INTO unidades (id, nombre, abreviatura) VALUES
    (1, 'Unidad', 'u'),
    (2, 'Pieza', 'pza'),
    (3, 'Cuartilla', 'crt'),
    (4, 'Arroba', 'arr')
  `);
  return c.json({ ok: true, mensaje: "Base de datos inicializada" });
});

// Login
route.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const db = getDB(c.env);
  const result = await db.execute({
    sql: "SELECT * FROM usuarios WHERE email = ? AND password_hash = ? AND activo = 1",
    args: [email, password],
  });
  if (!result.rows.length) {
    return c.json({ error: "Credenciales inválidas" }, 401);
  }
  const user = result.rows[0];
  const payload = {
    id: user.id,
    nombre: user.nombre,
    rol: user.rol,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 horas
  };
  const token = btoa(JSON.stringify({ alg: "none" })) + "." + btoa(JSON.stringify(payload)) + ".";
  return c.json({ token, usuario: { id: user.id, nombre: user.nombre, rol: user.rol } });
});

export default route;
