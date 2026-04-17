import { useState, useEffect } from "react";
import { requireAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";

export default function Catalogo() {
  const [tab, setTab] = useState<"categorias" | "items" | "unidades">("categorias");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { requireAuth(); loadAll(); }, []);

  async function loadAll() {
    const [c, i, u] = await Promise.all([api.get("/catalogo/categorias"), api.get("/catalogo/items"), api.get("/catalogo/unidades")]);
    setCategorias(c || []);
    setItems(i || []);
    setUnidades(u || []);
  }

  function notify(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  async function saveCategoria() {
    if (editId) await api.put(`/catalogo/categorias/${editId}`, form);
    else await api.post("/catalogo/categorias", form);
    setForm({}); setEditId(null); loadAll(); notify("Guardado ✓");
  }

  async function deleteCategoria(id: number) {
    if (!confirm("¿Eliminar categoría?")) return;
    await api.delete(`/catalogo/categorias/${id}`); loadAll(); notify("Eliminado ✓");
  }

  async function saveItem() {
    if (editId) await api.put(`/catalogo/items/${editId}`, { ...form, usuario_id: 1 });
    else await api.post("/catalogo/items", form);
    setForm({}); setEditId(null); loadAll(); notify("Guardado ✓");
  }

  async function deleteItem(id: number) {
    if (!confirm("¿Eliminar item?")) return;
    await api.delete(`/catalogo/items/${id}`); loadAll(); notify("Eliminado ✓");
  }

  async function saveUnidad() {
    await api.post("/catalogo/unidades", form);
    setForm({}); loadAll(); notify("Guardado ✓");
  }

  const tabStyle = (t: string) => ({ padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", fontWeight: tab === t ? "bold" : "normal", background: tab === t ? "#fff" : "#ddd", color: tab === t ? "#1a1a2e" : "#666" });
  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const btnStyle = (color: string) => ({ padding: "0.5rem 1rem", background: color, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" });

  return (
    <NavLayout titulo="Catálogo">
      {msg && <div style={{ background: "#4CAF50", color: "#fff", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{msg}</div>}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0" }}>
        <button style={tabStyle("categorias")} onClick={() => { setTab("categorias"); setForm({}); setEditId(null); }}>Categorías</button>
        <button style={tabStyle("items")} onClick={() => { setTab("items"); setForm({}); setEditId(null); }}>Items</button>
        <button style={tabStyle("unidades")} onClick={() => { setTab("unidades"); setForm({}); setEditId(null); }}>Unidades</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

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
                {editId && <button style={btnStyle("#999")} onClick={() => { setForm({}); setEditId(null); }}>Cancelar</button>}
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Descripción</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem" }}>Acciones</th>
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

        {tab === "items" && (
          <>
            <h3 style={{ marginBottom: "1rem", color: "#333" }}>{editId ? "Editar" : "Nuevo"} Item</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Nombre</label>
                <input style={inputStyle} value={form.nombre || ""} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del item" />
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
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>Precio (Bs.)</label>
                <input style={inputStyle} type="number" step="0.01" value={form.precio || ""} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} placeholder="0.00" />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666" }}>¿Tiene stock?</label>
                <select style={inputStyle} value={form.tiene_stock ? "1" : "0"} onChange={e => setForm({ ...form, tiene_stock: e.target.value === "1" })}>
                  <option value="1">Sí (inventariado)</option>
                  <option value="0">No (ilimitado)</option>
                </select>
              </div>
              {form.tiene_stock && (
                <div>
                  <label style={{ fontSize: "0.8rem", color: "#666" }}>Stock inicial</label>
                  <input style={inputStyle} type="number" value={form.stock_actual || 0} onChange={e => setForm({ ...form, stock_actual: Number(e.target.value) })} />
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button style={btnStyle("#4CAF50")} onClick={saveItem}>Guardar</button>
              {editId && <button style={btnStyle("#999")} onClick={() => { setForm({}); setEditId(null); }}>Cancelar</button>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Categoría</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Precio</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Unidad</th>
                <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Stock</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem" }}>Acciones</th>
              </tr></thead>
              <tbody>{items.map(i => (
                <tr key={i.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.75rem" }}>{i.nombre}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{i.categoria}</td>
                  <td style={{ padding: "0.75rem" }}>Bs. {Number(i.precio).toFixed(2)}</td>
                  <td style={{ padding: "0.75rem", color: "#666" }}>{i.unidad_nombre}</td>
                  <td style={{ padding: "0.75rem" }}>{i.tiene_stock ? i.stock_actual : "∞"}</td>
                  <td style={{ padding: "0.75rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    <button style={btnStyle("#2196F3")} onClick={() => { setForm({ ...i, tiene_stock: i.tiene_stock === 1 }); setEditId(i.id); }}>Editar</button>
                    <button style={btnStyle("#f44336")} onClick={() => deleteItem(i.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}

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
      </div>
    </NavLayout>
  );
}
