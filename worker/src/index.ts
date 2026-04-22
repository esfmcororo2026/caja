import { Hono } from "hono";
import { Env, query } from "./db/client";
import { corsMiddleware } from "./middleware/cors";
import authRoute from "./routes/auth";
import catalogoRoute from "./routes/catalogo";
import codigosRoute from "./routes/codigos";
import ventasRoute from "./routes/ventas";
import inventarioRoute from "./routes/inventario";
import reportesRoute from "./routes/reportes";
import syncRoute from "./routes/sync";
import clientesRoute from "./routes/clientes";

const app = new Hono<{ Bindings: Env }>();

app.use("*", corsMiddleware);

app.route("/api/auth", authRoute);
app.route("/api/codigos", codigosRoute);
app.route("/api/catalogo", catalogoRoute);
app.route("/api/ventas", ventasRoute);
app.route("/api/inventario", inventarioRoute);
app.route("/api/reportes", reportesRoute);
app.route("/api/sync", syncRoute);
app.route("/api/clientes", clientesRoute);

app.get("/", (c) => c.json({ status: "ok", version: "1.0.0" }));

// Endpoint de migración para agregar columnas faltantes
app.get("/api/migrate", async (c) => {
  try {
    const results = [];

    // Migración 1: Agregar codigo_id
    try {
      await query(c.env, "ALTER TABLE items ADD COLUMN codigo_id INTEGER");
      results.push("✓ Columna codigo_id agregada");
    } catch (e: any) {
      if (e.message.includes("duplicate column")) {
        results.push("✓ Columna codigo_id ya existe");
      } else {
        throw e;
      }
    }

    // Migración 2: Agregar imagen_url
    try {
      await query(c.env, "ALTER TABLE items ADD COLUMN imagen_url TEXT");
      results.push("✓ Columna imagen_url agregada");
    } catch (e: any) {
      if (e.message.includes("duplicate column")) {
        results.push("✓ Columna imagen_url ya existe");
      } else {
        throw e;
      }
    }

    return c.json({ success: true, migrations: results });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;
