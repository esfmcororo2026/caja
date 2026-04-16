import { Hono } from "hono";
import { Env } from "./db/client";
import { corsMiddleware } from "./middleware/cors";
import authRoute from "./routes/auth";
import catalogoRoute from "./routes/catalogo";
import ventasRoute from "./routes/ventas";
import inventarioRoute from "./routes/inventario";
import reportesRoute from "./routes/reportes";
import syncRoute from "./routes/sync";

const app = new Hono<{ Bindings: Env }>();

app.use("*", corsMiddleware);

app.route("/api/auth", authRoute);
app.route("/api/catalogo", catalogoRoute);
app.route("/api/ventas", ventasRoute);
app.route("/api/inventario", inventarioRoute);
app.route("/api/reportes", reportesRoute);
app.route("/api/sync", syncRoute);

app.get("/", (c) => c.json({ status: "ok", version: "1.0.0" }));

export default app;
