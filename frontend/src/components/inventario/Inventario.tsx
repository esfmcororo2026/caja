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
  const [lotesDelItem, setLotesDelItem] = useState<any[]>([]);
  const [accionLote, setAccionLote] = useState<"agregar" | "retirar">("agregar");
  const [formRetiro, setFormRetiro] = useState<any>({});
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const hoy = new Date().toISOString().split("T")[0];
  const [msg, setMsg] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaMov, setBusquedaMov] = useState("");
  const user = getUser();

  useEffect(() => { requireAuth(); loadStock(); loadItems(); }, []);
  useEffect(() => { if (tab === "movimientos") loadMovimientos(); }, [tab]);
  useEffect(() => { if (tab === "nuevo_lote") loadStock(); }, [tab]);

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

  async function onSelectItem(item_id: number, esRetiro = false) {
    if (esRetiro) setFormRetiro({ ...formRetiro, item_id });
    else setFormLote({ ...formLote, item_id });
    if (!item_id) { setLotesDelItem([]); return; }
    const lotes = stock.filter((l: any) => Number(l.item_id) === Number(item_id));
    if (lotes.length > 0) {
      setLotesDelItem(lotes);
    } else {
      const r = await api.get("/inventario/stock");
      setStock(r || []);
      setLotesDelItem((r || []).filter((l: any) => Number(l.item_id) === Number(item_id)));
    }
  }

  async function retirarLote() {
    if (!formRetiro.lote_id) return alert("Selecciona un lote a retirar");
    if (!formRetiro.motivo?.trim()) return alert("Debes justificar el motivo del retiro");
    if (!confirm(`¿Confirmas retirar este lote?\n\nMotivo: ${formRetiro.motivo}`)) return;
    await api.post("/inventario/retirar-lote", { ...formRetiro, usuario_id: user?.id });
    setFormRetiro({});
    setLotesDelItem([]);
    loadStock();
    setMsg("LOTE RETIRADO ✓");
    setTimeout(() => setMsg(""), 3000);
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
            {/* Cabecera: fecha de hoy + busqueda + resumen */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <span style={{ fontSize: "1rem", fontWeight: "bold", color: "#1a1a2e" }}>📅 {new Date().toLocaleDateString("es-BO", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}</span>
              </div>
              <button onClick={loadMovimientos}
                style={{ padding: "0.4rem 0.75rem", background: "#2196F3", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                🔄 ACTUALIZAR
              </button>
            </div>

            {/* Resumen del dia */}
            {movimientos.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {["venta", "ingreso", "egreso", "ajuste"].map(tipo => {
                  const movsTipo = movimientos.filter(m => m.tipo === tipo);
                  if (!movsTipo.length) return null;
                  const totalUds = movsTipo.reduce((s, m) => s + Number(m.cantidad), 0);
                  const colors: any = { venta: ["#fff3e0", "#e65100"], ingreso: ["#e8f5e9", "#2e7d32"], egreso: ["#ffebee", "#c62828"], ajuste: ["#f3e5f5", "#6a1b9a"] };
                  const labels: any = { venta: "VENTAS", ingreso: "INGRESOS", egreso: "EGRESOS", ajuste: "AJUSTES" };
                  const icons: any = { venta: "🛒", ingreso: "📥", egreso: "📤", ajuste: "🔧" };
                  return (
                    <div key={tipo} style={{ background: colors[tipo][0], color: colors[tipo][1], padding: "0.5rem 1rem", borderRadius: "10px", fontSize: "0.82rem", fontWeight: "bold", lineHeight: "1.5" }}>
                      <div>{icons[tipo]} {labels[tipo]}</div>
                      <div style={{ fontSize: "1rem" }}>{movsTipo.length} {movsTipo.length === 1 ? "registro" : "registros"}</div>
                      <div style={{ fontSize: "0.78rem", opacity: 0.8 }}>{totalUds} {totalUds === 1 ? "unidad" : "unidades"} en total</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Busqueda */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
              <input
                style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.9rem" }}
                placeholder="🔍 BUSCAR POR NOMBRE DE ITEM..."
                value={busquedaMov}
                onChange={e => setBusquedaMov(e.target.value)}
              />
              {busquedaMov && (
                <button onClick={() => setBusquedaMov("")}
                  style={{ padding: "0.5rem 0.75rem", background: "#999", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                  LIMPIAR
                </button>
              )}
            </div>

            {/* Lista de movimientos */}
            {(() => {
              const filtrados = movimientos.filter(m =>
                !busquedaMov || m.item.toUpperCase().includes(busquedaMov.toUpperCase())
              );
              if (filtrados.length === 0) return (
                <p style={{ color: "#aaa", textAlign: "center", padding: "3rem", fontSize: "0.95rem" }}>
                  {movimientos.length === 0 ? "Sin movimientos hoy" : "Sin resultados para \"" + busquedaMov + "\""}
                </p>
              );
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {filtrados.map(m => {
                    const hora = m.fecha?.includes("T")
                      ? m.fecha.split("T")[1]?.slice(0, 8)
                      : m.fecha?.slice(11, 19) || "--:--:--";
                    const colors: any = {
                      venta:   { bg: "#fff3e0", color: "#e65100", border: "#FFB74D", icon: "🛒" },
                      ingreso: { bg: "#e8f5e9", color: "#2e7d32", border: "#81C784", icon: "📥" },
                      egreso:  { bg: "#ffebee", color: "#c62828", border: "#EF9A9A", icon: "📤" },
                      ajuste:  { bg: "#f3e5f5", color: "#6a1b9a", border: "#CE93D8", icon: "🔧" },
                    };
                    const c = colors[m.tipo] || colors.ajuste;
                    const signo = (m.tipo === "venta" || m.tipo === "egreso") ? "-" : "+";
                    return (
                      <div key={m.id} style={{ display: "grid", gridTemplateColumns: "70px 28px 1fr auto auto auto", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", background: c.bg, borderLeft: `4px solid ${c.border}`, borderRadius: "6px" }}>
                        {/* Hora */}
                        <span style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: "bold", color: "#444", letterSpacing: "0.5px" }}>{hora}</span>
                        {/* Icono */}
                        <span style={{ fontSize: "1.1rem", textAlign: "center" }}>{c.icon}</span>
                        {/* Nombre + motivo */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "bold", fontSize: "0.92rem", color: "#1a1a2e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.item}</div>
                          {m.motivo && <div style={{ fontSize: "0.75rem", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.motivo}</div>}
                        </div>
                        {/* Tipo badge */}
                        <span style={{ background: "rgba(255,255,255,0.7)", color: c.color, padding: "0.2rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {m.tipo.toUpperCase()}
                        </span>
                        {/* Cantidad */}
                        <span style={{ fontWeight: "bold", fontSize: "1.1rem", color: c.color, minWidth: "45px", textAlign: "right" }}>
                          {signo}{m.cantidad}
                        </span>
                        {/* Usuario */}
                        <span style={{ fontSize: "0.72rem", color: "#bbb", minWidth: "60px", textAlign: "right" }}>{m.usuario}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}

        {/* ===== NUEVO LOTE ===== */}
        {tab === "nuevo_lote" && (
          <>
            {/* Toggle agregar / retirar */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <button onClick={() => { setAccionLote("agregar"); setFormLote({}); setFormRetiro({}); setLotesDelItem([]); }}
                style={{ padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: accionLote === "agregar" ? "bold" : "normal", background: accionLote === "agregar" ? "#4CAF50" : "#f0f0f0", color: accionLote === "agregar" ? "#fff" : "#666" }}>
                📥 AGREGAR LOTE
              </button>
              <button onClick={() => { setAccionLote("retirar"); setFormLote({}); setFormRetiro({}); setLotesDelItem([]); }}
                style={{ padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: accionLote === "retirar" ? "bold" : "normal", background: accionLote === "retirar" ? "#f44336" : "#f0f0f0", color: accionLote === "retirar" ? "#fff" : "#666" }}>
                📤 RETIRAR LOTE
              </button>
            </div>

            {/* ---- AGREGAR ---- */}
            {accionLote === "agregar" && (
              <>
                <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1.25rem" }}>
                  Registra nuevos talonarios o documentos para un item existente. El sistema los usará automáticamente en ventas cuando el lote anterior se agote.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxWidth: "600px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>ITEM</label>
                    <select style={inputStyle} value={formLote.item_id || ""} onChange={e => onSelectItem(Number(e.target.value))}>
                      <option value="">Seleccionar item...</option>
                      {itemsConNumeracion.map(i => <option key={i.id} value={i.id}>{i.nombre} — {i.codigo_nombre || "sin código"}</option>)}
                    </select>
                  </div>

                  {lotesDelItem.length > 0 && (
                    <div style={{ gridColumn: "span 2", background: "#fff8e1", border: "1px solid #FFD54F", borderRadius: "8px", padding: "0.75rem 1rem" }}>
                      <p style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#e65100", marginBottom: "0.5rem" }}>⚠️ LOTES ACTIVOS — no repitas numeración:</p>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>
                          <th style={{ padding: "0.3rem 0.5rem", textAlign: "left", fontSize: "0.75rem", color: "#888" }}>LOTE</th>
                          <th style={{ padding: "0.3rem 0.5rem", textAlign: "left", fontSize: "0.75rem", color: "#888" }}>NUMERACIÓN</th>
                          <th style={{ padding: "0.3rem 0.5rem", textAlign: "left", fontSize: "0.75rem", color: "#888" }}>ACTUAL DESDE</th>
                          <th style={{ padding: "0.3rem 0.5rem", textAlign: "center", fontSize: "0.75rem", color: "#888" }}>STOCK</th>
                        </tr></thead>
                        <tbody>{lotesDelItem.map((l: any, idx: number) => (
                          <tr key={l.lote_id} style={{ borderTop: "1px solid #FFE082" }}>
                            <td style={{ padding: "0.3rem 0.5rem", fontSize: "0.82rem", color: "#666" }}>Lote #{idx + 1}</td>
                            <td style={{ padding: "0.3rem 0.5rem", fontSize: "0.82rem", fontWeight: "bold" }}>{l.numeracion_inicio} — {l.numeracion_fin}</td>
                            <td style={{ padding: "0.3rem 0.5rem", fontSize: "0.82rem", color: "#1565c0" }}>{l.numeracion_actual}</td>
                            <td style={{ padding: "0.3rem 0.5rem", textAlign: "center" }}>
                              <span style={{ background: l.stock_actual <= 5 ? "#ffebee" : "#e8f5e9", color: l.stock_actual <= 5 ? "#c62828" : "#2e7d32", padding: "0.1rem 0.5rem", borderRadius: "8px", fontWeight: "bold", fontSize: "0.82rem" }}>{l.stock_actual}</span>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}

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
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>MOTIVO / JUSTIFICACIÓN <span style={{ color: "#f44336" }}>*</span></label>
                    <input style={inputStyle} value={formLote.motivo || ""} onChange={e => setFormLote({ ...formLote, motivo: e.target.value })} placeholder="ej: Compra de talonarios gestión 2025" />
                  </div>
                </div>
                <button onClick={agregarLote} style={{ marginTop: "1rem", padding: "0.75rem 2rem", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  ✅ REGISTRAR NUEVO LOTE
                </button>
              </>
            )}

            {/* ---- RETIRAR ---- */}
            {accionLote === "retirar" && (
              <>
                <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1.25rem" }}>
                  Retira un lote activo del sistema. El lote quedará inactivo y sus documentos no podrán venderse. <b>Debe estar justificado.</b>
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", maxWidth: "600px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>ITEM</label>
                    <select style={inputStyle} value={formRetiro.item_id || ""} onChange={e => onSelectItem(Number(e.target.value), true)}>
                      <option value="">Seleccionar item...</option>
                      {itemsConNumeracion.map(i => <option key={i.id} value={i.id}>{i.nombre} — {i.codigo_nombre || "sin código"}</option>)}
                    </select>
                  </div>

                  {lotesDelItem.length > 0 && (
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: "0.8rem", color: "#666" }}>SELECCIONAR LOTE A RETIRAR</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                        {lotesDelItem.map((l: any, idx: number) => (
                          <label key={l.lote_id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", border: `2px solid ${formRetiro.lote_id === l.lote_id ? "#f44336" : "#ddd"}`, borderRadius: "8px", cursor: "pointer", background: formRetiro.lote_id === l.lote_id ? "#ffebee" : "#fafafa" }}>
                            <input type="radio" name="lote" checked={formRetiro.lote_id === l.lote_id}
                              onChange={() => setFormRetiro({ ...formRetiro, lote_id: l.lote_id, item_id: l.item_id, stock_actual: l.stock_actual })} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Lote #{idx + 1} — </span>
                              <span style={{ fontSize: "0.9rem" }}>Numeración {l.numeracion_inicio} al {l.numeracion_fin}</span>
                              <span style={{ marginLeft: "0.75rem", fontSize: "0.82rem", color: "#666" }}>| Actual desde: {l.numeracion_actual}</span>
                            </div>
                            <span style={{ background: l.stock_actual <= 5 ? "#ffebee" : "#e8f5e9", color: l.stock_actual <= 5 ? "#c62828" : "#2e7d32", padding: "0.2rem 0.6rem", borderRadius: "8px", fontWeight: "bold", fontSize: "0.85rem" }}>
                              {l.stock_actual} docs
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "0.8rem", color: "#666" }}>MOTIVO / JUSTIFICACIÓN <span style={{ color: "#f44336" }}>*</span></label>
                    <textarea style={{ ...inputStyle, height: "80px", resize: "vertical" } as any}
                      value={formRetiro.motivo || ""}
                      onChange={e => setFormRetiro({ ...formRetiro, motivo: e.target.value })}
                      placeholder="ej: Documentos extraviados, gestión anterior finalizada, lote dañado..." />
                  </div>
                </div>
                <button onClick={retirarLote} style={{ marginTop: "1rem", padding: "0.75rem 2rem", background: "#f44336", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  📤 CONFIRMAR RETIRO DE LOTE
                </button>
              </>
            )}
          </>
        )}
      </div>
    </NavLayout>
  );
}
