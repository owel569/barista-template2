#!/usr/bin/env node

/**
 * Script de correction finale - Traite les derniers problèmes de guillemets multiples
 */

import fs from 'fs';
import { glob } from 'glob';

// Fonction pour corriger les guillemets multiples de manière agressive
function fixMultipleQuotesAggressively(content: string): string {
  // Corriger les guillemets doubles multiples de manière récursive
  while (content.includes('""')) {
    content = content.replace(/""/g, '"');
  }
  
  // Corriger les guillemets simples multiples de manière récursive
  while (content.includes("''")) {
    content = content.replace(/''/g, "'");
  }
  
  // Corriger les backticks multiples de manière récursive
  while (content.includes('``')) {
    content = content.replace(/``/g, '`');
  }
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)"([^"]*)/g, '"$1"$2"');
  content = content.replace(/'([^']*)'([^']*)/g, "'$1'$2'");
  
  // Corriger les chaînes avec des backslashes
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  return content;
}

// Fonction pour corriger les expressions conditionnelles mal formatées
function fixConditionalExpressions(content: string): string {
  // Corriger les expressions || mal formatées
  content = content.replace(/\(\s*\|\|\s*['"]*['"]*\)/g, '()');
  
  // Corriger les expressions typeof mal formatées
  content = content.replace(/typeof\s+([^)]+)\s*<[^>]*\s*!==\s*['"]*undefined['"]*/g, 'typeof $1 !== "undefined"');
  
  // Corriger les expressions ternaires mal formatées
  content = content.replace(/\?\s*['"]*([^'"]*)['"]*\s*:\s*['"]*([^'"]*)['"]*/g, '? "$1" : "$2"');
  
  return content;
}

// Fonction pour corriger les appels de méthodes mal formatés
function fixMethodCalls(content: string): string {
  // Corriger les appels de méthodes avec des paramètres manquants
  content = content.replace(/\.toLocaleDateString\(\s*\|\|\s*['"]*['"]*\)/g, '.toLocaleDateString()');
  content = content.replace(/\.toTimeString\(\s*\|\|\s*['"]*['"]*\)/g, '.toTimeString()');
  content = content.replace(/\.toDateString\(\s*\|\|\s*['"]*['"]*\)/g, '.toDateString()');
  content = content.replace(/\.toISOString\(\s*\|\|\s*['"]*['"]*\)/g, '.toISOString()');
  
  // Corriger les appels de méthodes avec des chaînes mal formatées
  content = content.replace(/\.split\(['"]*T['"]*\)/g, ".split('T')");
  content = content.replace(/\.split\(['"]*\s['"]*\)/g, ".split(' ')");
  
  return content;
}

// Fonction pour corriger les objets mal formatés
function fixObjectLiterals(content: string): string {
  // Corriger les objets avec des propriétés mal formatées
  content = content.replace(/:\s*"([^"]*)"([^"]*)/g, ': "$1"$2"');
  content = content.replace(/:\s*'([^']*)'([^']*)/g, ": '$1'$2'");
  
  // Corriger les objets avec des guillemets multiples
  content = content.replace(/:\s*""([^"]*)""/g, ': "$1"');
  content = content.replace(/:\s*'''([^']*)'''/g, ": '$1'");
  
  return content;
}

// Fonction pour corriger les unions de types mal formatées
function fixTypeUnions(content: string): string {
  // Corriger les unions de types avec des guillemets multiples
  content = content.replace(/"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"/g, '"$1" | "$2" | "$3" | "$4"');
  content = content.replace(/'([^']*)'\s*\|\s*'([^']*)'\s*\|\s*'([^']*)'\s*\|\s*'([^']*)'/g, "'$1' | '$2' | '$3' | '$4'");
  
  // Corriger les unions de types avec des guillemets simples
  content = content.replace(/"([^"]*)"\s*\|\s*"([^"]*)"/g, '"$1" | "$2"');
  content = content.replace(/'([^']*)'\s*\|\s*'([^']*)'/g, "'$1' | '$2'");
  
  return content;
}

// Fonction principale de correction
function fixFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer les corrections de manière itérative
    let previousContent = '';
    let iterations = 0;
    const maxIterations = 5;
    
    while (content !== previousContent && iterations < maxIterations) {
      previousContent = content;
      iterations++;
      
      const newContent1 = fixMultipleQuotesAggressively(content);
      if (newContent1 !== content) {
        content = newContent1;
        hasChanges = true;
      }
      
      const newContent2 = fixConditionalExpressions(content);
      if (newContent2 !== content) {
        content = newContent2;
        hasChanges = true;
      }
      
      const newContent3 = fixMethodCalls(content);
      if (newContent3 !== content) {
        content = newContent3;
        hasChanges = true;
      }
      
      const newContent4 = fixObjectLiterals(content);
      if (newContent4 !== content) {
        content = newContent4;
        hasChanges = true;
      }
      
      const newContent5 = fixTypeUnions(content);
      if (newContent5 !== content) {
        content = newContent5;
        hasChanges = true;
      }
    }
    
    // Nettoyage final
    content = content.replace(/\\"/g, '"');
    content = content.replace(/\\'/g, "'");
    content = content.replace(/\\\\/g, '\\');
    content = content.replace(/\\n/g, ' ');
    content = content.replace(/\\t/g, ' ');
    content = content.replace(/\\r/g, ' ');
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Début de la correction finale des erreurs restantes...\n');
  
  // Trouver tous les fichiers avec des erreurs
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Traiter les fichiers prioritaires en premier
  const priorityFiles = allFiles.filter(file => 
    file.includes('utils/dateUtils.ts') ||
    file.includes('types/') ||
    file.includes('translations/')
  );
  
  const otherFiles = allFiles.filter(file => !priorityFiles.includes(file));
  
  console.log('🔧 Traitement des fichiers prioritaires...');
  priorityFiles.forEach(file => {
    try {
      if (fixFile(file)) {
        fixedCount++;
        console.log(`✅ PRIORITAIRE: ${file}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}:`, error);
    }
  });
  
  console.log('\n🔧 Traitement des autres fichiers...');
  otherFiles.forEach(file => {
    try {
      if (fixFile(file)) {
        fixedCount++;
        console.log(`✅ CORRIGÉ: ${file}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}:`, error);
    }
  });
  
  console.log('\n📊 Résumé final:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Correction finale terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 