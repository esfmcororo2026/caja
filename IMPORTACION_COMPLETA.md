# 📥 Guía Completa de Importación de Clientes

## 📊 Estado Actual

✅ Archivo generado: `clientes-import.json`
- **Estudiantes**: 341
- **Personal**: 37
- **Total**: 378 clientes

---

## 🚀 Opción 1: Usar Script Bash (Recomendado)

### Requisitos
- bash
- curl

### Pasos

1. **Obtén tu URL de API**
   ```
   https://tu-proyecto.workers.dev
   ```

2. **Ejecuta el script**
   ```bash
   ./importar-clientes.sh https://tu-proyecto.workers.dev
   ```

3. **Con token (si es requerido)**
   ```bash
   ./importar-clientes.sh https://tu-proyecto.workers.dev "tu-token-jwt"
   ```

### Ejemplo de respuesta exitosa
```json
{
  "success": true,
  "insertados": 378,
  "duplicados": 0,
  "total": 378
}
```

---

## 🌐 Opción 2: Usar Herramienta HTML

### Pasos

1. **Abre el archivo**
   ```
   importador-clientes.html
   ```

2. **En el navegador**
   - Ingresa tu URL de API
   - Ingresa token si es requerido
   - Haz clic en "📂 Cargar archivo"
   - Selecciona `clientes-import.json`
   - Haz clic en "✅ Importar Clientes"

3. **Verifica el resultado**
   - Deberías ver un mensaje de éxito
   - Con cantidad de registros importados

---

## 📋 Opción 3: Usar cURL Directamente

### Comando básico
```bash
curl -X POST https://tu-proyecto.workers.dev/api/clientes/importar/backup \
  -H "Content-Type: application/json" \
  -d @clientes-import.json
```

### Con token
```bash
curl -X POST https://tu-proyecto.workers.dev/api/clientes/importar/backup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d @clientes-import.json
```

### Con archivo grande (si es necesario)
```bash
curl -X POST https://tu-proyecto.workers.dev/api/clientes/importar/backup \
  -H "Content-Type: application/json" \
  --data-binary @clientes-import.json
```

---

## 🐍 Opción 4: Usar Script Python (Turso Directo)

### Requisitos
```bash
pip install libsql-client
```

### Pasos

1. **Obtén tus credenciales de Turso**
   ```bash
   turso db show tu-base-datos --expand
   ```

2. **Ejecuta el script**
   ```bash
   python3 importar-turso.py "libsql://tu-db-xxxxx.turso.io" "tu-token-aqui"
   ```

---

## 📮 Opción 5: Usar Postman

### Paso 1: Crear solicitud
- **Tipo**: POST
- **URL**: `https://tu-proyecto.workers.dev/api/clientes/importar/backup`

### Paso 2: Headers
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

### Paso 3: Body
- Selecciona: **raw** → **JSON**
- Copia contenido de `clientes-import.json`
- Pega en el body

### Paso 4: Enviar
- Haz clic en **Send**
- Verifica la respuesta

---

## ✅ Verificar Importación

### Opción 1: Desde API
```bash
curl https://tu-proyecto.workers.dev/api/clientes
```

### Opción 2: Desde Turso CLI
```bash
turso db shell tu-base-datos
SELECT COUNT(*) FROM clientes;
SELECT * FROM clientes LIMIT 5;
```

### Opción 3: Desde Turso Studio
1. Abre https://studio.turso.io
2. Selecciona tu base de datos
3. Ejecuta: `SELECT COUNT(*) FROM clientes;`

---

## 🔍 Estructura de Datos

### Tabla: clientes
```sql
CREATE TABLE clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  ci TEXT,
  tipo TEXT DEFAULT 'otro',
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Ejemplo de registro
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

---

## 🐛 Solución de Problemas

### Error: "Connection refused"
- Verifica que tu API esté desplegada
- Verifica que la URL sea correcta
- Espera unos segundos y reintentar

### Error: "Unauthorized"
- Verifica que tu token sea válido
- Verifica que incluyas el header `Authorization: Bearer TOKEN`

### Error: "Table clientes does not exist"
- Verifica que el schema esté actualizado
- Redeploy el worker

### Error: "Se requiere un array de clientes"
- Verifica que el archivo JSON sea válido
- Verifica que sea un array, no un objeto

### Importación lenta
- Es normal para 378 registros
- Espera a que se complete
- No cierres la ventana/terminal

---

## 📊 Estadísticas Esperadas

Después de importar exitosamente:

```sql
SELECT COUNT(*) as total FROM clientes;
-- Resultado: 378

SELECT tipo, COUNT(*) as cantidad FROM clientes GROUP BY tipo;
-- Resultado:
-- ESTUDIANTE | 341
-- PERSONAL   | 37

SELECT COUNT(DISTINCT ci) FROM clientes;
-- Resultado: 378 (todos tienen CI único)
```

---

## 🎯 Próximos Pasos

1. ✅ Importar clientes (elige una opción arriba)
2. ✅ Verificar en Turso
3. ✅ Probar búsqueda en Punto de Venta
4. ✅ Registrar nuevos clientes si es necesario

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que el worker esté desplegado
2. Verifica que la tabla `clientes` exista
3. Verifica que tengas permisos de escritura
4. Revisa los logs del worker en Cloudflare Dashboard
5. Intenta con una de las otras opciones

---

**¿Cuál opción prefieres usar?**
- Opción 1: Script Bash (más fácil)
- Opción 2: HTML (visual)
- Opción 3: cURL (simple)
- Opción 4: Python (directo a Turso)
- Opción 5: Postman (interfaz gráfica)
