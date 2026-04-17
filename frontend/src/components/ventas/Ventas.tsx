import { useState, useEffect } from "react";
import { requireAuth, getUser } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";

export default function Ventas() {
  const [items, setItems] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [catActiva, setCatActiva] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteNombre, setClienteNombre] = useState("");
  const [ventaOk, setVentaOk] = useState<any>(null);
  const user = getUser();

  useEffect(() => { requireAuth(); loadData(); }, []);

  async function loadData() {
    const [i, c, cl, u] = await Promise.all([api.get("/catalogo/items"), api.get("/catalogo/categorias"), api.get("/ventas/clientes"), api.get("/catalogo/unidades")]);
    setItems(i || []);
    setCategorias(c || []);
    setClientes(cl || []);
    setUnidades(u || []);
    if (c?.length) setCatActiva(c[0].id);
  }

  function agregarItem(item: any) {
    const existe = carrito.find(c => c.item_id === item.id);
    if (existe) {
      setCarrito(carrito.map(c => c.item_id === item.id ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.precio_unitario } : c));
    } else {
      setCarrito([...carrito, { item_id: item.id, nombre: item.nombre, precio_unitario: item.precio, cantidad: 1, subtotal: item.precio, unidad_id: item.unidad_id, unidad: item.unidad_nombre }]);
    }
  }

  function cambiarCantidad(item_id: number, cantidad: number) {
    if (cantidad <= 0) { setCarrito(carrito.filter(c => c.item_id !== item_id)); return; }
    setCarrito(carrito.map(c => c.item_id === item_id ? { ...c, cantidad, subtotal: cantidad * c.precio_unitario } : c));
  }

  const total = carrito.reduce((s, c) => s + c.subtotal, 0);
  const clientesFiltrados = clientes.filter(c => c.nombre.toLowerCase().includes(clienteBusqueda.toLowerCase())).slice(0, 5);

  async function realizarVenta() {
    if (!carrito.length) return alert("El carrito está vacío");
    const res = await api.post("/ventas", { cliente_id: clienteId, usuario_id: user?.id, total, detalle: carrito });
    if (res?.id) {
      setVentaOk({ id: res.id, carrito, total, cliente: clienteNombre || "Sin nombre", fecha: new Date().toLocaleString() });
      setCarrito([]); setClienteId(null); setClienteNombre(""); setClienteBusqueda("");
    }
  }

  function imprimirRecibo() {
    if (!ventaOk) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Recibo #${ventaOk.id}</title>
      <style>body{font-family:monospace;max-width:300px;margin:0 auto;padding:1rem}h2,p{text-align:center}table{width:100%}td{padding:0.2rem 0}hr{border-top:1px dashed #000}.total{font-weight:bold;font-size:1.1rem}</style>
      </head><body>
      <h2>CAJA ESFM</h2><p>Sistema de Ventas</p><hr/>
      <p><b>Recibo #${ventaOk.id}</b></p>
      <p>Cliente: ${ventaOk.cliente}</p>
      <p>Fecha: ${ventaOk.fecha}</p><hr/>
      <table>${ventaOk.carrito.map((i: any) => `<tr><td>${i.nombre}</td><td>${i.cantidad} ${i.unidad}</td><td>Bs. ${i.subtotal.toFixed(2)}</td></tr>`).join("")}</table>
      <hr/><p class="total">TOTAL: Bs. ${ventaOk.total.toFixed(2)}</p>
      <hr/><p>¡Gracias!</p></body></html>
    `);
    w.document.close(); w.print();
  }

  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const btnStyle = (color: string) => ({ padding: "0.5rem 1rem", background: color, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" });

  return (
    <NavLayout titulo="Punto de Venta">
      {ventaOk && (
        <div style={{ background: "#4CAF50", color: "#fff", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✅ Venta #{ventaOk.id} registrada — Total: Bs. {ventaOk.total.toFixed(2)}</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={btnStyle("#fff")} onClick={imprimirRecibo}><span style={{ color: "#4CAF50" }}>🖨 Imprimir recibo</span></button>
            <button style={btnStyle("#388E3C")} onClick={() => setVentaOk(null)}>Nueva venta</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
        <div>
          <div style={{ background: "#fff", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>Cliente</label>
            <input style={inputStyle} value={clienteBusqueda} onChange={e => { setClienteBusqueda(e.target.value); setClienteId(null); setClienteNombre(e.target.value); }} placeholder="Buscar o escribir nombre..." />
            {clienteBusqueda && !clienteId && clientesFiltrados.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: "6px", marginTop: "0.25rem" }}>
                {clientesFiltrados.map(c => (
                  <div key={c.id} onClick={() => { setClienteId(c.id); setClienteNombre(c.nombre); setClienteBusqueda(c.nombre); }}
                    style={{ padding: "0.6rem 1rem", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontSize: "0.9rem" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                    {c.nombre} — {c.tipo}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: "8px", padding: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {categorias.map(c => (
                <button key={c.id} onClick={() => setCatActiva(c.id)}
                  style={{ padding: "0.4rem 1rem", border: "none", borderRadius: "20px", cursor: "pointer", background: catActiva === c.id ? "#2196F3" : "#f0f0f0", color: catActiva === c.id ? "#fff" : "#333", fontSize: "0.85rem" }}>
                  {c.nombre}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
              {items.filter(i => i.categoria_id === catActiva).map(i => (
                <div key={i.id} onClick={() => agregarItem(i)}
                  style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "1rem", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#e3f2fd"; e.currentTarget.style.borderColor = "#2196F3"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e0e0e0"; }}>
                  <div style={{ fontWeight: "bold", marginBottom: "0.3rem", fontSize: "0.9rem" }}>{i.nombre}</div>
                  <div style={{ color: "#2196F3", fontWeight: "bold" }}>Bs. {Number(i.precio).toFixed(2)}</div>
                  <div style={{ color: "#888", fontSize: "0.75rem" }}>{i.unidad_nombre} {i.tiene_stock ? `| Stock: ${i.stock_actual}` : "| Ilimitado"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "8px", padding: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", height: "fit-content", position: "sticky", top: "1rem" }}>
          <h3 style={{ marginBottom: "1rem", color: "#333" }}>🛒 Carrito</h3>
          {carrito.length === 0 ? (
            <p style={{ color: "#aaa", textAlign: "center", padding: "2rem 0", fontSize: "0.9rem" }}>Selecciona items del catálogo</p>
          ) : (
            <>
              {carrito.map(c => (
                <div key={c.item_id} style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.3rem" }}>{c.nombre}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button onClick={() => cambiarCantidad(c.item_id, c.cantidad - 1)} style={{ width: "28px", height: "28px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "#f5f5f5" }}>−</button>
                      <input type="number" value={c.cantidad} onChange={e => cambiarCantidad(c.item_id, Number(e.target.value))}
                        style={{ width: "50px", textAlign: "center", border: "1px solid #ddd", borderRadius: "4px", padding: "0.2rem" }} />
                      <button onClick={() => cambiarCantidad(c.item_id, c.cantidad + 1)} style={{ width: "28px", height: "28px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "#f5f5f5" }}>+</button>
                    </div>
                    <span style={{ fontWeight: "bold", color: "#2196F3" }}>Bs. {c.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "2px solid #333", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: "bold", marginBottom: "1rem" }}>
                <span>TOTAL</span><span style={{ color: "#2196F3" }}>Bs. {total.toFixed(2)}</span>
              </div>
              <button onClick={realizarVenta} style={{ width: "100%", padding: "0.85rem", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>
                ✅ Registrar Venta
              </button>
              <button onClick={() => setCarrito([])} style={{ width: "100%", padding: "0.6rem", background: "#f5f5f5", color: "#666", border: "none", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", marginTop: "0.5rem" }}>
                Limpiar carrito
              </button>
            </>
          )}
        </div>
      </div>
    </NavLayout>
  );
}
