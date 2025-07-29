#!/usr/bin/env node

/**
 * Script de correction automatique des erreurs de syntaxe JSX
 * Corrige les guillemets mal fermés et autres erreurs de syntaxe courantes
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Patterns de correction
const corrections = [
  // Guillemets mal fermés dans les imports
  { pattern: /import\s+.*\s+from\s+["']([^"']+)["']/g, replacement: (match, p1) => {
    return match.replace(/["']([^"']+)["']/, `'${p1}'`);
  }},
  
  // Guillemets mal fermés dans les chaînes JSX
  { pattern: /className\s*=\s*["']([^"']+)["']/g, replacement: (match, p1) => {
    return match.replace(/["']([^"']+)["']/, `"${p1}"`);
  }},
  
  // Guillemets mal fermés dans les props
  { pattern: /(\w+)\s*=\s*["']([^"']+)["']/g, replacement: (match, prop, value) => {
    if (prop === 'className' || prop === 'id' || prop === 'type' || prop === 'placeholder') {
      return match.replace(/["']([^"']+)["']/, `"${value}"`);
    }
    return match;
  }},
  
  // Correction des balises auto-fermantes
  { pattern: /<(\w+)\s+([^>]*)\s*>\s*<\/\1>/g, replacement: (match, tag, attrs) => {
    if (attrs.trim() === '') {
      return `<${tag} />`;
    }
    return match;
  }},
  
  // Correction des guillemets dans les chaînes de caractères
  { pattern: /["']([^"']*["'][^"']*)["']/g, replacement: (match, content) => {
    return `"${content.replace(/"/g, '\\"')}"`;
  }},
  
  // Correction des apostrophes dans les chaînes
  { pattern: /'([^']*'[^']*)'/g, replacement: (match, content) => {
    return `"${content.replace(/'/g, "\\'")}"`;
  }},
  
  // Correction des guillemets simples dans les chaînes JSX
  { pattern: /className\s*=\s*'([^']+)'/g, replacement: (match, className) => {
    return `className="${className}"`;
  }},
  
  // Correction des guillemets doubles dans les chaînes non-JSX
  { pattern: /"([^"]*'[^"]*)"([^"]*)/g, replacement: (match, content, rest) => {
    return `"${content.replace(/'/g, "\\'")}"${rest}`;
  }},
  
  // Correction des balises non fermées
  { pattern: /<(\w+)([^>]*)\s*>\s*$/gm, replacement: (match, tag, attrs) => {
    return `<${tag}${attrs}></${tag}>`;
  }},
  
  // Correction des espaces dans les balises
  { pattern: /<\s*(\w+)\s*>/g, replacement: (match, tag) => {
    return `<${tag}>`;
  }},
  
  // Correction des espaces dans les balises fermantes
  { pattern: /<\s*\/\s*(\w+)\s*>/g, replacement: (match, tag) => {
    return `</${tag}>`;
  }}
];

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let fixedContent = content;
    let hasChanges = false;
    
    // Appliquer les corrections
    corrections.forEach(correction => {
      const newContent = fixedContent.replace(correction.pattern, correction.replacement);
      if (newContent !== fixedContent) {
        hasChanges = true;
        fixedContent = newContent;
      }
    });
    
    // Corrections spécifiques pour les erreurs courantes
    const specificFixes = [
      // Correction des guillemets mal fermés dans les chaînes
      { from: /'([^']*'[^']*)'/g, to: (match, content) => `"${content.replace(/'/g, "\\'")}"` },
      { from: /"([^"]*"[^"]*)"/g, to: (match, content) => `"${content.replace(/"/g, '\\"')}"` },
      
      // Correction des balises JSX mal fermées
      { from: /<(\w+)([^>]*)\s*>\s*$/gm, to: (match, tag, attrs) => `<${tag}${attrs}></${tag}>` },
      
      // Correction des props mal formatées
      { from: /(\w+)\s*=\s*'([^']*)'/g, to: (match, prop, value) => `${prop}="${value}"` },
      
      // Correction des chaînes avec apostrophes
      { from: /'([^']*'[^']*)'/g, to: (match, content) => `"${content.replace(/'/g, "\\'")}"` }
    ];
    
    specificFixes.forEach(fix => {
      const newContent = fixedContent.replace(fix.from, fix.to);
      if (newContent !== fixedContent) {
        hasChanges = true;
        fixedContent = newContent;
      }
    });
    
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
  console.log('🔧 Début de la correction automatique des erreurs JSX...\n');
  
  // Trouver tous les fichiers TSX
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  allFiles.forEach(file => {
    try {
      if (fixFile(file)) {
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