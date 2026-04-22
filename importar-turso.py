#!/usr/bin/env python3
"""
Script para importar clientes directamente a Turso DB
Uso: python3 importar-turso.py <DATABASE_URL> <AUTH_TOKEN>
"""

import json
import sys
import sqlite3
from urllib.parse import urlparse

def importar_clientes(database_url, auth_token):
    """Importar clientes a Turso DB"""
    
    print("📥 Iniciando importación de clientes a Turso...")
    print(f"🔗 Database URL: {database_url}")
    
    # Leer archivo de clientes
    try:
        with open('clientes-import.json', 'r') as f:
            clientes = json.load(f)
        print(f"✅ Archivo cargado: {len(clientes)} clientes")
    except FileNotFoundError:
        print("❌ Error: No se encontró clientes-import.json")
        return False
    except json.JSONDecodeError:
        print("❌ Error: El archivo JSON no es válido")
        return False
    
    # Conectar a Turso
    try:
        # Turso usa libsql:// protocol
        # Convertir a sqlite3 connection
        print("🔌 Conectando a Turso...")
        
        # Para Turso, necesitamos usar la librería libsql-client
        # Si no está disponible, mostrar instrucciones
        try:
            import libsql_client
            client = libsql_client.create_client(
                url=database_url,
                auth_token=auth_token
            )
            print("✅ Conectado a Turso")
        except ImportError:
            print("⚠️  libsql-client no está instalado")
            print("Instala con: pip install libsql-client")
            print("\nAlternativa: Usa el script importar-clientes.sh con tu API URL")
            return False
        
        # Importar clientes
        insertados = 0
        duplicados = 0
        errores = 0
        
        print("\n📊 Importando clientes...")
        
        for i, cliente in enumerate(clientes, 1):
            try:
                nombre = cliente.get('nombre', '').upper()
                ci = cliente.get('ci')
                tipo = cliente.get('tipo', 'otro')
                
                if not nombre:
                    continue
                
                # Verificar si ya existe
                result = client.execute(
                    "SELECT id FROM clientes WHERE ci = ? AND activo = 1",
                    [ci] if ci else []
                )
                
                if not result.rows:
                    # Insertar
                    client.execute(
                        "INSERT INTO clientes (nombre, ci, tipo) VALUES (?, ?, ?)",
                        [nombre, ci, tipo]
                    )
                    insertados += 1
                else:
                    duplicados += 1
                
                # Mostrar progreso cada 50 registros
                if i % 50 == 0:
                    print(f"   ⏳ Procesados: {i}/{len(clientes)}")
            
            except Exception as e:
                print(f"   ❌ Error en registro {i}: {e}")
                errores += 1
        
        print(f"\n✅ Importación completada:")
        print(f"   📊 Insertados: {insertados}")
        print(f"   ⚠️  Duplicados: {duplicados}")
        print(f"   ❌ Errores: {errores}")
        print(f"   📈 Total procesado: {insertados + duplicados + errores}")
        
        return True
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python3 importar-turso.py <DATABASE_URL> <AUTH_TOKEN>")
        print("\nEjemplo:")
        print("  python3 importar-turso.py libsql://tu-db-xxxxx.turso.io tu-token-aqui")
        print("\nObtén tus credenciales con:")
        print("  turso db show <database-name> --expand")
        sys.exit(1)
    
    database_url = sys.argv[1]
    auth_token = sys.argv[2]
    
    success = importar_clientes(database_url, auth_token)
    sys.exit(0 if success else 1)
