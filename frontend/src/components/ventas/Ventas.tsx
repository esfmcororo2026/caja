import { useState, useEffect } from "react";
import { requireAuth, getUser } from "../../lib/auth";
import { api } from "../../lib/api";
import NavLayout from "../shared/NavLayout";
import BuscadorPersonas from "./BuscadorPersonas";

export default function Ventas() {
  const [items, setItems] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [catActiva, setCatActiva] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<any>(null);
  const [ventaOk, setVentaOk] = useState<any>(null);
  const user = getUser();

  useEffect(() => { requireAuth(); loadData(); }, []);

  async function loadData() {
    const [i, c, u] = await Promise.all([
      api.get("/catalogo/items"),
      api.get("/catalogo/categorias"),
      api.get("/catalogo/unidades")
    ]);
    setItems(i || []);
    setCategorias(c || []);
    setUnidades(u || []);
    if (c?.length) setCatActiva(c[0].id);
  }

  function handlePersonaSelect(persona: any) {
    setPersonaSeleccionada(persona);
  }

  async function handleRegistroNuevo(nombre: string) {
    try {
      const ci = prompt("Ingresa el CI de la persona:");
      if (!ci) return;
      
      const tipo = confirm("¿Es estudiante? (OK=Estudiante, Cancelar=Personal)") ? "ESTUDIANTE" : "PERSONAL";
      
      const nuevaPersona = await api.post("/personas", {
        nombre: nombre.toUpperCase(),
        ci,
        tipo,
      });
      
      if (nuevaPersona?.id) {
        handlePersonaSelect(nuevaPersona);
        alert("✅ Persona registrada exitosamente");
      }
    } catch (error) {
      alert("Error al registrar persona: " + (error as any).message);
    }
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

  async function realizarVenta() {
    if (!carrito.length) return alert("El carrito está vacío");
    if (!personaSeleccionada) return alert("Selecciona una persona");
    
    const res = await api.post("/ventas", { 
      persona_id: personaSeleccionada.id, 
      usuario_id: user?.id, 
      total, 
      detalle: carrito 
    });
    
    if (res?.id) {
      // Obtener detalle con numeraciones asignadas
      const detalleRes = await api.get(`/ventas/${res.id}/detalle`);
      const carritoConNums = detalleRes?.length
        ? carrito.map((c: any) => {
            const d = detalleRes.find((r: any) => r.item_id === c.item_id);
            return d ? { ...c, num_desde: d.numeracion_desde, num_hasta: d.numeracion_hasta } : c;
          })
        : carrito;
      const venta = { 
        id: res.id, 
        carrito: carritoConNums, 
        total, 
        persona: personaSeleccionada.nombre, 
        fecha: new Date().toLocaleString() 
      };
      setVentaOk(venta);
      setCarrito([]);
      setPersonaSeleccionada(null);
      imprimirReciboData(venta);
    }
  }

  function imprimirReciboData(v: any) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Recibo #${v.id}</title>
      <style>body{font-family:monospace;max-width:300px;margin:0 auto;padding:1rem}h2,p{text-align:center}table{width:100%}td{padding:0.2rem 0}hr{border-top:1px dashed #000}.total{font-weight:bold;font-size:1.1rem}</style>
      </head><body>
      <h2>CAJA ESFM</h2><p>Sistema de Ventas</p><hr/>
      <p><b>Recibo #${v.id}</b></p>
      <p>Persona: ${v.persona}</p>
      <p>Fecha: ${v.fecha}</p><hr/>
      <table>${v.carrito.map((i: any) => `<tr><td><b>${i.nombre}</b></td><td>${i.cantidad} ${i.unidad}</td><td>Bs. ${i.subtotal.toFixed(2)}</td></tr>${i.num_desde ? `<tr><td colspan="3" style="font-size:0.85em;color:#555">&nbsp;&nbsp;Nums: ${i.num_desde} al ${i.num_hasta}</td></tr>` : ""}`).join("")}</table>
      <hr/><p class="total">TOTAL: Bs. ${v.total.toFixed(2)}</p>
      <hr/><p>¡Gracias!</p></body></html>
    `);
    w.document.close(); w.print();
  }

  // Colores para categorías
  const btnStyle = (bg: string) => ({ padding: "0.5rem 1rem", background: bg, color: bg === "#fff" ? "#333" : "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" });

  const colorMap: { [key: number]: string } = {};
  categorias.forEach((cat, idx) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2"];
    colorMap[cat.id] = colors[idx % colors.length];
  });

  return (
    <NavLayout titulo="Punto de Venta">
      {ventaOk && (
        <div style={{ background: "#4CAF50", color: "#fff", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✅ Venta #{ventaOk.id} registrada — Total: Bs. {ventaOk.total.toFixed(2)}</span>
          <button style={btnStyle("#fff")} onClick={() => imprimirReciboData(ventaOk)}><span style={{ color: "#4CAF50" }}>🖨 Reimprimir recibo</span></button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
        <div>
          <div style={{ background: "#fff", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <BuscadorPersonas
              onSelect={handlePersonaSelect}
              onRegistroNuevo={handleRegistroNuevo}
            />
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
              {items.filter(i => i.categoria_id === catActiva).map(i => {
                const bgColor = colorMap[i.categoria_id];
                const sinStock = i.tiene_stock && Number(i.stock_actual) <= 0;
                return (
                  <div key={i.id} onClick={() => !sinStock && agregarItem(i)}
                    style={{
                      background: sinStock ? "#bbb" : bgColor,
                      borderRadius: "12px",
                      padding: "1rem",
                      cursor: sinStock ? "not-allowed" : "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      color: "#fff",
                      opacity: sinStock ? 0.55 : 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      transform: "scale(1)"
                    }}
                    onMouseEnter={e => { if (!sinStock) { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)"; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"; }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{sinStock ? "🚫" : "📦"}</div>
                    <div style={{ fontWeight: "bold", marginBottom: "0.3rem", fontSize: "0.95rem", lineHeight: "1.2" }}>{i.nombre}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", marginBottom: "0.3rem" }}>Bs. {Number(i.precio).toFixed(2)}</div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.9 }}>{i.unidad_nombre} {i.tiene_stock ? `| Stock: ${i.stock_actual}` : "| ∞"}</div>
                    {Number(i.numeracion_actual) > 0 && Number(i.stock_actual) > 0 && (
                      <div style={{ fontSize: "0.7rem", opacity: 0.85, marginTop: "0.2rem" }}>📄 Desde N° {i.numeracion_actual}</div>
                    )}
                    {sinStock && <div style={{ fontSize: "0.72rem", marginTop: "0.3rem", fontWeight: "bold" }}>SIN STOCK</div>}
                  </div>
                );
              })}
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
                  {c.num_desde && (
                    <div style={{ fontSize: "0.78rem", color: "#1565c0", marginBottom: "0.25rem" }}>📄 N° {c.num_desde}{c.num_hasta && c.num_hasta !== c.num_desde ? ` al ${c.num_hasta}` : ""}</div>
                  )}
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
