#!/usr/bin/env tsx

/**
 * Script d'élimination des types 'any' restants
 * Identifie et propose des corrections pour tous les types 'any'
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface AnyUsage {
  file: string;
  line: number;
  column: number;
  context: string;
  suggestion: string;
}

// Patterns pour identifier les types 'any'
const anyPatterns = [
  {
    name: 'Variable any',
    pattern: /:\s*any\b/g,
    suggestion: 'Remplacer par un type spécifique'
  },
  {
    name: 'Paramètre any',
    pattern: /\(\s*(\w+)\s*:\s*any\s*\)/g,
    suggestion: 'Définir un type d\'interface pour le paramètre'
  },
  {
    name: 'Retour any',
    pattern: /\)\s*:\s*any\s*{/g,
    suggestion: 'Définir un type de retour spécifique'
  },
  {
    name: 'Array any',
    pattern: /any\[\]/g,
    suggestion: 'Utiliser un type générique Array<T>'
  },
  {
    name: 'Object any',
    pattern: /Record<string,\s*any>/g,
    suggestion: 'Définir une interface pour l\'objet'
  }
];

function findAnyTypes(filePath: string): AnyUsage[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const usages: AnyUsage[] = [];

  lines.forEach((line, lineIndex) => {
    anyPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.pattern.exec(line)) !== null) {
        usages.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          context: line.trim(),
          suggestion: pattern.suggestion
        });
      }
    });
  });

  return usages;
}

function generateTypeSuggestions(context: string): string {
  // Suggestions basées sur le contexte
  if (context.includes('user') || context.includes('User')) {
    return 'User | null';
  }
  if (context.includes('data') || context.includes('Data')) {
    return 'unknown';
  }
  if (context.includes('event') || context.includes('Event')) {
    return 'React.SyntheticEvent';
  }
  if (context.includes('error') || context.includes('Error')) {
    return 'Error | null';
  }
  if (context.includes('response') || context.includes('Response')) {
    return 'Response';
  }
  if (context.includes('config') || context.includes('Config')) {
    return 'Config';
  }
  if (context.includes('options') || context.includes('Options')) {
    return 'Options';
  }
  
  return 'unknown';
}

function main() {
  console.log('🔍 Recherche des types "any" restants...\n');

  const tsxFiles = glob.sync('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = glob.sync('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];

  let totalAnyTypes = 0;
  const allUsages: AnyUsage[] = [];

  allFiles.forEach(file => {
    const usages = findAnyTypes(file);
    if (usages.length > 0) {
      console.log(`📁 ${file}: ${usages.length} types 'any' trouvés`);
      allUsages.push(...usages);
      totalAnyTypes += usages.length;
    }
  });

  console.log(`\n📊 Total: ${totalAnyTypes} types 'any' trouvés dans ${allFiles.length} fichiers\n`);

  if (totalAnyTypes === 0) {
    console.log('🎉 Aucun type "any" trouvé! Le code est déjà bien typé.');
    return;
  }

  console.log('📋 Détail des types "any" trouvés:\n');
  allUsages.forEach((usage, index) => {
    console.log(`${index + 1}. ${usage.file}:${usage.line}:${usage.column}`);
    console.log(`   Contexte: ${usage.context}`);
    console.log(`   Suggestion: ${usage.suggestion}`);
    console.log(`   Type suggéré: ${generateTypeSuggestions(usage.context)}\n`);
  });

  console.log('💡 Recommandations:');
  console.log('1. Remplacer "any" par des types spécifiques');
  console.log('2. Utiliser des interfaces pour les objets complexes');
  console.log('3. Utiliser des unions de types pour les valeurs multiples');
  console.log('4. Utiliser "unknown" au lieu de "any" quand le type est vraiment inconnu');
  console.log('5. Utiliser des génériques pour les collections');
}

if (require.main === module) {
  main();
}

export { findAnyTypes, generateTypeSuggestions }; 