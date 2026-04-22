#!/bin/bash

# Script para importar clientes a Turso DB
# Uso: ./importar-clientes.sh <API_URL> [TOKEN]

API_URL="${1:-https://tu-worker.workers.dev}"
TOKEN="${2:-}"

if [ -z "$API_URL" ]; then
    echo "❌ Error: Debes proporcionar la URL de la API"
    echo "Uso: ./importar-clientes.sh <API_URL> [TOKEN]"
    echo "Ejemplo: ./importar-clientes.sh https://mi-worker.workers.dev"
    exit 1
fi

echo "📥 Iniciando importación de clientes..."
echo "🔗 API URL: $API_URL"
echo "📊 Archivo: clientes-import.json"
echo ""

# Preparar headers
HEADERS="-H 'Content-Type: application/json'"
if [ -n "$TOKEN" ]; then
    HEADERS="$HEADERS -H 'Authorization: Bearer $TOKEN'"
    echo "🔐 Usando token de autenticación"
fi

# Hacer la importación
echo "⏳ Enviando solicitud..."
RESPONSE=$(curl -s -X POST "$API_URL/api/clientes/importar/backup" \
    -H "Content-Type: application/json" \
    $([ -n "$TOKEN" ] && echo "-H 'Authorization: Bearer $TOKEN'") \
    -d @clientes-import.json)

echo ""
echo "📋 Respuesta del servidor:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Verificar si fue exitoso
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ Importación completada exitosamente!"
    
    # Extraer números
    INSERTADOS=$(echo "$RESPONSE" | grep -o '"insertados":[0-9]*' | grep -o '[0-9]*')
    DUPLICADOS=$(echo "$RESPONSE" | grep -o '"duplicados":[0-9]*' | grep -o '[0-9]*')
    
    echo "   📊 Insertados: $INSERTADOS"
    echo "   ⚠️  Duplicados: $DUPLICADOS"
else
    echo ""
    echo "❌ Error en la importación"
fi
