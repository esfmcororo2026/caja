# 🎯 Guía de Implementación - Base de Datos de Personas

## 📋 Resumen

Se ha implementado un sistema completo de gestión de personas (estudiantes y personal) para el Punto de Venta de Caja ESFM. El sistema permite:

- ✅ Buscar personas registradas por nombre
- ✅ Seleccionar de una lista de coincidencias
- ✅ Registrar nuevas personas en tiempo real
- ✅ Importar masivamente desde el backup (342 estudiantes + 37 personal)

---

## 🔧 Paso 1: Actualizar la Base de Datos

### Archivo modificado: `worker/src/db/schema.ts`

Se agregó la tabla `personas`:

```sql
CREATE TABLE IF NOT EXISTS personas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ci TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Campos:**
- `id`: Identificador único
- `nombre`: Nombre completo (en MAYÚSCULAS)
- `ci`: Cédula de identidad (único)
- `tipo`: ESTUDIANTE o PERSONAL
- `activo`: 1 = activo, 0 = eliminado (soft delete)
- `created_at`: Fecha de creación

---

## 🚀 Paso 2: Desplegar el Backend

### Archivos creados/modificados:

1. **`worker/src/routes/personas.ts`** (NUEVO)
   - Endpoints CRUD para personas
   - Búsqueda con filtro
   - Importación masiva

2. **`worker/src/index.ts`** (MODIFICADO)
   - Registra ruta `/api/personas`

### Endpoints disponibles:

```
GET    /api/personas/buscar?q=<texto>     # Buscar por nombre
GET    /api/personas                       # Obtener todas
GET    /api/personas/:id                   # Obtener una
POST   /api/personas                       # Crear nueva
PUT    /api/personas/:id                   # Actualizar
DELETE /api/personas/:id                   # Eliminar (soft)
POST   /api/personas/importar/backup       # Importar masivo
```

---

## 🎨 Paso 3: Actualizar el Frontend

### Archivos creados/modificados:

1. **`frontend/src/components/ventas/BuscadorPersonas.tsx`** (NUEVO)
   - Componente de búsqueda reutilizable
   - Búsqueda en tiempo real
   - Opción para registrar nuevas personas

2. **`frontend/src/components/ventas/Ventas.tsx`** (MODIFICADO)
   - Integra BuscadorPersonas
   - Reemplaza búsqueda de clientes
   - Permite registrar personas al vender

---

## 📊 Paso 4: Importar Datos del Backup

### Opción A: Usar el script (Recomendado)

```bash
# 1. Procesar el backup
node scripts/process-backup.js

# Esto genera: personas-import.json
```

### Opción B: Manual

```bash
# Copiar el contenido del backup y procesarlo manualmente
```

---

## 💾 Paso 5: Importar Personas a la BD

### Usando Postman o curl:

```bash
# 1. Leer el archivo generado
cat personas-import.json

# 2. Hacer POST a la API
curl -X POST http://localhost:8787/api/personas/importar/backup \
  -H "Content-Type: application/json" \
  -d @personas-import.json
```

### Respuesta esperada:

```json
{
  "success": true,
  "insertados": 379,
  "duplicados": 0,
  "total": 379
}
```

---

## ✅ Paso 6: Verificar la Importación

### Verificar cantidad total:

```bash
curl http://localhost:8787/api/personas
```

### Buscar una persona específica:

```bash
curl "http://localhost:8787/api/personas/buscar?q=juan"
```

---

## 🎯 Paso 7: Usar en Punto de Venta

### Flujo de usuario:

1. Abrir **Punto de Venta**
2. En el campo "Persona", escribir nombre o CI
3. Sistema busca automáticamente
4. Seleccionar de la lista
5. Si no existe, opción para registrar:
   - Ingresa nombre
   - Sistema solicita CI
   - Sistema solicita tipo (Estudiante/Personal)
   - Se registra automáticamente
6. Continuar con la venta

---

## 📝 Estructura de Datos

### Ejemplo de persona:

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

### Tipos válidos:

- `ESTUDIANTE` - Para estudiantes
- `PERSONAL` - Para personal administrativo/docente

---

## 🔍 Búsqueda

### Características:

- ✅ Búsqueda por nombre (case-insensitive)
- ✅ Búsqueda por CI
- ✅ Mínimo 2 caracteres
- ✅ Máximo 20 resultados
- ✅ Debounce de 300ms (evita sobrecarga)
- ✅ Ordenado alfabéticamente

### Ejemplos:

```
"juan"        → Busca todos con "juan" en el nombre
"12345"       → Busca por CI
"perez"       → Busca por apellido
```

---

## 🛡️ Seguridad

- ✅ CI único (no permite duplicados)
- ✅ Soft delete (datos recuperables)
- ✅ Validación de campos requeridos
- ✅ Conversión a MAYÚSCULAS (normalización)
- ✅ Autenticación requerida (heredada del sistema)

---

## 📊 Estadísticas del Backup

- **Estudiantes**: 342
- **Personal**: 37
- **Total**: 379 personas
- **Campos utilizados**: nombre, apellido_paterno, apellido_materno, dni

---

## 🐛 Troubleshooting

### Error: "Tabla personas no existe"
- Solución: Ejecutar migración de schema en la BD

### Error: "CI duplicado"
- Solución: Verificar que no exista la persona en la BD

### Búsqueda no retorna resultados
- Solución: Verificar que se escriban mínimo 2 caracteres

### No se importan datos
- Solución: Verificar que el archivo personas-import.json sea válido JSON

---

## 📞 Soporte

Para más información, revisar:
- `IMPLEMENTACION_PERSONAS.md` - Detalles técnicos
- `worker/src/routes/personas.ts` - Código de endpoints
- `frontend/src/components/ventas/BuscadorPersonas.tsx` - Componente de búsqueda

---

## ✨ Próximas Mejoras (Opcional)

- [ ] Exportar personas a CSV
- [ ] Editar personas desde Punto de Venta
- [ ] Historial de ventas por persona
- [ ] Reportes por tipo de persona
- [ ] Sincronización con sistema de asistencia
