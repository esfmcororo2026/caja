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
  const user = getUser();

  useEffect(() => { requireAuth(); loadStock(); loadItems(); }, []);

  async function loadStock() {
    const r = await api.get("/inventario/stock");
    setStock(r || []);
  }

  async function loadItems() {
    const r = await api.get("/catalogo/items");
    setItems((r || []).filter((i: any) => i.tiene_stock === 1));
  }

  async function loadMovimientos() {
    const r = await api.get(`/inventario/movimientos?desde=${desde}&hasta=${hasta}`);
    setMovimientos(r || []);
  }

  async function registrarMovimiento() {
    await api.post("/inventario/movimientos", { ...form, usuario_id: user?.id });
    setForm({ tipo: "ingreso" }); loadStock(); setMsg("Movimiento registrado ✓");
    setTimeout(() => setMsg(""), 3000);
  }

  const tabStyle = (t: string) => ({ padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", fontWeight: tab === t ? "bold" : "normal", background: tab === t ? "#fff" : "#ddd", color: tab === t ? "#1a1a2e" : "#666" });
  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };

  return (
    <NavLayout titulo="Inventario">
      {msg && <div style={{ background: "#4CAF50", color: "#fff", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>{msg}</div>}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0" }}>
        <button style={tabStyle("stock")} onClick={() => { setTab("stock"); loadStock(); }}>Stock Actual</button>
        <button style={tabStyle("movimientos")} onClick={() => { setTab("movimientos"); loadMovimientos(); }}>Movimientos</button>
        <button style={tabStyle("registrar")} onClick={() => setTab("registrar")}>Registrar Movimiento</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

        {tab === "stock" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>Stock actual de items inventariados</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Item</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Categoría</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Stock</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Unidad</th>
              </tr></thead>
              <tbody>{stock.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem" }}>{s.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{s.categoria}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ background: s.stock_actual <= 5 ? "#ffebee" : "#e8f5e9", color: s.stock_actual <= 5 ? "#c62828" : "#2e7d32", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "bold" }}>
                      {s.stock_actual}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{s.unidad}</td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {tab === "movimientos" && (
          <>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Desde</label>
                <input type="date" style={inputStyle} value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Hasta</label>
                <input type="date" style={inputStyle} value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
              <button onClick={loadMovimientos} style={{ padding: "0.6rem 1.5rem", background: "#2196F3", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Buscar</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Fecha</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Item</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Tipo</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Cantidad</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Motivo</th>
              </tr></thead>
              <tbody>{movimientos.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>{m.fecha}</td>
                  <td style={{ padding: "0.75rem" }}>{m.item}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ background: m.tipo === "ingreso" ? "#e8f5e9" : "#ffebee", color: m.tipo === "ingreso" ? "#2e7d32" : "#c62828", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.8rem" }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>{m.cantidad}</td>
                  <td style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem" }}>{m.motivo}</td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {tab === "registrar" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>Registrar Ingreso / Egreso</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxWidth: "600px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Item</label>
                <select style={inputStyle} value={form.item_id || ""} onChange={e => setForm({ ...form, item_id: Number(e.target.value) })}>
                  <option value="">Seleccionar item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Tipo</label>
                <select style={inputStyle} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Cantidad</label>
                <input type="number" style={inputStyle} value={form.cantidad || ""} onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Motivo</label>
                <input style={inputStyle} value={form.motivo || ""} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="ej: Compra de mercadería" />
              </div>
            </div>
            <button onClick={registrarMovimiento} style={{ marginTop: "1rem", padding: "0.75rem 2rem", background: "#FF9800", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              Registrar
            </button>
          </>
        )}
      </div>
    </NavLayout>
  );
}
