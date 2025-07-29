#!/usr/bin/env node

/**
 * Script de correction finale des erreurs restantes
 * Traite les fichiers les plus problématiques avec des corrections ciblées
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Fonction pour corriger les erreurs spécifiques aux fichiers JSX/TSX
function fixJSXErrors(content) {
  // Corriger les guillemets mal échappés dans les chaînes JSX
  content = content.replace(/""([^"]*)""/g, '"$1"');
  content = content.replace(/''([^']*)''/g, "'$1'");
  
  // Corriger les guillemets simples mal formatés
  content = content.replace(/"([^"]*)"([^"]*)"/g, '"$1$2"');
  content = content.replace(/'([^']*)'([^']*)'/g, "'$1$2'");
  
  // Corriger les expressions JSX mal formatées
  content = content.replace(/\{\s*"([^"]*)"\s*\}/g, '{"$1"}');
  content = content.replace(/\{\s*'([^']*)'\s*\}/g, "{'$1'}");
  
  // Corriger les attributs JSX mal formatés
  content = content.replace(/htmlFor=""([^"]*)""/g, 'htmlFor="$1"');
  content = content.replace(/className=""([^"]*)""/g, 'className="$1"');
  content = content.replace(/id=""([^"]*)""/g, 'id="$1"');
  
  // Corriger les expressions ternaires mal formatées
  content = content.replace(/\?\s*"([^"]*)"\s*:\s*"([^"]*)"/g, '? "$1" : "$2"');
  
  // Corriger les template literals mal formatés
  content = content.replace(/`([^`]*)\$\{([^}]*)\}([^`]*)`/g, (match, before, expr, after) => {
    return `\`${before}\${${expr}}${after}\``;
  });
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux fichiers de traduction
function fixTranslationErrors(content) {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  
  // Corriger les guillemets doubles mal formatés
  content = content.replace(/""([^"]*)""/g, '"$1"');
  content = content.replace(/''([^']*)''/g, "'$1'");
  
  // Corriger les objets de traduction mal formatés
  content = content.replace(/"([^"]+)":\s*"([^"]+)"/g, (match, key, value) => {
    return `"${key}": "${value}"`;
  });
  
  // Corriger les chaînes avec des apostrophes
  content = content.replace(/"([^"]*'[^"]*)"/g, (match, inner) => {
    return `"${inner.replace(/'/g, "\\'")}"`;
  });
  
  // Corriger les fins de fichiers mal formatées
  content = content.replace(/};"*$/g, '};');
  content = content.replace(/};'*$/g, '};');
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux types
function fixTypeErrors(content) {
  // Corriger les types avec des guillemets mal formatés
  content = content.replace(/status"\s*:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*string;/g, 
    'status: "$1" | "$2" | "$3" | "$4" | "$5" | string;');
  
  // Corriger les propriétés avec des guillemets mal formatés
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)"\s*:\s*"([^"]*)"/g, '$1: "$2"');
  
  // Corriger les types avec des guillemets échappés
  content = content.replace(/type"\s*:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"/g,
    'type: "$1" | "$2" | "$3" | "$4"');
  
  // Corriger les propriétés optionnelles mal formatées
  content = content.replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\?"\s*:\s*([^;]+);/g, '$1?: $2;');
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux expressions
function fixExpressionErrors(content) {
  // Corriger les expressions avec des guillemets mal formatés
  content = content.replace(/new Date\(\)\.toISOString\(\s*\|\|\s*''\s*\|\|\s*''\s*\|\|\s*''\s*\)/g, 'new Date().toISOString()');
  
  // Corriger les expressions ternaires mal formatées
  content = content.replace(/\?\s*"([^"]*)"\s*:\s*"([^"]*)"/g, '? "$1" : "$2"');
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)\\"([^"]*)/g, '"$1"$2"');
  content = content.replace(/'([^']*)\\'([^']*)/g, "'$1'$2'");
  
  return content;
}

// Fonction pour corriger un fichier spécifique
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Appliquer les corrections selon le type de fichier
    if (filePath.includes('translations/')) {
      content = fixTranslationErrors(content);
    } else if (filePath.includes('types/')) {
      content = fixTypeErrors(content);
    } else if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
      content = fixJSXErrors(content);
      content = fixExpressionErrors(content);
    } else {
      content = fixExpressionErrors(content);
    }
    
    // Nettoyage final
    content = content.replace(/\\"/g, '"');
    content = content.replace(/\\'/g, "'");
    content = content.replace(/\\\\/g, '\\');
    content = content.replace(/\\n/g, ' ');
    content = content.replace(/\\t/g, ' ');
    content = content.replace(/\\r/g, ' ');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
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
  console.log('🔧 Début de la correction finale des erreurs...\n');
  
  // Fichiers prioritaires à corriger
  const priorityFiles = [
    'client/src/pages/Reservations.tsx',
    'client/src/translations/fr.ts',
    'client/src/translations/en.ts',
    'client/src/translations/es.ts',
    'client/src/translations/hi.ts',
    'client/src/translations/zh.ts',
    'client/src/types/admin.ts',
    'client/src/types/stats.ts'
  ];
  
  let fixedCount = 0;
  let errorCount = 0;
  
  console.log('🔧 Traitement des fichiers prioritaires...');
  for (const file of priorityFiles) {
    try {
      if (fs.existsSync(file)) {
        if (fixFile(file)) {
          fixedCount++;
          console.log(`✅ PRIORITAIRE: ${file}`);
        }
      } else {
        console.log(`⚠️ Fichier non trouvé: ${file}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}:`, error.message);
    }
  }
  
  // Traiter tous les autres fichiers TypeScript/TSX
  console.log('\n🔧 Traitement des autres fichiers...');
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  for (const file of allFiles) {
    if (!priorityFiles.includes(file)) {
      try {
        if (fixFile(file)) {
          fixedCount++;
          console.log(`✅ CORRIGÉ: ${file}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur avec ${file}:`, error.message);
      }
    }
  }
  
  console.log('\n📊 Résumé final:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length + priorityFiles.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Correction finale terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit --strict" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 