import { useState, useEffect } from "react";
import { requireAuth, getUser } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";

export default function Inventario() {
  const [stock, setStock] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [itemsConNumeracion, setItemsConNumeracion] = useState<any[]>([]);
  const [tab, setTab] = useState<"stock" | "movimientos" | "nuevo_lote">("stock");
  const [formLote, setFormLote] = useState<any>({});
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const [msg, setMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const user = getUser();

  useEffect(() => { requireAuth(); loadStock(); loadItems(); }, []);

  async function loadStock() {
    const r = await api.get("/inventario/stock");
    setStock(r || []);
  }

  async function loadItems() {
    const r = await api.get("/catalogo/items");
    setItemsConNumeracion((r || []).filter((i: any) => i.numeracion_inicio > 0));
  }

  async function loadMovimientos() {
    const r = await api.get(`/inventario/movimientos?desde=${desde}&hasta=${hasta}`);
    setMovimientos(r || []);
  }

  async function agregarLote() {
    if (!formLote.item_id) return alert("Selecciona un item");
    if (!formLote.numeracion_inicio || !formLote.numeracion_fin) return alert("Ingresa la numeración");
    if (Number(formLote.numeracion_fin) <= Number(formLote.numeracion_inicio)) return alert("Numeración fin debe ser mayor que inicio");
    await api.post("/inventario/lotes", { ...formLote, usuario_id: user?.id });
    setFormLote({});
    loadStock();
    loadItems();
    setMsg("NUEVO LOTE REGISTRADO ✓");
    setTimeout(() => setMsg(""), 3000);
  }

  // Agrupar lotes por item
  const stockAgrupado = stock.reduce((acc: any, lote: any) => {
    const key = lote.item_id;
    if (!acc[key]) acc[key] = { nombre: lote.nombre, categoria: lote.categoria, codigo: lote.codigo, unidad: lote.unidad, lotes: [] };
    acc[key].lotes.push(lote);
    return acc;
  }, {});

  const stockFiltrado = Object.values(stockAgrupado).filter((item: any) =>
    !busqueda || item.nombre.toUpperCase().includes(busqueda.toUpperCase())
  );

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
        <button style={tabStyle("nuevo_lote")} onClick={() => setTab("nuevo_lote")}>➕ NUEVO LOTE</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

        {/* ===== STOCK ACTUAL ===== */}
        {tab === "stock" && (
          <>
            <div style={{ background: "#f0f0f0", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>🔍 BUSCAR POR NOMBRE</label>
                <input style={inputStyle} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="BUSCAR..." />
              </div>
              <button onClick={() => setBusqueda("")}
                style={{ padding: "0.6rem 1rem", background: "#999", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                LIMPIAR
              </button>
            </div>

            {stockFiltrado.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "2rem" }}>No hay items con stock controlado</p>
            ) : (
              stockFiltrado.map((item: any) => {
                const stockTotal = item.lotes.reduce((s: number, l: any) => s + Number(l.stock_actual), 0);
                const bajo = stockTotal <= 5;
                return (
                  <div key={item.nombre} style={{ marginBottom: "1.5rem", border: "1px solid #eee", borderRadius: "8px", overflow: "hidden" }}>
                    {/* Cabecera del item */}
                    <div style={{ background: "#f5f5f5", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: "bold", fontSize: "1rem" }}>{item.nombre}</span>
                        <span style={{ marginLeft: "1rem", fontSize: "0.8rem", color: "#1565c0" }}>{item.codigo || "—"}</span>
                        <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem", color: "#666" }}>| {item.categoria}</span>
                      </div>
                      <span style={{ background: bajo ? "#ffebee" : "#e8f5e9", color: bajo ? "#c62828" : "#2e7d32", padding: "0.3rem 0.8rem", borderRadius: "12px", fontWeight: "bold", fontSize: "0.95rem" }}>
                        TOTAL: {stockTotal} {item.unidad}
                      </span>
                    </div>
                    {/* Lotes del item */}
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: "#fafafa" }}>
                        <th style={{ padding: "0.5rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#888" }}>LOTE / GESTIÓN</th>
                        <th style={{ padding: "0.5rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#888" }}>NUMERACIÓN TOTAL</th>
                        <th style={{ padding: "0.5rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#888" }}>ACTUAL DESDE</th>
                        <th style={{ padding: "0.5rem 1rem", textAlign: "center", fontSize: "0.78rem", color: "#888" }}>STOCK</th>
                        <th style={{ padding: "0.5rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#888" }}>REGISTRADO</th>
                      </tr></thead>
                      <tbody>{item.lotes.map((lote: any, idx: number) => {
                        const loteStock = Number(lote.stock_actual);
                        const loteBajo = loteStock <= 5;
                        return (
                          <tr key={lote.lote_id} style={{ borderTop: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", color: "#666" }}>
                              Lote #{idx + 1}
                            </td>
                            <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem" }}>
                              {lote.numeracion_inicio} — {lote.numeracion_fin}
                            </td>
                            <td style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", color: "#1565c0", fontWeight: "bold" }}>
                              {lote.numeracion_actual}
                            </td>
                            <td style={{ padding: "0.6rem 1rem", textAlign: "center" }}>
                              <span style={{ background: loteBajo ? "#ffebee" : "#e8f5e9", color: loteBajo ? "#c62828" : "#2e7d32", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "bold", fontSize: "0.85rem" }}>
                                {loteStock}
                              </span>
                            </td>
                            <td style={{ padding: "0.6rem 1rem", fontSize: "0.78rem", color: "#aaa" }}>
                              {lote.created_at?.split("T")[0]}
                            </td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  </div>
                );
              })
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

        {/* ===== NUEVO LOTE ===== */}
        {tab === "nuevo_lote" && (
          <>
            <h3 style={{ marginBottom: "0.5rem", color: "#333" }}>AGREGAR NUEVO LOTE</h3>
            <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1.5rem" }}>
              Usa esto cuando lleguen nuevos talonarios o documentos para un item ya existente. Se crea un nuevo lote con su propia numeración y el sistema lo usará automáticamente en ventas cuando el lote anterior se agote.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxWidth: "600px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>ITEM</label>
                <select style={inputStyle} value={formLote.item_id || ""} onChange={e => setFormLote({ ...formLote, item_id: Number(e.target.value) })}>
                  <option value="">Seleccionar item...</option>
                  {itemsConNumeracion.map(i => <option key={i.id} value={i.id}>{i.nombre} — {i.codigo_nombre || "sin código"}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>🔢 NUMERACIÓN INICIO</label>
                <input type="number" style={inputStyle} value={formLote.numeracion_inicio || ""} onChange={e => setFormLote({ ...formLote, numeracion_inicio: Number(e.target.value) })} placeholder="ej: 001" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>🔢 NUMERACIÓN FIN</label>
                <input type="number" style={inputStyle} value={formLote.numeracion_fin || ""} onChange={e => setFormLote({ ...formLote, numeracion_fin: Number(e.target.value) })} placeholder="ej: 500" />
              </div>
              {formLote.numeracion_inicio && formLote.numeracion_fin && Number(formLote.numeracion_fin) > Number(formLote.numeracion_inicio) && (
                <div style={{ gridColumn: "span 2" }}>
                  <div style={{ background: "#e8f5e9", borderRadius: "6px", padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#2e7d32" }}>
                    📦 CANTIDAD: <b>{Number(formLote.numeracion_fin) - Number(formLote.numeracion_inicio) + 1}</b> documentos
                  </div>
                </div>
              )}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>MOTIVO / OBSERVACIÓN</label>
                <input style={inputStyle} value={formLote.motivo || ""} onChange={e => setFormLote({ ...formLote, motivo: e.target.value })} placeholder="ej: Compra de talonarios gestión 2025" />
              </div>
            </div>
            <button onClick={agregarLote} style={{ marginTop: "1rem", padding: "0.75rem 2rem", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              ✅ REGISTRAR NUEVO LOTE
            </button>
          </>
        )}
      </div>
    </NavLayout>
  );
}
