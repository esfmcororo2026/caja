import fs from 'fs';
import path from 'path';

// Leer el archivo de backup
const backupPath = path.join(process.cwd(), 'backup_esfm_2026-04-21.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

let insertados = 0;
let duplicados = 0;
const personas: any[] = [];
const ciSet = new Set();

// Migrar estudiantes
if (backupData.tablas.estudiantes) {
  console.log('Procesando estudiantes...');
  
  backupData.tablas.estudiantes.forEach((estudiante: any) => {
    try {
      const nombre = `${estudiante.nombre} ${estudiante.apellido_paterno} ${estudiante.apellido_materno || ''}`.trim().toUpperCase();
      const ci = estudiante.dni;
      
      if (!ciSet.has(ci)) {
        personas.push({
          nombre,
          ci,
          tipo: 'ESTUDIANTE'
        });
        ciSet.add(ci);
        insertados++;
      } else {
        duplicados++;
      }
    } catch (error) {
      console.error('Error al procesar estudiante:', error);
    }
  });
}

// Migrar personal (administrativos)
if (backupData.tablas.administrativos) {
  console.log('Procesando personal...');
  
  backupData.tablas.administrativos.forEach((personal: any) => {
    try {
      const nombre = `${personal.nombre} ${personal.apellido_paterno} ${personal.apellido_materno || ''}`.trim().toUpperCase();
      const ci = personal.dni;
      
      if (!ciSet.has(ci)) {
        personas.push({
          nombre,
          ci,
          tipo: 'PERSONAL'
        });
        ciSet.add(ci);
        insertados++;
      } else {
        duplicados++;
      }
    } catch (error) {
      console.error('Error al procesar personal:', error);
    }
  });
}

// Guardar en archivo JSON para importar
const outputPath = path.join(process.cwd(), 'personas-import.json');
fs.writeFileSync(outputPath, JSON.stringify(personas, null, 2));

console.log(`\n✅ Procesamiento completado:`);
console.log(`   - Procesados: ${insertados}`);
console.log(`   - Duplicados: ${duplicados}`);
console.log(`   - Total: ${personas.length}`);
console.log(`   - Archivo generado: ${outputPath}`);
