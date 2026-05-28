import { useState, useEffect } from "react";
import { requireAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";
import FiltrosItems from "./FiltrosItems";

const toUpperCase = (str: string) => str ? str.toUpperCase() : "";

export default function Catalogo() {
  const [tab, setTab] = useState<"codigos" | "categorias" | "unidades" | "items">("codigos");
  const [codigos, setCodigos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [itemsFiltrados, setItemsFiltrados] = useState<any[]>([]);

  useEffect(() => { requireAuth(); loadAll(); }, []);
  useEffect(() => { setItemsFiltrados(items); }, [items]);

  async function loadAll() {
    const [co, ca, i, u] = await Promise.all([
      api.get("/codigos"),
      api.get("/catalogo/categorias"),
      api.get("/catalogo/items"),
      api.get("/catalogo/unidades"),
    ]);
    setCodigos(co || []);
    setCategorias(ca || []);
    setItems(i || []);
    setUnidades(u || []);
  }

  function notify(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }
  function resetForm() { setForm({}); setEditId(null); }

  // --- CODIGOS ---
  async function saveCodigo() {
    const data = { ...form, nombre: toUpperCase(form.nombre), descripcion: toUpperCase(form.descripcion) };
    if (editId) await api.put(`/codigos/${editId}`, data);
    else await api.post("/codigos", data);
    resetForm(); loadAll(); notify("GUARDADO ✓");
  }

  async function deleteCodigo(id: number) {
    if (!confirm("¿ELIMINAR ESTE CÓDIGO?")) return;
    await api.delete(`/codigos/${id}`); loadAll(); notify("ELIMINADO ✓");
  }

  // --- CATEGORIAS ---
  async function saveCategoria() {
    const data = { ...form, nombre: toUpperCase(form.nombre), descripcion: toUpperCase(form.descripcion) };
    if (editId) await api.put(`/catalogo/categorias/${editId}`, data);
    else await api.post("/catalogo/categorias", data);
    resetForm(); loadAll(); notify("GUARDADO ✓");
  }

  async function deleteCategoria(id: number) {
    if (!confirm("¿ELIMINAR CATEGORÍA?")) return;
    await api.delete(`/catalogo/categorias/${id}`); loadAll(); notify("ELIMINADO ✓");
  }

  // --- UNIDADES ---
  async function saveUnidad() {
    const data = { ...form, nombre: toUpperCase(form.nombre), abreviatura: toUpperCase(form.abreviatura) };
    if (editId) await api.put(`/catalogo/unidades/${editId}`, data);
    else await api.post("/catalogo/unidades", data);
    resetForm(); loadAll(); notify("GUARDADO ✓");
  }

  async function deleteUnidad(id: number) {
    if (!confirm("¿ELIMINAR UNIDAD?")) return;
    await api.delete(`/catalogo/unidades/${id}`); loadAll(); notify("ELIMINADO ✓");
  }

  // --- ITEMS ---
  const codigoSeleccionado = codigos.find(c => c.id === Number(form.codigo_id));

  async function saveItem() {
  const itemData = { ...form, nombre: toUpperCase(form.nombre), tiene_stock: 1 };
    if (!itemData.codigo_id || itemData.codigo_id === 0) {
      delete itemData.codigo_id;
    }
    if (editId) await api.put(`/catalogo/items/${editId}`, { ...itemData, usuario_id: 1 });
    else await api.post("/catalogo/items", itemData);
    resetForm(); loadAll(); notify("GUARDADO ✓");
  }

  async function deleteItem(id: number) {
    if (!confirm("¿ELIMINAR ITEM?")) return;
    await api.delete(`/catalogo/items/${id}`); loadAll(); notify("ELIMINADO ✓");
  }

  const tabStyle = (t: string) => ({
    padding: "0.6rem 1.2rem", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer",
    fontWeight: tab === t ? "bold" : "normal",
    background: tab === t ? "#fff" : "#ddd",
    color: tab === t ? "#1a1a2e" : "#666",
    fontSize: "0.9rem",
  });
  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem", textTransform: "uppercase" as const };
  const btnStyle = (color: string) => ({ padding: "0.5rem 1rem", background: color, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" });
  const checkStyle = { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" };

  return (
    <NavLayout titulo="CATÁLOGO">
      {msg && <div style={{ background: "#4CAF50", color: "#fff", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{msg}</div>}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0", flexWrap: "wrap" }}>
        <button style={tabStyle("codigos")} onClick={() => { setTab("codigos"); resetForm(); }}>📋 CÓDIGOS</button>
        <button style={tabStyle("categorias")} onClick={() => { setTab("categorias"); resetForm(); }}>🗂 CATEGORÍAS</button>
        <button style={tabStyle("unidades")} onClick={() => { setTab("unidades"); resetForm(); }}>📏 UNIDADES</button>
        <button style={tabStyle("items")} onClick={() => { setTab("items"); resetForm(); }}>📦 ITEMS</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

        {/* ===== CODIGOS ===== */}
        {tab === "codigos" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "EDITAR" : "NUEVO"} CÓDIGO</h3>
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #eee" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>NOMBRE DEL CÓDIGO</label>
                  <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="EJ: VALOR FISCAL 2025" />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>DESCRIPCIÓN</label>
                  <input style={inputStyle} value={form.descripcion || ""} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="DESCRIPCIÓN DEL CÓDIGO" />
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.75rem" }}>CAMPOS QUE TENDRÁN LOS ITEMS DE ESTE CÓDIGO:</p>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <label style={checkStyle}>
                  <input type="checkbox" checked={!!form.tiene_numeracion} onChange={e => setForm({ ...form, tiene_numeracion: e.target.checked })} />
                  <span style={{ fontSize: "0.9rem" }}>🔢 NUMERACIÓN (INICIO / FIN)</span>
                </label>
                <label style={checkStyle}>
                  <input type="checkbox" checked={form.tiene_precio !== false} onChange={e => setForm({ ...form, tiene_precio: e.target.checked })} defaultChecked />
                  <span style={{ fontSize: "0.9rem" }}>💰 PRECIO UNITARIO</span>
                </label>
                <label style={checkStyle}>
                  <input type="checkbox" checked={form.tiene_stock !== false} onChange={e => setForm({ ...form, tiene_stock: e.target.checked })} defaultChecked />
                  <span style={{ fontSize: "0.9rem" }}>📦 CONTROL DE STOCK</span>
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveCodigo}>GUARDAR</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>CANCELAR</button>}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>CÓDIGO</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>DESCRIPCIÓN</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>NUMERACIÓN</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>PRECIO</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>STOCK</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>ACCIONES</th>
              </tr></thead>
              <tbody>{codigos.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{c.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem" }}>{c.descripcion}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>{c.tiene_numeracion ? "✅" : "—"}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>{c.tiene_precio ? "✅" : "—"}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>{c.tiene_stock ? "✅" : "—"}</td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm({ ...c, tiene_numeracion: !!c.tiene_numeracion, tiene_precio: !!c.tiene_precio, tiene_stock: !!c.tiene_stock }); setEditId(c.id); }}>EDITAR</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteCodigo(c.id)}>ELIMINAR</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {/* ===== CATEGORIAS ===== */}
        {tab === "categorias" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "EDITAR" : "NUEVA"} CATEGORÍA</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>NOMBRE</label>
                <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="NOMBRE DE CATEGORÍA" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>DESCRIPCIÓN</label>
                <input style={inputStyle} value={form.descripcion || ""} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="DESCRIPCIÓN" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveCategoria}>GUARDAR</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>CANCELAR</button>}
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>NOMBRE</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>DESCRIPCIÓN</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>ACCIONES</th>
              </tr></thead>
              <tbody>{categorias.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem" }}>{c.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{c.descripcion}</td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm(c); setEditId(c.id); }}>EDITAR</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteCategoria(c.id)}>ELIMINAR</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {/* ===== UNIDADES ===== */}
        {tab === "unidades" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "EDITAR" : "NUEVA"} UNIDAD DE MEDIDA</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>NOMBRE</label>
                <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="EJ: ARROBA" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>ABREVIATURA</label>
                <input style={inputStyle} value={form.abreviatura || ""} onChange={e => setForm({ ...form, abreviatura: e.target.value })} placeholder="EJ: ARR" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveUnidad}>GUARDAR</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>CANCELAR</button>}
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>UNIDAD</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>ABREVIATURA</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>ACCIONES</th>
              </tr></thead>
              <tbody>{unidades.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem" }}>{u.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{u.abreviatura}</td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm(u); setEditId(u.id); }}>EDITAR</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteUnidad(u.id)}>ELIMINAR</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {/* ===== ITEMS ===== */}
        {tab === "items" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "EDITAR" : "NUEVO"} ITEM</h3>
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #eee" }}>

              {/* Selección de código */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>CÓDIGO</label>
                <select style={inputStyle} value={form.codigo_id || ""} onChange={e => setForm({ ...form, codigo_id: Number(e.target.value) })}>
                  <option value="">SELECCIONAR CÓDIGO...</option>
                  {codigos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.tiene_numeracion ? "🔢" : ""} {c.tiene_stock ? "📦" : ""}</option>)}
                </select>
              </div>

              {codigoSeleccionado && (
                <div style={{ background: "#e3f2fd", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem", color: "#1565c0" }}>
                  <b>{codigoSeleccionado.nombre}</b> — {codigoSeleccionado.descripcion}<br />
                  CAMPOS: {codigoSeleccionado.tiene_numeracion ? "🔢 NUMERACIÓN " : ""}{codigoSeleccionado.tiene_precio ? "💰 PRECIO " : ""}{codigoSeleccionado.tiene_stock ? "📦 STOCK" : ""}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>NOMBRE DEL ITEM</label>
                  <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="NOMBRE" />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>CATEGORÍA</label>
                  <select style={inputStyle} value={form.categoria_id || ""} onChange={e => setForm({ ...form, categoria_id: Number(e.target.value) })}>
                    <option value="">SELECCIONAR...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>UNIDAD</label>
                  <select style={inputStyle} value={form.unidad_id || ""} onChange={e => setForm({ ...form, unidad_id: Number(e.target.value) })}>
                    <option value="">SELECCIONAR...</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
                  </select>
                </div>

                {/* Campos según código seleccionado */}
                {(!codigoSeleccionado || codigoSeleccionado.tiene_precio) && (
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>💰 PRECIO UNITARIO (BS.)</label>
                    <input style={inputStyle} type="number" step="0.01" value={form.precio || ""} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} placeholder="0.00" />
                  </div>
                )}

                {codigoSeleccionado?.tiene_numeracion ? (
                  <>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "#666" }}>🔢 NUMERACIÓN INICIO</label>
                      <input style={inputStyle} type="number" value={form.numeracion_inicio || ""} onChange={e => setForm({ ...form, numeracion_inicio: Number(e.target.value) })} placeholder="EJ: 1" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "#666" }}>🔢 NUMERACIÓN FIN</label>
                      <input style={inputStyle} type="number" value={form.numeracion_fin || ""} onChange={e => setForm({ ...form, numeracion_fin: Number(e.target.value) })} placeholder="EJ: 100" />
                    </div>
                    {form.numeracion_inicio && form.numeracion_fin && (
                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ background: "#e8f5e9", borderRadius: "6px", padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#2e7d32" }}>
                          📦 CANTIDAD CALCULADA: <b>{form.numeracion_fin - form.numeracion_inicio + 1}</b> UNIDADES
                        </div>
                      </div>
                    )}
                  </>
                ) : codigoSeleccionado?.tiene_stock ? (
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>📦 STOCK INICIAL</label>
                    <input style={inputStyle} type="number" value={form.stock_actual || 0} onChange={e => setForm({ ...form, stock_actual: Number(e.target.value) })} />
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveItem}>GUARDAR ITEM</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>CANCELAR</button>}
              </div>
              <FiltrosItems items={items} categorias={categorias} codigos={codigos} onFiltrar={setItemsFiltrados} />
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>NOMBRE</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>CÓDIGO</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>CATEGORÍA</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>PRECIO</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>NUMERACIÓN</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>STOCK</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>ACCIONES</th>
              </tr></thead>
              <tbody>{itemsFiltrados.map(i => (
                <tr key={i.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{i.nombre}</td>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "#1565c0" }}>{i.codigo_nombre || "—"}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{i.categoria_nombre}</td>
                  <td style={{ padding: "0.75rem" }}>BS. {Number(i.precio).toFixed(2)}</td>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>
                    {i.numeracion_inicio ? `${i.numeracion_inicio} - ${i.numeracion_fin} (ACTUAL: ${i.numeracion_actual})` : "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ background: i.tiene_stock ? (i.stock_actual <= 5 ? "#ffebee" : "#e8f5e9") : "#f5f5f5", color: i.tiene_stock ? (i.stock_actual <= 5 ? "#c62828" : "#2e7d32") : "#999", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "bold", fontSize: "0.85rem" }}>
                      {i.tiene_stock ? (i.numeracion_fin ? `${i.numeracion_fin - i.numeracion_inicio + 1}` : i.stock_actual) : "∞"}                      
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm({ ...i, tiene_stock: i.tiene_stock === 1 }); setEditId(i.id); }}>EDITAR</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteItem(i.id)}>ELIMINAR</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}
      </div>
    </NavLayout>
  );
}
