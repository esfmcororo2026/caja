import { useState, useEffect } from "react";
import { requireAuth, getUser } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";

export default function Inventario() {
  const [stock, setStock] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<"stock" | "movimientos" | "registrar">("stock");
  const [form, setForm] = useState<any>({ tipo: "ingreso" });
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const [msg, setMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const user = getUser();

  useEffect(() => { requireAuth(); loadStock(); loadItems(); }, []);

  async function loadStock() {
    const r = await api.get("/inventario/stock");
    setStock(r || []);
  }

  async function loadItems() {
    const r = await api.get("/catalogo/items");
    setItems((r || []).filter((i: any) => i.numeracion_inicio > 0));
  }

  async function loadMovimientos() {
    const r = await api.get(`/inventario/movimientos?desde=${desde}&hasta=${hasta}`);
    setMovimientos(r || []);
  }

  async function registrarMovimiento() {
    if (!form.item_id) return alert("Selecciona un item");
    if (!form.cantidad) return alert("Ingresa una cantidad");
    await api.post("/inventario/movimientos", { ...form, usuario_id: user?.id });
    setForm({ tipo: "ingreso" });
    loadStock();
    setMsg("MOVIMIENTO REGISTRADO ✓");
    setTimeout(() => setMsg(""), 3000);
  }

  // Filtrar stock
  const stockFiltrado = stock.filter(s => {
    const matchNombre = !busqueda || s.nombre.toUpperCase().includes(busqueda.toUpperCase());
    const matchCat = !filtroCategoria || s.categoria === filtroCategoria;
    return matchNombre && matchCat;
  });

  // Agrupar por categoría
  const categorias = [...new Set(stock.map(s => s.categoria))];
  const stockPorCategoria = categorias.reduce((acc: any, cat) => {
    acc[cat] = stockFiltrado.filter(s => s.categoria === cat);
    return acc;
  }, {});

  const tabStyle = (t: string) => ({
    padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer",
    fontWeight: tab === t ? "bold" : "normal",
    background: tab === t ? "#fff" : "#ddd",
    color: tab === t ? "#1a1a2e" : "#666",
  });
  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };

  return (
    <NavLayout titulo="INVENTARIO">
      {msg && <div style={{ background: "#4CAF50", color: "#fff", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>{msg}</div>}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0" }}>
        <button style={tabStyle("stock")} onClick={() => { setTab("stock"); loadStock(); }}>📦 STOCK ACTUAL</button>
        <button style={tabStyle("movimientos")} onClick={() => { setTab("movimientos"); loadMovimientos(); }}>📋 MOVIMIENTOS</button>
        <button style={tabStyle("registrar")} onClick={() => setTab("registrar")}>➕ REGISTRAR MOVIMIENTO</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

        {/* ===== STOCK ACTUAL ===== */}
        {tab === "stock" && (
          <>
            {/* Filtros */}
            <div style={{ background: "#f0f0f0", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>🔍 BUSCAR POR NOMBRE</label>
                <input style={inputStyle} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="BUSCAR..." />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>🗂 FILTRAR CATEGORÍA</label>
                <select style={inputStyle} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
                  <option value="">TODAS</option>
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button onClick={() => { setBusqueda(""); setFiltroCategoria(""); }}
                  style={{ padding: "0.6rem 1rem", background: "#999", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                  LIMPIAR
                </button>
              </div>
            </div>

            {/* Tabla agrupada por categoría */}
            {stockFiltrado.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "2rem" }}>No hay items con stock controlado</p>
            ) : (
              Object.entries(stockPorCategoria).filter(([, items]: any) => items.length > 0).map(([cat, items]: any) => (
                <div key={cat} style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#1a1a2e", background: "#f5f5f5", padding: "0.5rem 0.75rem", borderRadius: "6px", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    🗂 {cat}
                  </h4>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: "#fafafa" }}>
                      <th style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontSize: "0.8rem", color: "#666" }}>ITEM</th>
                      <th style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontSize: "0.8rem", color: "#666" }}>CÓDIGO</th>
                      <th style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontSize: "0.8rem", color: "#666" }}>NUMERACIÓN</th>
                      <th style={{ padding: "0.6rem 0.75rem", textAlign: "center", fontSize: "0.8rem", color: "#666" }}>STOCK</th>
                      <th style={{ padding: "0.6rem 0.75rem", textAlign: "left", fontSize: "0.8rem", color: "#666" }}>UNIDAD</th>
                    </tr></thead>
                    <tbody>{items.map((s: any) => {
                      const stockReal = s.numeracion_fin - s.numeracion_actual + 1;
                      const bajo = stockReal <= 5;
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "0.75rem" }}>{s.nombre}</td>
                          <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "#1565c0" }}>{s.codigo || "—"}</td>
                          <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "#666" }}>
                            {s.numeracion_actual} — {s.numeracion_fin}
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <span style={{ background: bajo ? "#ffebee" : "#e8f5e9", color: bajo ? "#c62828" : "#2e7d32", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "bold", fontSize: "0.9rem" }}>
                              {stockReal}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem" }}>{s.unidad}</td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              ))
            )}
          </>
        )}

        {/* ===== MOVIMIENTOS ===== */}
        {tab === "movimientos" && (
          <>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>DESDE</label>
                <input type="date" style={inputStyle} value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>HASTA</label>
                <input type="date" style={inputStyle} value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
              <button onClick={loadMovimientos} style={{ padding: "0.6rem 1.5rem", background: "#2196F3", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>BUSCAR</button>
            </div>
            {movimientos.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "2rem" }}>No hay movimientos en este período</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: "#f5f5f5" }}>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>FECHA</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>ITEM</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>TIPO</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>CANTIDAD</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>MOTIVO</th>
                  <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>USUARIO</th>
                </tr></thead>
                <tbody>{movimientos.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "#666" }}>{m.fecha?.split("T")[0]}</td>
                    <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{m.item}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ background: m.tipo === "ingreso" ? "#e8f5e9" : m.tipo === "venta" ? "#fff3e0" : "#ffebee", color: m.tipo === "ingreso" ? "#2e7d32" : m.tipo === "venta" ? "#e65100" : "#c62828", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" }}>
                        {m.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{m.cantidad}</td>
                    <td style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem" }}>{m.motivo}</td>
                    <td style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem" }}>{m.usuario}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </>
        )}

        {/* ===== REGISTRAR MOVIMIENTO ===== */}
        {tab === "registrar" && (
          <>
            <h3 style={{ marginBottom: "0.5rem", color: "#333" }}>REGISTRAR INGRESO / AJUSTE</h3>
            <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1.5rem" }}>
              Usa esto para registrar nuevos documentos recibidos o corregir el stock de valores fiscales.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxWidth: "600px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>ITEM</label>
                <select style={inputStyle} value={form.item_id || ""} onChange={e => setForm({ ...form, item_id: Number(e.target.value) })}>
                  <option value="">Seleccionar item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>TIPO</label>
                <select style={inputStyle} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="ingreso">📥 INGRESO (recibí más documentos)</option>
                  <option value="ajuste">🔧 AJUSTE (corrección de stock)</option>
                  <option value="egreso">📤 EGRESO (pérdida / baja)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>CANTIDAD</label>
                <input type="number" style={inputStyle} value={form.cantidad || ""} onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>MOTIVO</label>
                <input style={inputStyle} value={form.motivo || ""} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="ej: Compra de talonarios" />
              </div>
            </div>
            <button onClick={registrarMovimiento} style={{ marginTop: "1rem", padding: "0.75rem 2rem", background: "#FF9800", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              REGISTRAR
            </button>
          </>
        )}
      </div>
    </NavLayout>
  );
}
