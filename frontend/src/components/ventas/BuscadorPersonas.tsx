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
}

const CACHE_KEY = "caja_clientes_cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

function getCache(): { [key: string]: { clientes: Cliente[]; timestamp: number } } {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: { [key: string]: { clientes: Cliente[]; timestamp: number } }) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    console.warn("No se pudo guardar caché en localStorage");
  }
}

export default function BuscadorPersonas({ onSelect }: BuscadorPersonasProps) {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCi, setNuevoCi] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("ESTUDIANTE");
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    if (clienteSeleccionado) return;

    if (busqueda.trim().length < 2) {
      setClientes([]);
      setMostrarLista(false);
      return;
    }

    const timer = setTimeout(() => {
      buscarClientes();
    }, 300);

    return () => clearTimeout(timer);
  }, [busqueda, clienteSeleccionado]);

  async function buscarClientes() {
    const query = busqueda.trim().toLowerCase();
    const cache = getCache();
    const now = Date.now();

    // Verificar si hay caché válido
    if (cache[query] && now - cache[query].timestamp < CACHE_EXPIRY) {
      setClientes(cache[query].clientes);
      setMostrarLista(true);
      return;
    }

    try {
      setCargando(true);
      const resultado = await api.get(`/clientes/buscar?q=${encodeURIComponent(busqueda)}`);
      const clientesData = Array.isArray(resultado) ? resultado : [];
      
      // Guardar en caché
      cache[query] = { clientes: clientesData, timestamp: now };
      saveCache(cache);
      
      setClientes(clientesData);
      setMostrarLista(true);
    } catch (error: any) {
      console.error("Error al buscar clientes:", error);
      setClientes([]);
      setMostrarLista(true);
    } finally {
      setCargando(false);
    }
  }

  function seleccionarCliente(cliente: Cliente) {
    setClienteSeleccionado(cliente);
    setBusqueda("");
    setMostrarLista(false);
    setClientes([]);
    onSelect(cliente);
  }

  function limpiarSeleccion() {
    setClienteSeleccionado(null);
    setBusqueda("");
    setClientes([]);
    setMostrarLista(false);
  }

  function abrirModalRegistro() {
    if (busqueda.trim().length < 3) {
      alert("Ingresa un nombre válido (mínimo 3 caracteres)");
      return;
    }
    setNuevoNombre(busqueda.toUpperCase());
    setNuevoCi("");
    setNuevoTipo("ESTUDIANTE");
    setErrorModal("");
    setMostrarModal(true);
  }

  async function guardarNuevoCliente() {
    if (!nuevoNombre.trim()) {
      setErrorModal("El nombre es obligatorio");
      return;
    }

    try {
      setGuardando(true);
      setErrorModal("");
      const nuevoCliente = await api.post("/clientes", {
        nombre: nuevoNombre.toUpperCase(),
        ci: nuevoCi.trim() || null,
        tipo: nuevoTipo,
      });

      // Limpiar caché para que se recargue con el nuevo cliente
      const cache = getCache();
      Object.keys(cache).forEach(key => delete cache[key]);
      saveCache(cache);

      seleccionarCliente(nuevoCliente);
      setMostrarModal(false);
    } catch (error: any) {
      console.error("Error al registrar cliente:", error);
      
      if (error.status === 409) {
        setErrorModal(error.message || "Este cliente ya existe");
      } else {
        setErrorModal(error.message || "Error al registrar el cliente");
      }
    } finally {
      setGuardando(false);
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

      {clienteSeleccionado ? (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              padding: "0.75rem",
              background: "#e8f5e9",
              border: "2px solid #4CAF50",
              borderRadius: "6px",
              fontSize: "0.95rem",
            }}
          >
            <div style={{ fontWeight: "bold", color: "#2e7d32", marginBottom: "0.2rem" }}>
              {clienteSeleccionado.nombre}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#558b2f" }}>
              {clienteSeleccionado.ci ? `CI: ${clienteSeleccionado.ci}` : "Sin CI"} • {clienteSeleccionado.tipo}
            </div>
          </div>
          <button
            onClick={limpiarSeleccion}
            style={{
              padding: "0.6rem 0.8rem",
              background: "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              minWidth: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Cambiar cliente"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          <input
            style={{
              ...inputStyle,
              borderColor: mostrarLista ? "#2196F3" : "#ddd",
            }}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
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
                </>
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", color: "#aaa" }}>
                  <p style={{ margin: "0.5rem 0" }}>No se encontraron resultados</p>
                  {busqueda.trim().length >= 3 && (
                    <button
                      onClick={abrirModalRegistro}
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
        </>
      )}

      {mostrarModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => !guardando && setMostrarModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.3rem", color: "#333" }}>
              Registrar nuevo cliente
            </h2>

            {errorModal && (
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  background: "#ffebee",
                  border: "1px solid #ef5350",
                  borderRadius: "4px",
                  color: "#c62828",
                  fontSize: "0.85rem",
                }}
              >
                ⚠️ {errorModal}
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
                Nombre *
              </label>
              <input
                style={inputStyle}
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value.toUpperCase())}
                placeholder="Nombre del cliente"
                disabled={guardando}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
                CI (opcional)
              </label>
              <input
                style={inputStyle}
                value={nuevoCi}
                onChange={(e) => setNuevoCi(e.target.value)}
                placeholder="Número de cédula"
                disabled={guardando}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.85rem", color: "#666", display: "block", marginBottom: "0.4rem" }}>
                Tipo de cliente
              </label>
              <select
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                }}
                value={nuevoTipo}
                onChange={(e) => setNuevoTipo(e.target.value)}
                disabled={guardando}
              >
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="PERSONAL">Personal</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setMostrarModal(false)}
                style={{
                  ...btnStyle("#999"),
                  opacity: guardando ? 0.6 : 1,
                }}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={guardarNuevoCliente}
                style={{
                  ...btnStyle("#4CAF50"),
                  opacity: guardando ? 0.6 : 1,
                }}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
