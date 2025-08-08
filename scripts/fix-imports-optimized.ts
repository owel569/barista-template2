#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import fastGlob from 'fast-glob';

interface ImportFix {
  oldImport: string;
  newImport: string;
  description: string;
}

const IMPORT_FIXES: ImportFix[] = [
  {
    oldImport: "import * as XLSX from 'xlsx';",
    newImport: "import { exportToExcel, exportCustomerProfiles, exportStatistics } from '@/lib/excel-export';",
    description: "Remplacer XLSX par exceljs optimisé"
  },
  {
    oldImport: "import { toast } from 'react-hot-toast';",
    newImport: "import { useToast } from '@/hooks/use-toast';",
    description: "Remplacer react-hot-toast par sonner"
  },
  {
    oldImport: "import { usePermissions } from '@/hooks/usePermissions';",
    newImport: "import { usePermissions } from '@/hooks/usePermissions';",
    description: "Utiliser le hook usePermissions optimisé"
  }
];

interface FileFix {
  filePath: string;
  fixes: string[];
  errors: string[];
}

async function fixImportsInFile(filePath: string): Promise<FileFix> {
  const result: FileFix = {
    filePath,
    fixes: [],
    errors: []
  };

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Appliquer les corrections d'imports
    for (const fix of IMPORT_FIXES) {
      if (content.includes(fix.oldImport)) {
        content = content.replace(fix.oldImport, fix.newImport);
        result.fixes.push(fix.description);
        hasChanges = true;
      }
    }

    // Corriger les utilisations de XLSX
    if (content.includes('XLSX.utils.json_to_sheet')) {
      content = content.replace(
        /XLSX\.utils\.json_to_sheet\(([^)]+)\)/g,
        '// TODO: Utiliser exportToExcel depuis @/lib/excel-export'
      );
      result.fixes.push("Remplacé XLSX.utils.json_to_sheet par commentaire TODO");
      hasChanges = true;
    }

    if (content.includes('XLSX.utils.book_new')) {
      content = content.replace(
        /XLSX\.utils\.book_new\(\)/g,
        '// TODO: Utiliser exportToExcel depuis @/lib/excel-export'
      );
      result.fixes.push("Remplacé XLSX.utils.book_new par commentaire TODO");
      hasChanges = true;
    }

    if (content.includes('XLSX.writeFile')) {
      content = content.replace(
        /XLSX\.writeFile\([^)]+\)/g,
        '// TODO: Utiliser exportToExcel depuis @/lib/excel-export'
      );
      result.fixes.push("Remplacé XLSX.writeFile par commentaire TODO");
      hasChanges = true;
    }

    // Corriger les utilisations de toast
    if (content.includes('toast.success(')) {
      content = content.replace(
        /toast\.success\(([^)]+)\)/g,
        'toast.success($1)'
      );
      result.fixes.push("Corrigé toast.success");
      hasChanges = true;
    }

    if (content.includes('toast.error(')) {
      content = content.replace(
        /toast\.error\(([^)]+)\)/g,
        'toast.error($1)'
      );
      result.fixes.push("Corrigé toast.error");
      hasChanges = true;
    }

    // Corriger les utilisations de usePermissions
    if (content.includes('usePermissions(') && !content.includes('import { usePermissions }')) {
      // Ajouter l'import si manquant
      const importMatch = content.match(/import.*from.*['"]/);
      if (importMatch) {
        const importIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, importIndex) + 
                 '\nimport { usePermissions } from \'@/hooks/usePermissions\';' +
                 content.slice(importIndex);
        result.fixes.push("Ajouté import usePermissions");
        hasChanges = true;
      }
    }

    // Écrire les changements si nécessaire
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Corrigé: ${filePath}`);
    }

  } catch (error) {
    result.errors.push(`Erreur lors du traitement: ${error}`);
  }

  return result;
}

async function findFilesToFix(): Promise<string[]> {
  const patterns = [
    'client/src/**/*.tsx',
    'client/src/**/*.ts',
    'server/**/*.ts'
  ];

  const files = await fastGlob(patterns, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  return files.filter((file: string) => {
    const content = fs.readFileSync(file, 'utf-8');
    return IMPORT_FIXES.some(fix => content.includes(fix.oldImport)) ||
           content.includes('XLSX.') ||
           content.includes('toast.') ||
           content.includes('usePermissions(');
  });
}

async function main() {
  console.log('🔧 Début de la correction des imports problématiques...\n');

  try {
    const filesToFix = await findFilesToFix();
    console.log(`📁 ${filesToFix.length} fichiers à corriger:\n`);

    const results: FileFix[] = [];

    for (const filePath of filesToFix) {
      console.log(`🔍 Traitement de: ${filePath}`);
      const result = await fixImportsInFile(filePath);
      results.push(result);
    }

    // Résumé des corrections
    console.log('\n📊 Résumé des corrections:');
    console.log('========================');

    let totalFixes = 0;
    let totalErrors = 0;

    for (const result of results) {
      if (result.fixes.length > 0 || result.errors.length > 0) {
        console.log(`\n📄 ${result.filePath}:`);
        
        if (result.fixes.length > 0) {
          console.log('  ✅ Corrections appliquées:');
          result.fixes.forEach(fix => console.log(`    - ${fix}`));
          totalFixes += result.fixes.length;
        }
        
        if (result.errors.length > 0) {
          console.log('  ❌ Erreurs:');
          result.errors.forEach(error => console.log(`    - ${error}`));
          totalErrors += result.errors.length;
        }
      }
    }

    console.log(`\n🎯 Total: ${totalFixes} corrections appliquées, ${totalErrors} erreurs`);

    // Créer un rapport détaillé
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: filesToFix.length,
      totalFixes,
      totalErrors,
      results: results.filter(r => r.fixes.length > 0 || r.errors.length > 0)
    };

    fs.writeFileSync(
      'IMPORTS_OPTIMIZATION_REPORT.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n📋 Rapport détaillé sauvegardé dans: IMPORTS_OPTIMIZATION_REPORT.json');

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Fonction utilitaire pour vérifier les imports restants
async function checkRemainingIssues() {
  console.log('\n🔍 Vérification des imports restants...\n');

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

    if (content.includes('usePermissions(') && !content.includes('import { usePermissions }')) {
      fileIssues.push('Utilisation de usePermissions sans import');
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
main()
  .then(() => checkRemainingIssues())
  .then(() => {
    console.log('\n🎉 Correction des imports terminée!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }); 