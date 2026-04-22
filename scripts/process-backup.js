#!/usr/bin/env node

/**
 * Script para procesar backup y generar archivo de importación de clientes
 * Uso: node scripts/process-backup.js
 */

const fs = require('fs');
const path = require('path');

console.log('📂 Procesando backup...\n');

// Leer backup
const backupPath = path.join(__dirname, '../backup_esfm_2026-04-21.json');

if (!fs.existsSync(backupPath)) {
  console.error('❌ Error: No se encontró el archivo backup_esfm_2026-04-21.json');
  process.exit(1);
}

const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

const clientes = [];
const ciSet = new Set();
let estudiantes = 0;
let personal = 0;
let duplicados = 0;

// Procesar estudiantes
if (backupData.tablas?.estudiantes) {
  console.log(`📚 Procesando ${backupData.tablas.estudiantes.length} estudiantes...`);
  
  backupData.tablas.estudiantes.forEach((est) => {
    try {
      const nombre = `${est.nombre} ${est.apellido_paterno} ${est.apellido_materno || ''}`.trim().toUpperCase();
      const ci = est.dni;
      
      if (!ciSet.has(ci)) {
        clientes.push({
          nombre,
          ci,
          tipo: 'ESTUDIANTE'
        });
        ciSet.add(ci);
        estudiantes++;
      } else {
        duplicados++;
      }
    } catch (error) {
      console.error('⚠️  Error procesando estudiante:', error.message);
    }
  });
}

// Procesar personal
if (backupData.tablas?.administrativos) {
  console.log(`👥 Procesando ${backupData.tablas.administrativos.length} personal...\n`);
  
  backupData.tablas.administrativos.forEach((adm) => {
    try {
      const nombre = `${adm.nombre} ${adm.apellido_paterno} ${adm.apellido_materno || ''}`.trim().toUpperCase();
      const ci = adm.dni;
      
      if (!ciSet.has(ci)) {
        clientes.push({
          nombre,
          ci,
          tipo: 'PERSONAL'
        });
        ciSet.add(ci);
        personal++;
      } else {
        duplicados++;
      }
    } catch (error) {
      console.error('⚠️  Error procesando personal:', error.message);
    }
  });
}

// Guardar archivo
const outputPath = path.join(__dirname, '../clientes-import.json');
fs.writeFileSync(outputPath, JSON.stringify(clientes, null, 2));

// Mostrar resumen
console.log('✅ Procesamiento completado:\n');
console.log(`   📚 Estudiantes procesados: ${estudiantes}`);
console.log(`   👥 Personal procesado: ${personal}`);
console.log(`   ⚠️  Duplicados encontrados: ${duplicados}`);
console.log(`   📊 Total a importar: ${clientes.length}\n`);
console.log(`📁 Archivo generado: ${outputPath}\n`);

// Mostrar instrucciones
console.log('📋 Próximos pasos:\n');
console.log('1. Desplegar el worker con la tabla clientes actualizada');
console.log('2. Ejecutar en el frontend o Postman:\n');
console.log('   POST /api/clientes/importar/backup');
console.log('   Body: (contenido de clientes-import.json)\n');
console.log('3. Verificar importación:\n');
console.log('   GET /api/clientes\n');

// Mostrar ejemplo de primeras 3 clientes
console.log('📝 Ejemplo de datos a importar:\n');
clientes.slice(0, 3).forEach((c, i) => {
  console.log(`   ${i + 1}. ${c.nombre}`);
  console.log(`      CI: ${c.ci} | Tipo: ${c.tipo}\n`);
});

if (clientes.length > 3) {
  console.log(`   ... y ${clientes.length - 3} más\n`);
}
