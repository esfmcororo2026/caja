import { useState } from "react";
import { api } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await api.post("/auth/login", { email, password });
    setLoading(false);
    if (res?.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("usuario", JSON.stringify(res.usuario));
      window.location.href = "/caja/dashboard";
    } else {
      setError(res?.error || "Error al iniciar sesión");
    }
  }

  return (
    <div style={{ background: "#16213e", padding: "2rem", borderRadius: "12px", width: "360px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
      <h1 style={{ color: "#e94560", textAlign: "center", marginBottom: "0.5rem", fontSize: "1.5rem" }}>Caja ESFM</h1>
      <p style={{ color: "#aaa", textAlign: "center", marginBottom: "2rem", fontSize: "0.9rem" }}>Sistema de Control de Ventas</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ color: "#ccc", display: "block", marginBottom: "0.4rem", fontSize: "0.85rem" }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #333", background: "#0f3460", color: "#fff", fontSize: "1rem" }}
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "#ccc", display: "block", marginBottom: "0.4rem", fontSize: "0.85rem" }}>Contraseña</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #333", background: "#0f3460", color: "#fff", fontSize: "1rem" }}
          />
        </div>
        {error && <p style={{ color: "#e94560", marginBottom: "1rem", fontSize: "0.85rem", textAlign: "center" }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "0.75rem", background: "#e94560", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: "pointer", fontWeight: "bold" }}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
