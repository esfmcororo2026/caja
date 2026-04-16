# Inicializar la BD de Turso con el schema
# Ejecutar UNA sola vez: POST https://caja-worker.<tu-subdominio>.workers.dev/api/auth/init

## Endpoints disponibles

### Auth
POST /api/auth/init         → Inicializa la BD (solo primera vez)
POST /api/auth/login        → { email, password } → { token, usuario }

### Catálogo
GET  /api/catalogo/categorias
POST /api/catalogo/categorias       → { nombre, descripcion }
PUT  /api/catalogo/categorias/:id
DEL  /api/catalogo/categorias/:id

GET  /api/catalogo/items
POST /api/catalogo/items            → { nombre, categoria_id, precio, unidad_id, tiene_stock, stock_actual }
PUT  /api/catalogo/items/:id
DEL  /api/catalogo/items/:id

GET  /api/catalogo/unidades
POST /api/catalogo/unidades         → { nombre, abreviatura }

### Ventas
GET  /api/ventas?desde=&hasta=
POST /api/ventas                    → { cliente_id, usuario_id, total, detalle: [...] }
GET  /api/ventas/clientes
POST /api/ventas/clientes           → { nombre, ci, tipo }
POST /api/ventas/clientes/bulk      → { clientes: [...] }

### Inventario
GET  /api/inventario/stock
GET  /api/inventario/movimientos?desde=&hasta=&item_id=
POST /api/inventario/movimientos    → { item_id, tipo, cantidad, motivo, usuario_id }

### Reportes & Caja
GET  /api/reportes/ventas?desde=&hasta=
GET  /api/reportes/ventas/detalle?desde=&hasta=
POST /api/reportes/caja/abrir       → { usuario_id, monto_apertura }
POST /api/reportes/caja/cerrar      → { caja_sesion_id, monto_cierre, denominaciones: [...] }
GET  /api/reportes/caja/:id

### Sync offline
POST /api/sync                      → { operaciones: [{ id, sql, args }] }
