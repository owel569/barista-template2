#!/usr/bin/env node

/**
 * Script de correction des erreurs de guillemets échappés
 * Corrige les problèmes créés par le script précédent
 */

import fs from 'fs';
import { glob } from 'glob';

// Patterns de correction pour les guillemets échappés
const quoteFixes = [
  // Correction des guillemets doubles échappés
  { pattern: /\\"/g, replacement: '"' },
  { pattern: /\\\\"/g, replacement: '"' },
  { pattern: /\\\\\\"/g, replacement: '"' },
  
  // Correction des guillemets simples échappés
  { pattern: /\\'/g, replacement: "'" },
  { pattern: /\\\\'/g, replacement: "'" },
  { pattern: /\\\\\\'/g, replacement: "'" },
  
  // Correction des chaînes mal formatées
  { pattern: /"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
    return `"${content.replace(/\\"/g, '"')}"`;
  }},
  
  { pattern: /'([^']*\\'[^']*)'/g, replacement: (match, content) => {
    return `'${content.replace(/\\'/g, "'")}'`;
  }},
  
  // Correction des chaînes avec apostrophes mal échappées
  { pattern: /"([^"]*'[^"]*)"/g, replacement: (match, content) => {
    return `"${content.replace(/'/g, "\\'")}"`;
  }},
  
  // Correction des chaînes avec guillemets mal échappés
  { pattern: /'([^']*"[^']*)'/g, replacement: (match, content) => {
    return `'${content.replace(/"/g, '\\"')}'`;
  }},
  
  // Correction des chaînes JSX mal formatées
  { pattern: /className\s*=\s*"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
    return `className="${content.replace(/\\"/g, '"')}"`;
  }},
  
  { pattern: /className\s*=\s*'([^']*\\'[^']*)'/g, replacement: (match, content) => {
    return `className="${content.replace(/\\'/g, "'")}"`;
  }},
  
  // Correction des imports mal formatés
  { pattern: /import\s+.*\s+from\s*"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
    return match.replace(/\\"/g, '"');
  }},
  
  { pattern: /import\s+.*\s+from\s*'([^']*\\'[^']*)'/g, replacement: (match, content) => {
    return match.replace(/\\'/g, "'");
  }},
  
  // Correction des chaînes dans les objets
  { pattern: /:\s*"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
    return match.replace(/\\"/g, '"');
  }},
  
  { pattern: /:\s*'([^']*\\'[^']*)'/g, replacement: (match, content) => {
    return match.replace(/\\'/g, "'");
  }}
];

// Fonction pour corriger un fichier
function fixQuotes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;
    
    // Appliquer les corrections de guillemets
    quoteFixes.forEach(fix => {
      const newContent = fixedContent.replace(fix.pattern, fix.replacement);
      if (newContent !== fixedContent) {
        hasChanges = true;
        fixedContent = newContent;
      }
    });
    
    // Corrections spécifiques pour les fichiers de traduction
    if (filePath.includes('translations/')) {
      // Correction des chaînes de traduction
      fixedContent = fixedContent.replace(/\\"/g, '"');
      fixedContent = fixedContent.replace(/\\'/g, "'");
      fixedContent = fixedContent.replace(/\\\\/g, '\\');
    }
    
    // Corrections spécifiques pour les fichiers de types
    if (filePath.includes('types/')) {
      // Correction des types avec guillemets
      fixedContent = fixedContent.replace(/\\"/g, '"');
      fixedContent = fixedContent.replace(/\\'/g, "'");
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Début de la correction des erreurs de guillemets...\n');
  
  // Trouver tous les fichiers avec des erreurs
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  allFiles.forEach(file => {
    try {
      if (fixQuotes(file)) {
        fixedCount++;
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}:`, error.message);
    }
  });
  
  console.log('\n📊 Résumé:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Correction terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 