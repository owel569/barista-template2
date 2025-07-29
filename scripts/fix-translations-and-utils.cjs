#!/usr/bin/env node

/**
 * Script de correction des traductions et utilitaires
 * Traite spécifiquement les erreurs dans les fichiers de traduction et les utilitaires
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Fonction pour corriger les fichiers de traduction
function fixTranslationFile(content) {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)$/gm, '"$1"');
  content = content.replace(/'([^']*)$/gm, "'$1'");
  
  // Corriger les objets avec des guillemets doubles
  content = content.replace(/""([^"]+)":\s*""([^"]+)"/g, '"$1": "$2"');
  content = content.replace(/""([^"]+)":\s*"([^"]+)"/g, '"$1": "$2"');
  
  // Corriger les objets avec des guillemets simples
  content = content.replace(/''([^']+)':\s*''([^']+)'/g, '"$1": "$2"');
  content = content.replace(/''([^']+)':\s*'([^']+)'/g, '"$1": "$2"');
  
  // Corriger les objets mal fermés
  content = content.replace(/};''"'"/g, '};');
  content = content.replace(/};''"/g, '};');
  content = content.replace(/};"/g, '};');
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  // Corriger les virgules mal placées
  content = content.replace(/",\s*"/g, '",\n  "');
  content = content.replace(/",\s*}/g, '"\n};');
  
  return content;
}

// Fonction pour corriger les fichiers utilitaires
function fixUtilityFile(content) {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)$/gm, '"$1"');
  content = content.replace(/'([^']*)$/gm, "'$1'");
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  // Corriger les objets avec des propriétés mal formatées
  content = content.replace(/([a-zA-Z0-9\-_]+):\s*"([^"]*)"\s*,/g, '  $1: "$2",');
  content = content.replace(/([a-zA-Z0-9\-_]+):\s*"([^"]*)"\s*}/g, '  $1: "$2"\n}');
  
  // Corriger les fonctions avec des paramètres mal formatés
  content = content.replace(/function\s+([a-zA-Z0-9\-_]+)\s*\(\s*([^)]*)\s*\)\s*:\s*([^{]*)\s*{/g, 
    'export function $1($2): $3 {');
  
  return content;
}

// Fonction pour corriger les fichiers de types
function fixTypeFile(content) {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)$/gm, '"$1"');
  content = content.replace(/'([^']*)$/gm, "'$1'");
  
  // Corriger les propriétés avec des guillemets échappés
  content = content.replace(/([a-zA-Z0-9\-_]+)\?\s*":\s*([^;]+);/g, '  $1?: $2;');
  content = content.replace(/([a-zA-Z0-9\-_]+)\s*":\s*([^;]+);/g, '  $1: $2;');
  
  // Corriger les interfaces mal formatées
  content = content.replace(/export\s+interface\s+([a-zA-Z0-9\-_]+)\s*{/g, 'export interface $1 {');
  
  // Corriger les types avec des guillemets mal formatés
  content = content.replace(/type:\s*"([^"]+)"\s*\|\s*"([^"]+)"/g, 'type: "$1" | "$2"');
  
  return content;
}

// Fonction pour corriger les fichiers JSX/TSX
function fixJSXFile(content) {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)$/gm, '"$1"');
  content = content.replace(/'([^']*)$/gm, "'$1'");
  
  // Corriger les attributs JSX sans guillemets
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)/g, 'className="$1"');
  content = content.replace(/id=([a-zA-Z0-9\-_]+)/g, 'id="$1"');
  content = content.replace(/type=([a-zA-Z0-9\-_]+)/g, 'type="$1"');
  content = content.replace(/htmlFor=([a-zA-Z0-9\-_]+)/g, 'htmlFor="$1"');
  content = content.replace(/placeholder=([^>\s]+)/g, 'placeholder="$1"');
  
  // Corriger les expressions JSX mal formatées
  content = content.replace(/\{\s*\\"([^"]*)\\"\s*\}/g, '{"$1"}');
  content = content.replace(/\{\s*\\'([^']*)\\'\\s*\}/g, "{'$1'}");
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  return content;
}

// Fonction principale de correction
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer les corrections selon le type de fichier
    if (filePath.includes('translations/')) {
      const newContent = fixTranslationFile(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else if (filePath.includes('utils/') || filePath.includes('lib/') || filePath.includes('hooks/')) {
      const newContent = fixUtilityFile(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else if (filePath.includes('types/')) {
      const newContent = fixTypeFile(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      const newContent = fixJSXFile(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else {
      // Corrections générales pour les autres fichiers
      const newContent = fixJSXFile(content);
      if (newContent !== content) {
        content = newContent;
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
  console.log('🔧 Début de la correction des traductions et utilitaires...\n');
  
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
    file.includes('lib/') ||
    file.includes('hooks/')
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
    console.log('\n🎉 Correction des traductions et utilitaires terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 