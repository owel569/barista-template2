#!/usr/bin/env node

/**
 * Script de correction ultime et complet
 * Traite toutes les erreurs restantes avec une approche systématique
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Fonction pour corriger les guillemets mal formatés
function fixMalformedQuotes(content) {
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
  
  // Corriger les chaînes avec des guillemets mal formatés
  content = content.replace(/"([^"]*)"([^"]*)/g, '"$1$2"');
  content = content.replace(/'([^']*)'([^']*)/g, "'$1$2'");
  
  return content;
}

// Fonction pour corriger les types any
function fixAnyTypes(content) {
  // Remplacer les types any par unknown ou des types plus spécifiques
  content = content.replace(/: any\b/g, ': unknown');
  content = content.replace(/any\[\]/g, 'unknown[]');
  content = content.replace(/Promise<any>/g, 'Promise<unknown>');
  content = content.replace(/Array<any>/g, 'Array<unknown>');
  content = content.replace(/Record<string, any>/g, 'Record<string, unknown>');
  
  // Corriger les paramètres de fonction avec any
  content = content.replace(/\(([^)]*): any([^)]*)\)/g, '($1: unknown$2)');
  
  // Corriger les retours de fonction avec any
  content = content.replace(/:\s*any\s*{/g, ': unknown {');
  content = content.replace(/:\s*any\s*=>/g, ': unknown =>');
  
  return content;
}

// Fonction pour corriger les attributs JSX
function fixJSXAttributes(content) {
  // Corriger les attributs className sans guillemets
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)/g, 'className="$1"');
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)\s+([a-zA-Z0-9\-_:]+)/g, 'className="$1 $2"');
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)\s+([a-zA-Z0-9\-_:]+)\s+([a-zA-Z0-9\-_:]+)/g, 'className="$1 $2 $3"');
  
  // Corriger les autres attributs sans guillemets
  content = content.replace(/id=([a-zA-Z0-9\-_]+)/g, 'id="$1"');
  content = content.replace(/type=([a-zA-Z0-9\-_]+)/g, 'type="$1"');
  content = content.replace(/htmlFor=([a-zA-Z0-9\-_]+)/g, 'htmlFor="$1"');
  content = content.replace(/placeholder=([^>\s]+)/g, 'placeholder="$1"');
  content = content.replace(/name=([a-zA-Z0-9\-_]+)/g, 'name="$1"');
  content = content.replace(/value=([^>\s]+)/g, 'value="$1"');
  
  // Corriger les expressions JSX mal formatées
  content = content.replace(/\{\s*\\"([^"]*)\\"\s*\}/g, '{"$1"}');
  content = content.replace(/\{\s*\\'([^']*)\\'\\s*\}/g, "{'$1'}");
  
  return content;
}

// Fonction pour corriger les propriétés d'objet
function fixObjectProperties(content) {
  // Corriger les propriétés avec des guillemets échappés
  content = content.replace(/([a-zA-Z0-9\-_]+)\?\s*":\s*([^;]+);/g, '  $1?: $2;');
  content = content.replace(/([a-zA-Z0-9\-_]+)\s*":\s*([^;]+);/g, '  $1: $2;');
  
  // Corriger les propriétés avec des guillemets mal formatés
  content = content.replace(/"([^"]+)":\s*"([^"]+)"/g, '  $1: "$2"');
  content = content.replace(/'([^']+)':\s*'([^']+)'/g, '  $1: "$2"');
  
  // Corriger les interfaces mal formatées
  content = content.replace(/export\s+interface\s+([a-zA-Z0-9\-_]+)\s*{/g, 'export interface $1 {');
  
  return content;
}

// Fonction pour corriger les fonctions
function fixFunctions(content) {
  // Corriger les signatures de fonction mal formatées
  content = content.replace(/function\s+([a-zA-Z0-9\-_]+)\s*\(\s*([^)]*)\s*\)\s*:\s*([^{]*)\s*{/g, 
    'export function $1($2): $3 {');
  
  // Corriger les fonctions fléchées mal formatées
  content = content.replace(/const\s+([a-zA-Z0-9\-_]+)\s*=\s*\(\s*([^)]*)\s*\)\s*:\s*([^=]*)\s*=>/g,
    'const $1 = ($2): $3 =>');
  
  // Corriger les paramètres de fonction mal formatés
  content = content.replace(/\(\s*([^)]*):\s*any\s*([^)]*)\s*\)/g, '($1: unknown$2)');
  
  return content;
}

// Fonction pour corriger les chaînes de caractères
function fixStringLiterals(content) {
  // Corriger les chaînes avec des guillemets mal fermés
  content = content.replace(/"([^"]*)$/gm, '"$1"');
  content = content.replace(/'([^']*)$/gm, "'$1'");
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  // Corriger les chaînes avec des guillemets mal formatés
  content = content.replace(/"([^"]*)"([^"]*)/g, '"$1$2"');
  content = content.replace(/'([^']*)'([^']*)/g, "'$1$2'");
  
  return content;
}

// Fonction principale de correction
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer toutes les corrections
    const newContent = fixMalformedQuotes(
      fixAnyTypes(
        fixJSXAttributes(
          fixObjectProperties(
            fixFunctions(
              fixStringLiterals(content)
            )
          )
        )
      )
    );
    
    if (newContent !== content) {
      content = newContent;
      hasChanges = true;
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
  console.log('🔧 Début de la correction ultime et complète...\n');
  
  // Trouver tous les fichiers avec des erreurs
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Traiter tous les fichiers
  allFiles.forEach(file => {
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
    console.log('\n🎉 Correction ultime et complète terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 