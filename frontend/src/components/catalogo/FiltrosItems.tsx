import { useState } from "react";

interface FiltrosItemsProps {
  items: any[];
  categorias: any[];
  codigos: any[];
  onFiltrar: (itemsFiltrados: any[]) => void;
}

export default function FiltrosItems({ items, categorias, codigos, onFiltrar }: FiltrosItemsProps) {
  const [filtroCategoria, setFiltroCategoria] = useState<number | null>(null);
  const [filtroCodigo, setFiltroCodigo] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [ordenar, setOrdenar] = useState<"nombre" | "precio_asc" | "precio_desc" | "stock_asc" | "stock_desc">("nombre");

  function aplicarFiltros() {
    let resultado = items;

    if (filtroCategoria) {
      resultado = resultado.filter(i => i.categoria_id === filtroCategoria);
    }

    if (filtroCodigo) {
      resultado = resultado.filter(i => i.codigo_id === filtroCodigo);
    }

    if (busqueda) {
      resultado = resultado.filter(i => i.nombre.toUpperCase().includes(busqueda.toUpperCase()));
    }

    if (ordenar === "precio_asc") {
      resultado.sort((a, b) => a.precio - b.precio);
    } else if (ordenar === "precio_desc") {
      resultado.sort((a, b) => b.precio - a.precio);
    } else if (ordenar === "stock_asc") {
      resultado.sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0));
    } else if (ordenar === "stock_desc") {
      resultado.sort((a, b) => (b.stock_actual || 0) - (a.stock_actual || 0));
    }

    onFiltrar(resultado);
  }

  const handleFiltroCategoria = (val: number | null) => {
    setFiltroCategoria(val);
    setTimeout(aplicarFiltros, 0);
  };

  const handleFiltroCodigo = (val: number | null) => {
    setFiltroCodigo(val);
    setTimeout(aplicarFiltros, 0);
  };

  const handleBusqueda = (val: string) => {
    setBusqueda(val);
    setTimeout(aplicarFiltros, 0);
  };

  const handleOrdenar = (val: string) => {
    setOrdenar(val as any);
    setTimeout(aplicarFiltros, 0);
  };

  const limpiarFiltros = () => {
    setFiltroCategoria(null);
    setFiltroCodigo(null);
    setBusqueda("");
    setOrdenar("nombre");
    onFiltrar(items);
  };

  const inputStyle = { width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #ddd", fontSize: "0.95rem" };
  const btnStyle = { padding: "0.5rem 1rem", background: "#999", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" };

  return (
    <div style={{ background: "#f0f0f0", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
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
      <div>
        <label style={{ fontSize: "0.8rem", color: "#666" }}>📋 FILTRAR CÓDIGO</label>
        <select style={inputStyle} value={filtroCodigo || ""} onChange={e => handleFiltroCodigo(e.target.value ? Number(e.target.value) : null)}>
          <option value="">TODOS</option>
          {codigos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: "0.8rem", color: "#666" }}>📊 ORDENAR</label>
        <select style={inputStyle} value={ordenar} onChange={e => handleOrdenar(e.target.value)}>
          <option value="nombre">NOMBRE</option>
          <option value="precio_asc">PRECIO ↑</option>
          <option value="precio_desc">PRECIO ↓</option>
          <option value="stock_asc">STOCK ↑</option>
          <option value="stock_desc">STOCK ↓</option>
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <button style={btnStyle} onClick={limpiarFiltros}>LIMPIAR FILTROS</button>
      </div>
    </div>
  );
}
