# Implementación de Base de Datos de Personas - Caja ESFM

## ✅ Completado

### 1. Base de Datos
- **Tabla `personas`** creada en `worker/src/db/schema.ts`
  - Campos: id, nombre, ci (único), tipo, activo, created_at
  - Tipos: ESTUDIANTE, PERSONAL
  - Soft delete implementado (activo = 0)

### 2. Backend - Endpoints API (`/api/personas`)

#### GET `/buscar?q=<texto>`
- Busca personas por nombre
- Mínimo 2 caracteres
- Retorna máximo 20 resultados
- Ejemplo: `/api/personas/buscar?q=juan`

#### GET `/`
- Obtiene todas las personas activas
- Ordenadas por nombre

#### GET `/:id`
- Obtiene una persona específica

#### POST `/`
- Crea nueva persona
- Campos requeridos: nombre, ci, tipo
- Valida duplicados por CI
- Convierte nombre a MAYÚSCULAS

#### PUT `/:id`
- Actualiza persona existente

#### DELETE `/:id`
- Soft delete (marca como inactivo)

#### POST `/importar/backup`
- Importa masivamente desde backup
- Recibe array de personas
- Retorna: { success, insertados, duplicados, total }

### 3. Frontend - Componentes

#### `BuscadorPersonas.tsx`
- Componente reutilizable para buscar personas
- Búsqueda en tiempo real (debounce 300ms)
- Muestra lista de coincidencias
- Opción para registrar nueva persona
- Props:
  - `onSelect(persona)` - callback al seleccionar
  - `onRegistroNuevo(nombre)` - callback para registrar nueva

#### `Ventas.tsx` (Actualizado)
- Integra BuscadorPersonas
- Reemplaza búsqueda de clientes por búsqueda de personas
- Permite registrar nuevas personas en tiempo real
- Solicita CI y tipo (Estudiante/Personal) al registrar

## 📋 Próximos Pasos

### 1. Migrar datos del backup
```bash
# Ejecutar script para procesar backup
node scripts/migrate-personas.ts

# Esto genera: personas-import.json
```

### 2. Importar personas a la BD
```javascript
// Desde el frontend o postman:
POST /api/personas/importar/backup
Body: (contenido de personas-import.json)
```

### 3. Verificar datos
```javascript
// Verificar cantidad de personas
GET /api/personas

// Buscar específica
GET /api/personas/buscar?q=juan
```

## 🔧 Configuración Requerida

### Variables de Entorno
- `DB` - Conexión a base de datos (ya configurada)

### Dependencias
- Hono (ya instalado)
- @vlcn.io/crsqlite-wasm (ya instalado)

## 📊 Estructura de Datos

### Tabla personas
```sql
CREATE TABLE personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ci TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,  -- 'ESTUDIANTE' o 'PERSONAL'
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Ejemplo de datos
```json
{
  "id": 1,
  "nombre": "JUAN CARLOS PEREZ GARCIA",
  "ci": "12345678",
  "tipo": "ESTUDIANTE",
  "activo": 1,
  "created_at": "2026-04-21T10:30:00"
}
```

## 🎯 Flujo de Uso en Punto de Venta

1. Usuario abre Punto de Venta
2. Escribe nombre en campo "Persona"
3. Sistema busca coincidencias en tiempo real
4. Usuario selecciona de la lista
5. Si no existe, puede registrar nueva:
   - Ingresa nombre
   - Sistema solicita CI
   - Sistema solicita tipo (Estudiante/Personal)
   - Se registra automáticamente
6. Continúa con la venta normalmente

## 📝 Notas Importantes

- Todos los nombres se guardan en MAYÚSCULAS
- CI es único (no permite duplicados)
- Búsqueda es case-insensitive
- Soft delete permite recuperar datos si es necesario
- Máximo 20 resultados en búsqueda (optimización)
- Debounce de 300ms en búsqueda (evita sobrecarga)

## 🚀 Despliegue

1. Actualizar schema en BD (crear tabla personas)
2. Registrar ruta en worker/src/index.ts ✅
3. Compilar y desplegar worker
4. Compilar y desplegar frontend
5. Ejecutar migración de datos
6. Importar personas al sistema

## ✨ Características Adicionales

- Búsqueda con debounce automático
- Validación de campos requeridos
- Manejo de errores con mensajes claros
- Interfaz intuitiva con feedback visual
- Opción de registrar nuevas personas sin salir del flujo
- Soft delete para auditoría
