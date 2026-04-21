export const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT DEFAULT 'cajero',
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ci TEXT,
  tipo TEXT DEFAULT 'otro',
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS unidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  abreviatura TEXT NOT NULL,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS codigos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tiene_numeracion INTEGER DEFAULT 0,
  tiene_precio INTEGER DEFAULT 1,
  tiene_stock INTEGER DEFAULT 1,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo_id INTEGER,
  categoria_id INTEGER NOT NULL,
  precio REAL NOT NULL,
  unidad_id INTEGER NOT NULL,
  tiene_stock INTEGER DEFAULT 1,
  stock_actual REAL DEFAULT 0,
  numeracion_inicio INTEGER,
  numeracion_fin INTEGER,
  numeracion_actual INTEGER,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (codigo_id) REFERENCES codigos(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (unidad_id) REFERENCES unidades(id)
);

CREATE TABLE IF NOT EXISTS precios_historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  precio_anterior REAL NOT NULL,
  precio_nuevo REAL NOT NULL,
  usuario_id INTEGER NOT NULL,
  fecha TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  usuario_id INTEGER NOT NULL,
  total REAL NOT NULL,
  estado TEXT DEFAULT 'sincronizado',
  fecha TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  cantidad REAL NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  unidad_id INTEGER NOT NULL,
  numeracion_desde INTEGER,
  numeracion_hasta INTEGER,
  FOREIGN KEY (venta_id) REFERENCES ventas(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (unidad_id) REFERENCES unidades(id)
);

CREATE TABLE IF NOT EXISTS caja_sesiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  fecha_apertura TEXT DEFAULT (datetime('now')),
  monto_apertura REAL NOT NULL,
  fecha_cierre TEXT,
  monto_cierre REAL,
  estado TEXT DEFAULT 'abierta',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS arqueo_denominaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caja_sesion_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  denominacion REAL NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (caja_sesion_id) REFERENCES caja_sesiones(id)
);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  cantidad REAL NOT NULL,
  motivo TEXT,
  usuario_id INTEGER NOT NULL,
  fecha TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tabla TEXT NOT NULL,
  operacion TEXT NOT NULL,
  datos_json TEXT NOT NULL,
  sincronizado INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`;
