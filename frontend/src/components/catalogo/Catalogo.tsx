import { useState, useEffect } from "react";
import { requireAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";

export default function Catalogo() {
  const [tab, setTab] = useState<"codigos" | "categorias" | "unidades" | "items">("codigos");
  const [codigos, setCodigos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { requireAuth(); loadAll(); }, []);

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
    if (editId) await api.put(`/codigos/${editId}`, form);
    else await api.post("/codigos", form);
    resetForm(); loadAll(); notify("Guardado ✓");
  }

  async function deleteCodigo(id: number) {
    if (!confirm("¿Archivar este código?")) return;
    await api.delete(`/codigos/${id}`); loadAll(); notify("Archivado ✓");
  }

  // --- CATEGORIAS ---
  async function saveCategoria() {
    if (editId) await api.put(`/catalogo/categorias/${editId}`, form);
    else await api.post("/catalogo/categorias", form);
    resetForm(); loadAll(); notify("Guardado ✓");
  }

  async function deleteCategoria(id: number) {
    if (!confirm("¿Eliminar categoría?")) return;
    await api.delete(`/catalogo/categorias/${id}`); loadAll(); notify("Eliminado ✓");
  }

  // --- UNIDADES ---
  async function saveUnidad() {
    await api.post("/catalogo/unidades", form);
    resetForm(); loadAll(); notify("Guardado ✓");
  }

  // --- ITEMS ---
  const codigoSeleccionado = codigos.find(c => c.id === Number(form.codigo_id));

  async function saveItem() {
    if (editId) await api.put(`/catalogo/items/${editId}`, { ...form, usuario_id: 1 });
    else await api.post("/catalogo/items", form);
    resetForm(); loadAll(); notify("Guardado ✓");
  }

  async function deleteItem(id: number) {
    if (!confirm("¿Eliminar item?")) return;
    await api.delete(`/catalogo/items/${id}`); loadAll(); notify("Eliminado ✓");
  }

  const tabStyle = (t: string) => ({
    padding: "0.6rem 1.2rem", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer",
    fontWeight: tab === t ? "bold" : "normal",
    background: tab === t ? "#fff" : "#ddd",
    color: tab === t ? "#1a1a2e" : "#666",
    fontSize: "0.9rem",
  });
  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const btnStyle = (color: string) => ({ padding: "0.5rem 1rem", background: color, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" });
  const checkStyle = { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" };

  return (
    <NavLayout titulo="Catálogo">
      {msg && <div style={{ background: "#4CAF50", color: "#fff", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{msg}</div>}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0", flexWrap: "wrap" }}>
        <button style={tabStyle("codigos")} onClick={() => { setTab("codigos"); resetForm(); }}>📋 Códigos</button>
        <button style={tabStyle("categorias")} onClick={() => { setTab("categorias"); resetForm(); }}>🗂 Categorías</button>
        <button style={tabStyle("unidades")} onClick={() => { setTab("unidades"); resetForm(); }}>📏 Unidades</button>
        <button style={tabStyle("items")} onClick={() => { setTab("items"); resetForm(); }}>📦 Items</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

        {/* ===== CODIGOS ===== */}
        {tab === "codigos" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "Editar" : "Nuevo"} Código</h3>
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #eee" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Nombre del código</label>
                  <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="ej: Valor Fiscal 2025" />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Descripción</label>
                  <input style={inputStyle} value={form.descripcion || ""} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del código" />
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.75rem" }}>Campos que tendrán los items de este código:</p>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <label style={checkStyle}>
                  <input type="checkbox" checked={!!form.tiene_numeracion} onChange={e => setForm({ ...form, tiene_numeracion: e.target.checked })} />
                  <span style={{ fontSize: "0.9rem" }}>🔢 Numeración (inicio / fin)</span>
                </label>
                <label style={checkStyle}>
                  <input type="checkbox" checked={form.tiene_precio !== false} onChange={e => setForm({ ...form, tiene_precio: e.target.checked })} defaultChecked />
                  <span style={{ fontSize: "0.9rem" }}>💰 Precio unitario</span>
                </label>
                <label style={checkStyle}>
                  <input type="checkbox" checked={form.tiene_stock !== false} onChange={e => setForm({ ...form, tiene_stock: e.target.checked })} defaultChecked />
                  <span style={{ fontSize: "0.9rem" }}>📦 Control de stock</span>
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveCodigo}>Guardar</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>Cancelar</button>}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Descripción</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>Numeración</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>Precio</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>Stock</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>Acciones</th>
              </tr></thead>
              <tbody>{codigos.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{c.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666", fontSize: "0.85rem" }}>{c.descripcion}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>{c.tiene_numeracion ? "✅" : "—"}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>{c.tiene_precio ? "✅" : "—"}</td>
                  <td style={{ padding: "0.75rem", textAlign: "center" }}>{c.tiene_stock ? "✅" : "—"}</td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm({ ...c, tiene_numeracion: !!c.tiene_numeracion, tiene_precio: !!c.tiene_precio, tiene_stock: !!c.tiene_stock }); setEditId(c.id); }}>Editar</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteCodigo(c.id)}>Archivar</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {/* ===== CATEGORIAS ===== */}
        {tab === "categorias" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "Editar" : "Nueva"} Categoría</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Nombre</label>
                <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de categoría" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Descripción</label>
                <input style={inputStyle} value={form.descripcion || ""} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveCategoria}>Guardar</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>Cancelar</button>}
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Descripción</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>Acciones</th>
              </tr></thead>
              <tbody>{categorias.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem" }}>{c.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{c.descripcion}</td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm(c); setEditId(c.id); }}>Editar</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteCategoria(c.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {/* ===== UNIDADES ===== */}
        {tab === "unidades" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>Nueva Unidad de Medida</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Nombre</label>
                <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="ej: Arroba" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Abreviatura</label>
                <input style={inputStyle} value={form.abreviatura || ""} onChange={e => setForm({ ...form, abreviatura: e.target.value })} placeholder="ej: arr" />
              </div>
              <button style={btnStyle("#4CAF50")} onClick={saveUnidad}>Guardar</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Abreviatura</th>
              </tr></thead>
              <tbody>{unidades.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem" }}>{u.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{u.abreviatura}</td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

        {/* ===== ITEMS ===== */}
        {tab === "items" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "Editar" : "Nuevo"} Item</h3>
            <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid #eee" }}>

              {/* Selección de código */}
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Código</label>
                <select style={inputStyle} value={form.codigo_id || ""} onChange={e => setForm({ ...form, codigo_id: Number(e.target.value) })}>
                  <option value="">Seleccionar código...</option>
                  {codigos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.tiene_numeracion ? "🔢" : ""} {c.tiene_stock ? "📦" : ""}</option>)}
                </select>
              </div>

              {codigoSeleccionado && (
                <div style={{ background: "#e3f2fd", borderRadius: "6px", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.85rem", color: "#1565c0" }}>
                  <b>{codigoSeleccionado.nombre}</b> — {codigoSeleccionado.descripcion}<br />
                  Campos: {codigoSeleccionado.tiene_numeracion ? "🔢 Numeración " : ""}{codigoSeleccionado.tiene_precio ? "💰 Precio " : ""}{codigoSeleccionado.tiene_stock ? "📦 Stock" : ""}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Nombre del item</label>
                  <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Categoría</label>
                  <select style={inputStyle} value={form.categoria_id || ""} onChange={e => setForm({ ...form, categoria_id: Number(e.target.value) })}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Unidad</label>
                  <select style={inputStyle} value={form.unidad_id || ""} onChange={e => setForm({ ...form, unidad_id: Number(e.target.value) })}>
                    <option value="">Seleccionar...</option>
                    {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.abreviatura})</option>)}
                  </select>
                </div>

                {/* Campos según código seleccionado */}
                {(!codigoSeleccionado || codigoSeleccionado.tiene_precio) && (
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>💰 Precio unitario (Bs.)</label>
                    <input style={inputStyle} type="number" step="0.01" value={form.precio || ""} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} placeholder="0.00" />
                  </div>
                )}

                {codigoSeleccionado?.tiene_numeracion ? (
                  <>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "#666" }}>🔢 Numeración inicio</label>
                      <input style={inputStyle} type="number" value={form.numeracion_inicio || ""} onChange={e => setForm({ ...form, numeracion_inicio: Number(e.target.value) })} placeholder="ej: 1" />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", color: "#666" }}>🔢 Numeración fin</label>
                      <input style={inputStyle} type="number" value={form.numeracion_fin || ""} onChange={e => setForm({ ...form, numeracion_fin: Number(e.target.value) })} placeholder="ej: 100" />
                    </div>
                    {form.numeracion_inicio && form.numeracion_fin && (
                      <div style={{ gridColumn: "span 3" }}>
                        <div style={{ background: "#e8f5e9", borderRadius: "6px", padding: "0.6rem 1rem", fontSize: "0.9rem", color: "#2e7d32" }}>
                          📦 Cantidad calculada: <b>{form.numeracion_fin - form.numeracion_inicio + 1}</b> unidades
                        </div>
                      </div>
                    )}
                  </>
                ) : codigoSeleccionado?.tiene_stock ? (
                  <div>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>📦 Stock inicial</label>
                    <input style={inputStyle} type="number" value={form.stock_actual || 0} onChange={e => setForm({ ...form, stock_actual: Number(e.target.value) })} />
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button style={btnStyle("#4CAF50")} onClick={saveItem}>Guardar item</button>
                {editId && <button style={btnStyle("#999")} onClick={resetForm}>Cancelar</button>}
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Código</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Categoría</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Precio</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Numeración</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Stock</th>
                <th style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.85rem" }}>Acciones</th>
              </tr></thead>
              <tbody>{items.map(i => (
                <tr key={i.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold" }}>{i.nombre}</td>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem", color: "#1565c0" }}>{i.codigo_nombre || "—"}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{i.categoria}</td>
                  <td style={{ padding: "0.75rem" }}>Bs. {Number(i.precio).toFixed(2)}</td>
                  <td style={{ padding: "0.75rem", fontSize: "0.85rem" }}>
                    {i.numeracion_inicio ? `${i.numeracion_inicio} - ${i.numeracion_fin} (actual: ${i.numeracion_actual})` : "—"}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ background: i.tiene_stock ? (i.stock_actual <= 5 ? "#ffebee" : "#e8f5e9") : "#f5f5f5", color: i.tiene_stock ? (i.stock_actual <= 5 ? "#c62828" : "#2e7d32") : "#999", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "bold", fontSize: "0.85rem" }}>
                      {i.tiene_stock ? i.stock_actual : "∞"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm({ ...i, tiene_stock: i.tiene_stock === 1 }); setEditId(i.id); }}>Editar</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteItem(i.id)}>Eliminar</button>
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
