# 🚀 Referencia Rápida - Personas

## 📊 Tabla

```sql
CREATE TABLE personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ci TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## 🔌 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/personas/buscar?q=<texto>` | Buscar por nombre |
| GET | `/api/personas` | Obtener todas |
| GET | `/api/personas/:id` | Obtener una |
| POST | `/api/personas` | Crear nueva |
| PUT | `/api/personas/:id` | Actualizar |
| DELETE | `/api/personas/:id` | Eliminar (soft) |
| POST | `/api/personas/importar/backup` | Importar masivo |

## 📝 Ejemplos

### Crear
```bash
curl -X POST http://localhost:8787/api/personas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "JUAN CARLOS PEREZ",
    "ci": "12345678",
    "tipo": "ESTUDIANTE"
  }'
```

### Buscar
```bash
curl "http://localhost:8787/api/personas/buscar?q=juan"
```

### Importar
```bash
curl -X POST http://localhost:8787/api/personas/importar/backup \
  -H "Content-Type: application/json" \
  -d @personas-import.json
```

## 🎨 Componente

```jsx
<BuscadorPersonas
  onSelect={(persona) => console.log(persona)}
  onRegistroNuevo={(nombre) => registrarPersona(nombre)}
/>
```

## 📊 Datos

- Estudiantes: 342
- Personal: 37
- Total: 379

## 🔑 Campos

- `nombre`: Texto (MAYÚSCULAS)
- `ci`: Texto (ÚNICO)
- `tipo`: ESTUDIANTE | PERSONAL
- `activo`: 1 (activo) | 0 (inactivo)

## ⚙️ Configuración

- Búsqueda: Mínimo 2 caracteres
- Resultados: Máximo 20
- Debounce: 300ms
- Ordenamiento: Alfabético

## 📁 Archivos

- Backend: `worker/src/routes/personas.ts`
- Frontend: `frontend/src/components/ventas/BuscadorPersonas.tsx`
- Script: `scripts/process-backup.js`

## 🚀 Deploy

```bash
# Backend
npm run deploy:worker

# Frontend
npm run deploy:frontend

# Procesar backup
node scripts/process-backup.js

# Importar
curl -X POST http://localhost:8787/api/personas/importar/backup \
  -H "Content-Type: application/json" \
  -d @personas-import.json
```

## ✅ Verificar

```bash
# Cantidad total
curl http://localhost:8787/api/personas | jq 'length'

# Buscar específica
curl "http://localhost:8787/api/personas/buscar?q=juan"
```
