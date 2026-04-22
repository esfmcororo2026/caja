#!/bin/bash

python3 << 'PYTHON'
import json
import subprocess

with open('clientes-import.json', 'r') as f:
    clientes = json.load(f)

total_insertados = 0
total_duplicados = 0
lote_size = 100

for i in range(0, len(clientes), lote_size):
    lote = clientes[i:i+lote_size]
    print(f"Procesando lote {i//lote_size + 1} ({len(lote)} clientes)...")
    
    with open('/tmp/lote.json', 'w') as f:
        json.dump(lote, f)
    
    result = subprocess.run([
        'curl', '-s', '-X', 'POST',
        'https://caja-worker.esfm-cororo.workers.dev/api/clientes/importar/backup',
        '-H', 'Content-Type: application/json',
        '-d', '@/tmp/lote.json'
    ], capture_output=True, text=True)
    
    try:
        response = json.loads(result.stdout)
        if response.get('success'):
            total_insertados += response.get('insertados', 0)
            total_duplicados += response.get('duplicados', 0)
            print(f"  ✓ Insertados: {response.get('insertados', 0)}, Duplicados: {response.get('duplicados', 0)}")
        else:
            print(f"  ✗ Error: {response.get('error', 'Unknown error')}")
    except:
        print(f"  ✗ Error parsing response: {result.stdout}")

print(f"\nTotal: {total_insertados} insertados, {total_duplicados} duplicados")
PYTHON
