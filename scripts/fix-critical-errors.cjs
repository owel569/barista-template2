#!/usr/bin/env node

/**
 * Script de correction des erreurs critiques
 * Corrige les problèmes de guillemets et de syntaxe TypeScript
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Fonction pour corriger les erreurs critiques
function fixCriticalErrors(content) {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\`/g, '`');
  
  // Supprimer les backslashes multiples
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\\\\\\/g, '\\');
  
  // Corriger les chaînes avec des guillemets mal formatés
  content = content.replace(/"""/g, '"');
  content = content.replace(/""/g, '"');
  content = content.replace(/'''/g, "'");
  content = content.replace(/''/g, "'");
  
  // Corriger les chaînes avec des retours à la ligne et tabulations
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  // Corriger les chaînes avec des apostrophes mal échappées
  content = content.replace(/"([^"]*'[^"]*)"/g, (match, inner) => {
    return `"${inner.replace(/'/g, "\\'")}"`;
  });
  
  content = content.replace(/'([^']*"[^']*)'/g, (match, inner) => {
    return `'${inner.replace(/"/g, '\\"')}'`;
  });
  
  // Corriger les types avec des guillemets mal formatés
  content = content.replace(/status:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*string;/g, 
    'status: "$1" | "$2" | "$3" | "$4" | "$5" | string;');
  
  // Corriger les appels de méthodes avec des paramètres manquants
  content = content.replace(/\.toLocaleDateString\(\s*\|\|\s*''\s*\)/g, '.toLocaleDateString()');
  content = content.replace(/\.toTimeString\(\s*\|\|\s*''\s*\)/g, '.toTimeString()');
  content = content.replace(/\.toDateString\(\s*\|\|\s*''\s*\)/g, '.toDateString()');
  content = content.replace(/\.toISOString\(\s*\|\|\s*''\s*\)/g, '.toISOString()');
  
  // Corriger les types de retour des fonctions
  content = content.replace(/"\s*:\s*"([^"]*)\s*{/g, ': $1 {');
  
  // Corriger les variables avec des types mal formatés
  content = content.replace(/"\s*:\s*"([^"]*)\s*=/g, ': $1 =');
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)\\"([^"]*)/g, '"$1"$2"');
  content = content.replace(/'([^']*)\\'([^']*)/g, "'$1'$2'");
  
  // Corriger les chaînes avec des caractères spéciaux mal échappés
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  // Corriger les template literals mal formatés
  content = content.replace(/`([^`]*\\`[^`]*)`/g, (match, inner) => {
    return `\`${inner.replace(/\\`/g, '`')}\``;
  });
  
  // Corriger les expressions dans les template literals
  content = content.replace(/\$\{([^}]*)\}/g, (match, expr) => {
    return `\${${expr.replace(/\\"/g, '"').replace(/\\'/g, "'")}}`;
  });
  
  // Nettoyage final
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  return content;
}

// Fonction pour corriger un fichier
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Appliquer les corrections
    content = fixCriticalErrors(content);
    
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
  console.log('🔧 Début de la correction des erreurs critiques...\n');
  
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
  for (const file of priorityFiles) {
    try {
      if (fixFile(file)) {
        fixedCount++;
        console.log(`✅ PRIORITAIRE: ${file}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}:`, error.message);
    }
  }
  
  console.log('\n🔧 Traitement des autres fichiers...');
  for (const file of otherFiles) {
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
  
  console.log('\n📊 Résumé final:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Correction des erreurs critiques terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit --strict" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error);
