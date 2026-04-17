import { useEffect } from "react";
import { requireAuth, getUser, logout } from "../lib/auth";

const modulos = [
  { nombre: "Catálogo", desc: "Categorías e items", href: "/caja/catalogo", color: "#4CAF50", icon: "📦" },
  { nombre: "Punto de Venta", desc: "Realizar ventas", href: "/caja/ventas", color: "#2196F3", icon: "🛒" },
  { nombre: "Inventario", desc: "Stock y movimientos", href: "/caja/inventario", color: "#FF9800", icon: "📊" },
  { nombre: "Reportes & Caja", desc: "Reportes y arqueo", href: "/caja/reportes", color: "#9C27B0", icon: "📋" },
];

export default function Dashboard() {
  useEffect(() => { requireAuth(); }, []);
  const user = getUser();

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <nav style={{ background: "#1a1a2e", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#e94560", fontSize: "1.3rem", fontWeight: "bold" }}>Caja ESFM</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#ccc", fontSize: "0.9rem" }}>👤 {user?.nombre}</span>
          <button onClick={logout} style={{ background: "#e94560", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
            Salir
          </button>
        </div>
      </nav>
      <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ color: "#333", marginBottom: "0.5rem" }}>Panel Principal</h2>
        <p style={{ color: "#666", marginBottom: "2rem" }}>Selecciona un módulo para continuar</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {modulos.map(m => (
            <a key={m.href} href={m.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: "12px", padding: "2rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderTop: `4px solid ${m.color}`, cursor: "pointer", transition: "transform 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{m.icon}</div>
                <h3 style={{ color: "#333", marginBottom: "0.5rem", fontSize: "1rem" }}>{m.nombre}</h3>
                <p style={{ color: "#888", fontSize: "0.8rem" }}>{m.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
