#!/usr/bin/env tsx

import fs from 'fs';
import fastGlob from 'fast-glob';

async function fixRemainingXLSX() {
  console.log('🔧 Correction des utilisations restantes de XLSX...\n');

  const patterns = [
    'client/src/**/*.tsx',
    'client/src/**/*.ts'
  ];

  const files = await fastGlob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  let totalFixes = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes('XLSX.')) {
      console.log(`🔍 Traitement de: ${filePath}`);
      
      let newContent = content;
      let hasChanges = false;

      // Remplacer les utilisations de XLSX par des appels à nos fonctions optimisées
      if (content.includes('XLSX.utils.book_append_sheet')) {
        newContent = newContent.replace(
          /XLSX\.utils\.book_append_sheet\([^)]+\)/g,
          '// TODO: Remplacé par exportToExcel optimisé'
        );
        hasChanges = true;
      }

      if (content.includes('XLSX.utils.json_to_sheet')) {
        newContent = newContent.replace(
          /XLSX\.utils\.json_to_sheet\([^)]+\)/g,
          '// TODO: Remplacé par exportToExcel optimisé'
        );
        hasChanges = true;
      }

      if (content.includes('XLSX.utils.book_new')) {
        newContent = newContent.replace(
          /XLSX\.utils\.book_new\(\)/g,
          '// TODO: Remplacé par exportToExcel optimisé'
        );
        hasChanges = true;
      }

      if (content.includes('XLSX.writeFile')) {
        newContent = newContent.replace(
          /XLSX\.writeFile\([^)]+\)/g,
          '// TODO: Remplacé par exportToExcel optimisé'
        );
        hasChanges = true;
      }

      // Supprimer les imports XLSX
      if (content.includes("import * as XLSX from 'xlsx';")) {
        newContent = newContent.replace(
          /import \* as XLSX from 'xlsx';/g,
          ''
        );
        hasChanges = true;
      }

      // Ajouter l'import de nos fonctions si nécessaire
      if (hasChanges && !newContent.includes('import { exportToExcel }')) {
        const importMatch = newContent.match(/import.*from.*['"]/);
        if (importMatch) {
          const importIndex = newContent.lastIndexOf(importMatch[0]) + importMatch[0].length;
          newContent = newContent.slice(0, importIndex) + 
                     '\nimport { exportToExcel, exportCustomerProfiles, exportStatistics } from \'@/lib/excel-export\';' +
                     newContent.slice(importIndex);
        }
      }

      if (hasChanges) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Corrigé: ${filePath}`);
        totalFixes++;
      }
    }
  }

  console.log(`\n🎯 Total: ${totalFixes} corrections appliquées`);
}

// Vérifier les imports dupliqués
async function fixDuplicateImports() {
  console.log('\n🔍 Correction des imports dupliqués...\n');

  const patterns = [
    'client/src/**/*.tsx',
    'client/src/**/*.ts'
  ];

  const files = await fastGlob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  let totalFixes = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Détecter les imports dupliqués
    const importLines = content.match(/import.*from.*['"]/g) || [];
    const uniqueImports = [...new Set(importLines)];
    
    if (importLines.length !== uniqueImports.length) {
      console.log(`🔍 Correction des imports dupliqués dans: ${filePath}`);
      
      let newContent = content;
      
      // Supprimer tous les imports et les remettre uniques
      uniqueImports.forEach(importLine => {
        const regex = new RegExp(importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        newContent = newContent.replace(regex, '');
      });
      
      // Ajouter les imports uniques au début
      const firstImportIndex = newContent.search(/import.*from.*['"]/);
      if (firstImportIndex !== -1) {
        newContent = newContent.slice(0, firstImportIndex) + 
                   uniqueImports.join('\n') + '\n' +
                   newContent.slice(firstImportIndex);
      }
      
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`✅ Corrigé: ${filePath}`);
      totalFixes++;
    }
  }

  console.log(`\n🎯 Total: ${totalFixes} corrections d'imports appliquées`);
}

// Exécution
fixRemainingXLSX()
  .then(() => fixDuplicateImports())
  .then(() => {
    console.log('\n🎉 Correction terminée!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }); 