import { logout, getUser } from "../../lib/auth";

interface Props {
  titulo: string;
  children: React.ReactNode;
}

export default function NavLayout({ titulo, children }: Props) {
  const user = getUser();
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <nav style={{ background: "#1a1a2e", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/caja/dashboard" style={{ color: "#aaa", textDecoration: "none", fontSize: "0.9rem" }}>← Volver</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#ccc", fontSize: "0.9rem" }}>👤 {user?.nombre}</span>
          <button onClick={logout} style={{ background: "#e94560", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>Salir</button>
        </div>
      </nav>
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
       <h1 style={{ color: "#1a1a2e", fontSize: "2.8rem", fontWeight: "bold", textAlign: "center", margin: "2rem 0", letterSpacing: "2px" }}>{titulo}</h1>
        {children}
      </div>
    </div>
  );
}
