import { useState, useEffect } from "react";
import { requireAuth, getUser } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";

const DENOMINACIONES = [
  { tipo: "billete", valor: 200 }, { tipo: "billete", valor: 100 }, { tipo: "billete", valor: 50 },
  { tipo: "billete", valor: 20 }, { tipo: "billete", valor: 10 },
  { tipo: "moneda", valor: 5 }, { tipo: "moneda", valor: 2 }, { tipo: "moneda", valor: 1 },
];

export default function Reportes() {
  const [tab, setTab] = useState<"reportes" | "caja">("reportes");
  const [ventas, setVentas] = useState<any[]>([]);
  const [ventasDetalle, setVentasDetalle] = useState<any[]>([]);
  const [vistaReporte, setVistaReporte] = useState<"resumen" | "detalle">("resumen");
  const [desde, setDesde] = useState(new Date().toISOString().split("T")[0]);
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const [cajaSesion, setCajaSesion] = useState<any>(null);
  const [montApertura, setMontApertura] = useState("");
  const [conteo, setConteo] = useState<Record<number, number>>({});
  const [arqueoData, setArqueoData] = useState<any>(null);
  const user = getUser();

  useEffect(() => {
    requireAuth();
    const u = getUser();
    if (!u) return;
    api.get(`/reportes/caja/sesion-activa/${u.id}`).then((r) => {
      if (r?.sesion) setCajaSesion({ id: r.sesion.id, monto_apertura: Number(r.sesion.monto_apertura) });
    });
  }, []);

  async function loadReportes() {
    const [resumen, detalle] = await Promise.all([
      api.get(`/reportes/ventas?desde=${desde}&hasta=${hasta}`),
      api.get(`/reportes/ventas/detalle?desde=${desde}&hasta=${hasta}`),
    ]);
    setVentas(resumen || []);
    setVentasDetalle(detalle || []);
  }

  async function abrirCaja() {
    const r = await api.post("/reportes/caja/abrir", { usuario_id: user?.id, monto_apertura: Number(montApertura) });
    if (r?.id) setCajaSesion({ id: r.id, monto_apertura: Number(montApertura) });
    else alert(r?.error || "Error");
  }

  async function cerrarCaja() {
    const denominaciones = DENOMINACIONES.filter(d => conteo[d.valor]).map(d => ({
      tipo: d.tipo, denominacion: d.valor, cantidad: conteo[d.valor], subtotal: d.valor * conteo[d.valor],
    }));
    const monto_cierre = denominaciones.reduce((s, d) => s + d.subtotal, 0);
    await api.post("/reportes/caja/cerrar", { caja_sesion_id: cajaSesion.id, monto_cierre, denominaciones });
    const data = await api.get(`/reportes/caja/${cajaSesion.id}`);
    setArqueoData({ ...data, monto_cierre });
    setCajaSesion(null); setConteo({});
  }

  function imprimirArqueo() {
    if (!arqueoData) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const dif = arqueoData.monto_cierre - (arqueoData.ventas?.total_ventas || 0) - Number(arqueoData.sesion.monto_apertura);
    w.document.write(`
      <html><head><title>Arqueo de Caja</title>
      <style>body{font-family:monospace;max-width:350px;margin:0 auto;padding:1rem}h2,p{text-align:center}table{width:100%}td{padding:0.2rem}hr{border-top:1px dashed}</style>
      </head><body>
      <h2>ARQUEO DE CAJA</h2><hr/>
      <p>Apertura: ${arqueoData.sesion.fecha_apertura}</p>
      <p>Cierre: ${arqueoData.sesion.fecha_cierre}</p><hr/>
      <p><b>Monto apertura: Bs. ${Number(arqueoData.sesion.monto_apertura).toFixed(2)}</b></p>
      <p><b>Total ventas (${arqueoData.ventas?.total_transacciones || 0} transacc.): Bs. ${Number(arqueoData.ventas?.total_ventas || 0).toFixed(2)}</b></p>
      <p><b>Esperado en caja: Bs. ${(Number(arqueoData.sesion.monto_apertura) + Number(arqueoData.ventas?.total_ventas || 0)).toFixed(2)}</b></p>
      <p><b>Monto contado: Bs. ${Number(arqueoData.monto_cierre).toFixed(2)}</b></p>
      <hr/>
      <p><b>Diferencia: Bs. ${dif.toFixed(2)}</b></p>
      <hr/><h3>Detalle billetes y monedas</h3>
      <table>${arqueoData.denominaciones.map((d: any) => `<tr><td>${d.tipo} Bs.${d.denominacion}</td><td>x${d.cantidad}</td><td>Bs. ${d.subtotal}</td></tr>`).join("")}</table>
      </body></html>
    `);
    w.document.close(); w.print();
  }

  const totalContado = DENOMINACIONES.reduce((s, d) => s + (conteo[d.valor] || 0) * d.valor, 0);
  const tabStyle = (t: string) => ({ padding: "0.6rem 1.5rem", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer", fontWeight: tab === t ? "bold" : "normal", background: tab === t ? "#fff" : "#ddd", color: tab === t ? "#1a1a2e" : "#666" });
  const inputStyle = { padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };

  return (
    <NavLayout titulo="Reportes & Caja">
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0" }}>
        <button style={tabStyle("reportes")} onClick={() => setTab("reportes")}>Reportes</button>
        <button style={tabStyle("caja")} onClick={() => setTab("caja")}>Caja</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

        {tab === "reportes" && (
          <>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666", display: "block" }}>Desde</label>
                <input type="date" style={inputStyle} value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#666", display: "block" }}>Hasta</label>
                <input type="date" style={inputStyle} value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
              <button onClick={loadReportes} style={{ padding: "0.6rem 1.5rem", background: "#9C27B0", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>Generar</button>
              {ventas.length > 0 && <button onClick={() => {
                const w = window.open("", "_blank"); if (!w) return;
                w.document.write(`<html><head><title>Reporte</title><style>body{font-family:sans-serif;padding:2rem}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:0.5rem}th{background:#f5f5f5}</style></head><body>
                <h2>Reporte de Ventas: ${desde} al ${hasta}</h2>
                <table><tr><th>Fecha</th><th>Ventas</th><th>Total</th></tr>
                ${ventas.map(v => `<tr><td>${v.dia}</td><td>${v.total_ventas}</td><td>Bs. ${Number(v.monto_total).toFixed(2)}</td></tr>`).join("")}
                <tr><td colspan="2"><b>TOTAL</b></td><td><b>Bs. ${ventas.reduce((s, v) => s + Number(v.monto_total), 0).toFixed(2)}</b></td></tr>
                </table></body></html>`);
                w.document.close(); w.print();
              }} style={{ padding: "0.6rem 1.5rem", background: "#FF9800", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>🖨 PDF</button>}
            </div>
            {ventas.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ background: "#f3e5f5", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Total ventas</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#9C27B0" }}>{ventasDetalle.length}</div>
                  </div>
                  <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Monto total</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#4CAF50" }}>Bs. {ventas.reduce((s, v) => s + Number(v.monto_total), 0).toFixed(2)}</div>
                  </div>
                  <div style={{ background: "#e3f2fd", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Días con ventas</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#2196F3" }}>{ventas.length}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                  <button onClick={() => setVistaReporte("resumen")} style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer", background: vistaReporte === "resumen" ? "#9C27B0" : "#eee", color: vistaReporte === "resumen" ? "#fff" : "#333", fontSize: "0.85rem" }}>Por día</button>
                  <button onClick={() => setVistaReporte("detalle")} style={{ padding: "0.4rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer", background: vistaReporte === "detalle" ? "#9C27B0" : "#eee", color: vistaReporte === "detalle" ? "#fff" : "#333", fontSize: "0.85rem" }}>Por venta</button>
                </div>


                {vistaReporte === "resumen" && (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ background: "#f5f5f5" }}>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Fecha</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>N° Ventas</th>
                      <th style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.85rem" }}>Total</th>
                    </tr></thead>
                    <tbody>{ventas.map((v, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "0.75rem" }}>{v.dia}</td>
                        <td style={{ padding: "0.75rem" }}>{v.total_ventas}</td>
                        <td style={{ padding: "0.75rem", fontWeight: "bold", color: "#4CAF50" }}>Bs. {Number(v.monto_total).toFixed(2)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}

                {vistaReporte === "detalle" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                    <thead><tr style={{ background: "#f5f5f5" }}>
                      <th style={{ padding: "0.6rem", textAlign: "left" }}>#</th>
                      <th style={{ padding: "0.6rem", textAlign: "left" }}>Fecha</th>
                      <th style={{ padding: "0.6rem", textAlign: "left" }}>Cliente</th>
                      <th style={{ padding: "0.6rem", textAlign: "left" }}>Cajero</th>
                      <th style={{ padding: "0.6rem", textAlign: "left" }}>Items</th>
                      <th style={{ padding: "0.6rem", textAlign: "right" }}>Total</th>
                    </tr></thead>
                    <tbody>{ventasDetalle.map((v: any) => (
                      <tr key={v.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "0.6rem", color: "#999" }}>#{v.id}</td>
                        <td style={{ padding: "0.6rem" }}>{new Date(v.fecha).toLocaleString("es-BO")}</td>
                        <td style={{ padding: "0.6rem" }}>{v.cliente || <span style={{ color: "#bbb" }}>—</span>}</td>
                        <td style={{ padding: "0.6rem" }}>{v.cajero}</td>
                        <td style={{ padding: "0.6rem", color: "#666", fontSize: "0.8rem" }}>
                          {v.items?.map((it: any, i: number) => (
                            <div key={i}>{it.cantidad} {it.unidad} × {it.item}{it.numeracion_desde ? ` (${it.numeracion_desde}-${it.numeracion_hasta})` : ""}</div>
                          ))}
                        </td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontWeight: "bold", color: "#4CAF50" }}>Bs. {Number(v.total).toFixed(2)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}

        {tab === "caja" && (
          <>
            {!cajaSesion && !arqueoData && (
              <div style={{ maxWidth: "400px" }}>
                <h3 style={{ marginBottom: "1rem", color: "#333" }}>Apertura de Caja</h3>
                <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>Monto inicial (Bs.)</label>
                <input type="number" style={{ ...inputStyle, width: "100%", marginBottom: "1rem" }} value={montApertura} onChange={e => setMontApertura(e.target.value)} placeholder="0.00" />
                <button onClick={abrirCaja} style={{ padding: "0.75rem 2rem", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Abrir Caja
                </button>
              </div>
            )}

            {cajaSesion && (
              <>
                <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
                  <span style={{ color: "#2e7d32", fontWeight: "bold" }}>✅ Caja abierta — Monto inicial: Bs. {cajaSesion.monto_apertura.toFixed(2)}</span>
                </div>
                <h3 style={{ marginBottom: "1rem", color: "#333" }}>Conteo de billetes y monedas</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  {DENOMINACIONES.map(d => (
                    <div key={d.valor} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "bold" }}>{d.tipo === "billete" ? "💵" : "🪙"} Bs. {d.valor}</span>
                      <input type="number" min="0" value={conteo[d.valor] || ""} onChange={e => setConteo({ ...conteo, [d.valor]: Number(e.target.value) })}
                        style={{ width: "70px", padding: "0.4rem", border: "1px solid #ddd", borderRadius: "6px", textAlign: "center" }} placeholder="0" />
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f5f5f5", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", fontSize: "1.1rem", fontWeight: "bold" }}>
                  Total contado: <span style={{ color: "#4CAF50" }}>Bs. {totalContado.toFixed(2)}</span>
                </div>
                <button onClick={cerrarCaja} style={{ padding: "0.75rem 2rem", background: "#f44336", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                  Cerrar Caja
                </button>
              </>
            )}

            {arqueoData && (
              <div>
                <h3 style={{ marginBottom: "1rem", color: "#333" }}>Resumen de Arqueo</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ background: "#e3f2fd", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Monto apertura</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#2196F3" }}>Bs. {Number(arqueoData.sesion.monto_apertura).toFixed(2)}</div>
                  </div>
                  <div style={{ background: "#e8f5e9", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Total ventas</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#4CAF50" }}>Bs. {Number(arqueoData.ventas?.total_ventas || 0).toFixed(2)}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "0.2rem" }}>{arqueoData.ventas?.total_transacciones || 0} transacciones</div>
                  </div>
                  <div style={{ background: "#fff3e0", borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>Monto contado</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#FF9800" }}>Bs. {Number(arqueoData.monto_cierre).toFixed(2)}</div>
                  </div>
                </div>
                {(() => {
                  const dif = arqueoData.monto_cierre - (arqueoData.ventas?.total_ventas || 0) - arqueoData.sesion.monto_apertura;
                  return (
                    <div style={{ background: Math.abs(dif) < 0.01 ? "#e8f5e9" : "#ffebee", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
                      <span style={{ fontWeight: "bold", color: Math.abs(dif) < 0.01 ? "#2e7d32" : "#c62828", fontSize: "1.1rem" }}>
                        {Math.abs(dif) < 0.01 ? "✅ Caja cuadrada" : `⚠️ Diferencia: Bs. ${dif.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={imprimirArqueo} style={{ padding: "0.75rem 2rem", background: "#9C27B0", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>🖨 Imprimir Arqueo</button>
                  <button onClick={() => setArqueoData(null)} style={{ padding: "0.75rem 2rem", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Nueva apertura</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </NavLayout>
  );
}
