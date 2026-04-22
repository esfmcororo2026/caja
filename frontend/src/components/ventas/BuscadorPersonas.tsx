import { useState, useEffect } from "react";
import { api } from "../../lib/api";

interface Cliente {
  id: number;
  nombre: string;
  ci?: string;
  tipo: string;
}

interface BuscadorPersonasProps {
  onSelect: (cliente: Cliente) => void;
  onRegistroNuevo?: (nombre: string) => void;
}

export default function BuscadorPersonas({ onSelect, onRegistroNuevo }: BuscadorPersonasProps) {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setClientes([]);
      setMostrarLista(false);
      return;
    }

    const timer = setTimeout(() => {
      buscarClientes();
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda]);

  async function buscarClientes() {
    try {
      setCargando(true);
      const resultado = await api.get(`/clientes/buscar?q=${encodeURIComponent(busqueda)}`);
      setClientes(resultado || []);
      setMostrarLista(true);
    } catch (error) {
      console.error("Error al buscar clientes:", error);
      setClientes([]);
    } finally {
      setCargando(false);
    }
  }

  function seleccionarCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    setBusqueda(cliente.nombre);
    setMostrarLista(false);
    onSelect(cliente);
  }

  function registrarNueva() {
    if (busqueda.trim().length < 3) {
      alert("Ingresa un nombre válido (mínimo 3 caracteres)");
      return;
    }
    if (onRegistroNuevo) {
      onRegistroNuevo(busqueda);
      setBusqueda("");
      setClienteSeleccionado(null);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #ddd",
    fontSize: "0.95rem",
    boxSizing: "border-box" as const,
  };

  const btnStyle = (color: string) => ({
    padding: "0.5rem 1rem",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  });

  return (
    <div style={{ position: "relative" }}>
      <label style={{ fontSize: "0.8rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
        Cliente / Persona
      </label>
      <input
        style={inputStyle}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setClienteSeleccionado(null);
        }}
        placeholder="Buscar por nombre..."
        onFocus={() => busqueda.trim().length >= 2 && setMostrarLista(true)}
      />

      {cargando && (
        <div style={{ marginTop: "0.5rem", color: "#2196F3", fontSize: "0.85rem" }}>
          ⏳ Buscando...
        </div>
      )}

      {mostrarLista && !cargando && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            marginTop: "0.25rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {clientes.length > 0 ? (
            <>
              {clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  onClick={() => seleccionarCliente(cliente)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                    {cliente.nombre}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    {cliente.ci ? `CI: ${cliente.ci}` : "Sin CI"} • {cliente.tipo}
                  </div>
                </div>
              ))}
              {busqueda.trim().length >= 3 && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderTop: "1px solid #e0e0e0",
                    background: "#f9f9f9",
                  }}
                >
                  <button
                    onClick={registrarNueva}
                    style={{
                      ...btnStyle("#FF9800"),
                      width: "100%",
                    }}
                  >
                    ➕ Registrar como nuevo cliente
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: "1rem", textAlign: "center", color: "#aaa" }}>
              <p style={{ margin: "0.5rem 0" }}>No se encontraron resultados</p>
              {busqueda.trim().length >= 3 && (
                <button
                  onClick={registrarNueva}
                  style={{
                    ...btnStyle("#FF9800"),
                    width: "100%",
                    marginTop: "0.5rem",
                  }}
                >
                  ➕ Registrar como nuevo cliente
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {clienteSeleccionado && (
        <div
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 0.75rem",
            background: "#e8f5e9",
            borderRadius: "4px",
            fontSize: "0.85rem",
            color: "#2e7d32",
          }}
        >
          ✅ {clienteSeleccionado.nombre} ({clienteSeleccionado.tipo})
        </div>
      )}
    </div>
  );
}
