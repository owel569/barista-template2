#!/usr/bin/env node

/**
 * Script de correction finale des erreurs restantes
 * Traite spécifiquement les problèmes de guillemets et de syntaxe persistants
 */

import fs from 'fs';
import { glob } from 'glob';

// Fonction pour corriger les erreurs de guillemets complexes
function fixComplexQuoteErrors(content: string): string {
  // Correction des guillemets échappés multiples
  content = content.replace(/\\{2,}"/g, '"');
  content = content.replace(/\\{2,}'/g, "'");
  content = content.replace(/\\{2,}`/g, '`');
  
  // Correction des chaînes avec des guillemets mal formatés
  content = content.replace(/"([^"]*\\"[^"]*)"/g, (match, inner) => {
    return `"${inner.replace(/\\"/g, '"')}"`;
  });
  
  content = content.replace(/'([^']*\\'[^']*)'/g, (match, inner) => {
    return `'${inner.replace(/\\'/g, "'")}'`;
  });
  
  content = content.replace(/`([^`]*\\`[^`]*)`/g, (match, inner) => {
    return `\`${inner.replace(/\\`/g, '`')}\``;
  });
  
  // Correction des chaînes avec des backslashes multiples
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\\\\\\/g, '\\');
  content = content.replace(/\\\\\\\//g, '\\');
  
  // Correction des chaînes avec des retours à la ligne et tabulations
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  // Correction des chaînes avec des apostrophes mal échappées
  content = content.replace(/"([^"]*'[^"]*)"/g, (match, inner) => {
    return `"${inner.replace(/'/g, "\\'")}"`;
  });
  
  content = content.replace(/'([^']*"[^']*)'/g, (match, inner) => {
    return `'${inner.replace(/"/g, '\\"')}'`;
  });
  
  return content;
}

// Fonction pour corriger les erreurs de syntaxe JSX
function fixJSXErrors(content: string): string {
  // Correction des attributs JSX mal formatés
  content = content.replace(/className=\\"([^"]*)\\"([^"]*)/g, 'className="$1$2"');
  content = content.replace(/className=\\"([^"]*)\\"([^"]*)/g, 'className="$1$2"');
  
  // Correction des chaînes dans les props JSX
  content = content.replace(/=\\"([^"]*)\\"([^"]*)/g, '="$1$2"');
  content = content.replace(/=\\"([^"]*)\\"([^"]*)/g, '="$1$2"');
  
  // Correction des expressions JSX
  content = content.replace(/\{\s*\\"([^"]*)\\"\s*\}/g, '{"$1"}');
  content = content.replace(/\{\s*\\'([^']*)\\'\\s*\}/g, "{'$1'}");
  
  // Correction des chaînes de template
  content = content.replace(/`([^`]*\\`[^`]*)`/g, (match, inner) => {
    return `\`${inner.replace(/\\`/g, '`')}\``;
  });
  
  return content;
}

// Fonction pour corriger les erreurs de types
function fixTypeErrors(content: string): string {
  // Correction des unions de types mal formatées
  content = content.replace(/"([^"]+)"\s*\|\s*"([^"]+)"/g, '"$1" | "$2"');
  content = content.replace(/'([^']+)'\s*\|\s*'([^']+)'/g, "'$1' | '$2'");
  
  // Correction des types avec des guillemets échappés
  content = content.replace(/type:\s*\\"([^"]*)\\"\s*\|\s*\\"([^"]*)\\"\s*\|\s*\\"([^"]*)\\"\s*\|\s*\\"([^"]*)\\"/g, 
    'type: "$1" | "$2" | "$3" | "$4"');
  
  // Correction des types avec des guillemets simples
  content = content.replace(/type:\s*'([^']*)'\s*\|\s*'([^']*)'\s*\|\s*'([^']*)'\s*\|\s*'([^']*)'/g, 
    'type: "$1" | "$2" | "$3" | "$4"');
  
  return content;
}

// Fonction pour corriger les erreurs de chaînes de caractères
function fixStringErrors(content: string): string {
  // Correction des chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)\\"([^"]*)/g, '"$1"$2"');
  content = content.replace(/'([^']*)\\'([^']*)/g, "'$1'$2'");
  
  // Correction des chaînes avec des backslashes multiples
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\\\\\\/g, '\\');
  
  // Correction des chaînes avec des caractères spéciaux mal échappés
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux fichiers de traduction
function fixTranslationErrors(content: string): string {
  // Nettoyer complètement les chaînes de traduction
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les objets de traduction
  content = content.replace(/"([^"]+)":\s*"([^"]+)"/g, (match, key, value) => {
    return `"${key}": "${value}"`;
  });
  
  // Corriger les chaînes avec des apostrophes
  content = content.replace(/"([^"]*'[^"]*)"/g, (match, inner) => {
    return `"${inner.replace(/'/g, "\\'")}"`;
  });
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux utilitaires
function fixUtilityErrors(content: string): string {
  // Corriger les appels de méthodes avec des paramètres manquants
  content = content.replace(/\.toLocaleDateString\(\s*\|\|\s*''\s*\)/g, '.toLocaleDateString()');
  content = content.replace(/\.toTimeString\(\s*\|\|\s*''\s*\)/g, '.toTimeString()');
  content = content.replace(/\.toDateString\(\s*\|\|\s*''\s*\)/g, '.toDateString()');
  content = content.replace(/\.toISOString\(\s*\|\|\s*''\s*\)/g, '.toISOString()');
  
  // Corriger les chaînes avec des guillemets échappés
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  return content;
}

// Fonction principale de correction
function fixFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer les corrections selon le type de fichier
    if (filePath.includes('translations/')) {
      const newContent = fixTranslationErrors(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else if (filePath.includes('utils/')) {
      const newContent = fixUtilityErrors(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else {
      // Corrections générales
      const newContent1 = fixComplexQuoteErrors(content);
      if (newContent1 !== content) {
        content = newContent1;
        hasChanges = true;
      }
      
      const newContent2 = fixJSXErrors(content);
      if (newContent2 !== content) {
        content = newContent2;
        hasChanges = true;
      }
      
      const newContent3 = fixTypeErrors(content);
      if (newContent3 !== content) {
        content = newContent3;
        hasChanges = true;
      }
      
      const newContent4 = fixStringErrors(content);
      if (newContent4 !== content) {
        content = newContent4;
        hasChanges = true;
      }
    }
    
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
  console.log('🔧 Début de la correction finale des erreurs...\n');
  
  // Trouver tous les fichiers avec des erreurs
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Traiter les fichiers prioritaires en premier
  const priorityFiles = allFiles.filter(file => 
    file.includes('translations/') || 
    file.includes('utils/') || 
    file.includes('types/') ||
    file.includes('pages/Reservations.tsx')
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