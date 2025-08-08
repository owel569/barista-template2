#!/usr/bin/env tsx

import fs from 'fs';
import fastGlob from 'fast-glob';

async function finalizeImports() {
  console.log('🔧 Finalisation des corrections d\'imports...\n');

  const patterns = [
    'client/src/**/*.tsx',
    'client/src/**/*.ts'
  ];

  const files = await fastGlob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  let totalFixes = 0;

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Remplacer les commentaires TODO par les vraies implémentations
    if (content.includes('// TODO: Utiliser exportToExcel depuis @/lib/excel-export')) {
      // Trouver le contexte pour déterminer quelle fonction utiliser
      if (content.includes('exportCustomerProfiles')) {
        content = content.replace(
          /\/\/ TODO: Utiliser exportToExcel depuis @\/lib\/excel-export/g,
          'await exportCustomerProfiles(data)'
        );
      } else if (content.includes('exportStatistics')) {
        content = content.replace(
          /\/\/ TODO: Utiliser exportToExcel depuis @\/lib\/excel-export/g,
          'await exportStatistics(data, "revenue")'
        );
      } else {
        content = content.replace(
          /\/\/ TODO: Utiliser exportToExcel depuis @\/lib\/excel-export/g,
          'await exportToExcel(data, { filename: "export", sheetName: "Données" })'
        );
      }
      hasChanges = true;
      totalFixes++;
    }

    // Ajouter les imports manquants
    if (content.includes('exportToExcel') && !content.includes('import { exportToExcel }')) {
      const importMatch = content.match(/import.*from.*['"]/);
      if (importMatch) {
        const importIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, importIndex) + 
                 '\nimport { exportToExcel, exportCustomerProfiles, exportStatistics } from \'@/lib/excel-export\';' +
                 content.slice(importIndex);
        hasChanges = true;
        totalFixes++;
      }
    }

    if (content.includes('exportCustomerProfiles') && !content.includes('import { exportCustomerProfiles }')) {
      const importMatch = content.match(/import.*from.*['"]/);
      if (importMatch) {
        const importIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, importIndex) + 
                 '\nimport { exportCustomerProfiles } from \'@/lib/excel-export\';' +
                 content.slice(importIndex);
        hasChanges = true;
        totalFixes++;
      }
    }

    if (content.includes('exportStatistics') && !content.includes('import { exportStatistics }')) {
      const importMatch = content.match(/import.*from.*['"]/);
      if (importMatch) {
        const importIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, importIndex) + 
                 '\nimport { exportStatistics } from \'@/lib/excel-export\';' +
                 content.slice(importIndex);
        hasChanges = true;
        totalFixes++;
      }
    }

    // Écrire les changements si nécessaire
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Finalisé: ${filePath}`);
    }
  }

  console.log(`\n🎯 Total: ${totalFixes} finalisations appliquées`);
}

// Vérifier les imports restants
async function checkFinalStatus() {
  console.log('\n🔍 Vérification finale des imports...\n');

  const patterns = [
    'client/src/**/*.tsx',
    'client/src/**/*.ts'
  ];

  const files = await fastGlob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  const issues: { file: string; issues: string[] }[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileIssues: string[] = [];

    if (content.includes('XLSX.')) {
      fileIssues.push('Utilisation de XLSX détectée');
    }

    if (content.includes('react-hot-toast')) {
      fileIssues.push('Import react-hot-toast détecté');
    }

    if (content.includes('// TODO:')) {
      fileIssues.push('Commentaires TODO restants');
    }

    if (fileIssues.length > 0) {
      issues.push({ file, issues: fileIssues });
    }
  }

  if (issues.length > 0) {
    console.log('⚠️  Problèmes restants détectés:');
    issues.forEach(({ file, issues }) => {
      console.log(`\n📄 ${file}:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    });
  } else {
    console.log('✅ Aucun problème restant détecté!');
  }
}

// Exécution
finalizeImports()
  .then(() => checkFinalStatus())
  .then(() => {
    console.log('\n🎉 Finalisation terminée!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }); 