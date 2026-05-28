import { useState } from "react";

interface FiltrosItemsProps {
  items: any[];
  categorias: any[];
  onFiltrar: (itemsFiltrados: any[]) => void;
}

export default function FiltrosItems({ items, categorias, onFiltrar }: FiltrosItemsProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");

  function aplicarFiltros() {
    let resultado = items;
    console.log("Filtrando con categoria_id:", filtroCategoria, "items:", items.length);
    if (filtroCategoria) {
      resultado = resultado.filter(i => i.categoria_id === filtroCategoria);
    }

    if (busqueda) {
      resultado = resultado.filter(i => i.nombre.toUpperCase().includes(busqueda.toUpperCase()));
    }

    onFiltrar(resultado);
  }

  const handleFiltroCategoria = (val: number | null) => {
    setFiltroCategoria(val);
    setTimeout(aplicarFiltros, 0);
  };

  const handleBusqueda = (val: string) => {
    setBusqueda(val);
    setTimeout(aplicarFiltros, 0);
  };

  const limpiarFiltros = () => {
    setFiltroCategoria(null);
    setBusqueda("");
    onFiltrar(items);
  };

  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const btnStyle = { padding: "0.5rem 1rem", background: "#999", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" };

  return (
    <div style={{ background: "#f0f0f0", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
      <div>
        <label style={{ fontSize: "0.8rem", color: "#666" }}>🔍 BUSCAR POR NOMBRE</label>
        <input style={inputStyle} value={busqueda} onChange={e => handleBusqueda(e.target.value)} placeholder="BUSCAR..." />
      </div>
      <div>
        <label style={{ fontSize: "0.8rem", color: "#666" }}>🗂 FILTRAR CATEGORÍA</label>
        <select style={inputStyle} value={filtroCategoria || ""} onChange={e => handleFiltroCategoria(e.target.value ? Number(e.target.value) : null)}>
          <option value="">TODAS</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <button style={btnStyle} onClick={limpiarFiltros}>LIMPIAR FILTROS</button>
      </div>
    </div>
  );
}
