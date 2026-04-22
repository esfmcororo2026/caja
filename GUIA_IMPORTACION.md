# 📥 Guía de Importación de Clientes

## ✅ Archivo Generado

El archivo `clientes-import.json` ha sido generado exitosamente con:
- **Estudiantes**: 341
- **Personal**: 37
- **Total**: 378 clientes

## 🚀 Opción 1: Usar la Herramienta HTML (Recomendado)

### Paso 1: Abrir la herramienta
```
Abre el archivo: importador-clientes.html
en tu navegador
```

### Paso 2: Configurar
1. Ingresa la URL de tu API (ej: `https://tu-worker.workers.dev`)
2. Ingresa tu token si es requerido
3. Haz clic en "📂 Cargar archivo"
4. Selecciona `clientes-import.json`

### Paso 3: Importar
1. Haz clic en "✅ Importar Clientes"
2. Espera a que se complete la importación
3. Verás el resultado con cantidad de registros insertados

---

## 🔧 Opción 2: Usar cURL (Línea de Comandos)

### Paso 1: Asegúrate de tener el archivo
```bash
ls -lh clientes-import.json
```

### Paso 2: Ejecutar importación
```bash
curl -X POST https://tu-worker.workers.dev/api/clientes/importar/backup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d @clientes-import.json
```

### Respuesta esperada:
```json
{
  "success": true,
  "insertados": 378,
  "duplicados": 0,
  "total": 378
}
```

---

## 🔍 Opción 3: Usar Postman

### Paso 1: Crear nueva solicitud
- Tipo: **POST**
- URL: `https://tu-worker.workers.dev/api/clientes/importar/backup`

### Paso 2: Headers
```
Content-Type: application/json
Authorization: Bearer TU_TOKEN_AQUI
```

### Paso 3: Body
- Selecciona: **raw** → **JSON**
- Copia el contenido de `clientes-import.json`
- Pega en el body

### Paso 4: Enviar
- Haz clic en **Send**
- Verifica la respuesta

---

## ✅ Verificar Importación

### Opción 1: Desde el navegador
```
GET https://tu-worker.workers.dev/api/clientes
```

### Opción 2: Desde cURL
```bash
curl https://tu-worker.workers.dev/api/clientes \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Opción 3: Desde Turso CLI
```bash
turso db shell <database-name>
SELECT COUNT(*) FROM clientes;
```

---

## 📊 Estructura de Datos Importados

Cada cliente tiene:
```json
{
  "nombre": "JUAN CARLOS PEREZ GARCIA",
  "ci": "12345678",
  "tipo": "ESTUDIANTE"
}
```

**Tipos disponibles:**
- `ESTUDIANTE` - 341 registros
- `PERSONAL` - 37 registros

---

## 🐛 Solución de Problemas

### Error: "Se requiere un array de clientes"
- Verifica que el archivo JSON sea válido
- Asegúrate de enviar un array, no un objeto

### Error: "Mínimo 2 caracteres"
- Este error es para búsqueda, no para importación
- Verifica que estés usando el endpoint correcto: `/api/clientes/importar/backup`

### Error: "Duplicados encontrados"
- Significa que algunos clientes ya existen en la BD
- El sistema no los importará de nuevo
- Verifica el campo `duplicados` en la respuesta

### Error de autenticación
- Verifica que tu token sea válido
- Asegúrate de incluir el header `Authorization: Bearer TOKEN`

---

## 📝 Notas Importantes

1. **CI es opcional**: Algunos clientes pueden no tener CI
2. **Nombres en MAYÚSCULAS**: Todos los nombres se guardan en mayúsculas
3. **Soft Delete**: Los clientes eliminados se marcan como inactivos, no se borran
4. **Búsqueda**: Mínimo 2 caracteres, máximo 20 resultados
5. **Importación**: Solo importa clientes nuevos, no duplicados

---

## 🎯 Próximos Pasos

1. ✅ Importar clientes
2. ✅ Verificar en Turso
3. ✅ Probar búsqueda en Punto de Venta
4. ✅ Registrar nuevos clientes si es necesario

---

**¿Necesitas ayuda?**
- Verifica que el worker esté desplegado
- Verifica que la tabla `clientes` exista en Turso
- Verifica que tengas permisos de escritura en la BD
