#!/usr/bin/env node

/**
 * Script de correction ultime et final
 * Traite les erreurs de guillemets manquants dans les attributs JSX
 * et autres problèmes de syntaxe restants
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Fonction pour corriger les attributs JSX sans guillemets
function fixJSXAttributes(content) {
  // Corriger les attributs className sans guillemets
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)/g, 'className="$1"');
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)\s+([a-zA-Z0-9\-_:]+)/g, 'className="$1 $2"');
  content = content.replace(/className=([a-zA-Z0-9\-_:]+)\s+([a-zA-Z0-9\-_:]+)\s+([a-zA-Z0-9\-_:]+)/g, 'className="$1 $2 $3"');
  
  // Corriger les attributs id sans guillemets
  content = content.replace(/id=([a-zA-Z0-9\-_]+)/g, 'id="$1"');
  
  // Corriger les attributs type sans guillemets
  content = content.replace(/type=([a-zA-Z0-9\-_]+)/g, 'type="$1"');
  
  // Corriger les attributs htmlFor sans guillemets
  content = content.replace(/htmlFor=([a-zA-Z0-9\-_]+)/g, 'htmlFor="$1"');
  
  // Corriger les attributs placeholder sans guillemets
  content = content.replace(/placeholder=([^>\s]+)/g, 'placeholder="$1"');
  
  // Corriger les attributs min sans guillemets
  content = content.replace(/min=([^>\s]+)/g, 'min="$1"');
  
  // Corriger les attributs max sans guillemets
  content = content.replace(/max=([^>\s]+)/g, 'max="$1"');
  
  // Corriger les attributs step sans guillemets
  content = content.replace(/step=([^>\s]+)/g, 'step="$1"');
  
  // Corriger les attributs name sans guillemets
  content = content.replace(/name=([a-zA-Z0-9\-_]+)/g, 'name="$1"');
  
  // Corriger les attributs value sans guillemets (quand c'est une chaîne)
  content = content.replace(/value=([a-zA-Z0-9\-_]+)(?!\s*\{)/g, 'value="$1"');
  
  // Corriger les attributs onChange sans guillemets
  content = content.replace(/onChange=([^>\s]+)/g, 'onChange="$1"');
  
  // Corriger les attributs onSubmit sans guillemets
  content = content.replace(/onSubmit=([^>\s]+)/g, 'onSubmit="$1"');
  
  return content;
}

// Fonction pour corriger les chaînes mal fermées
function fixUnterminatedStrings(content) {
  // Corriger les chaînes avec des guillemets manquants
  content = content.replace(/"([^"]*)$/gm, '"$1"');
  content = content.replace(/'([^']*)$/gm, "'$1'");
  
  // Corriger les chaînes avec des backslashes mal échappés
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\\\/g, '\\');
  
  // Corriger les chaînes avec des caractères spéciaux
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\\t/g, ' ');
  content = content.replace(/\\r/g, ' ');
  
  return content;
}

// Fonction pour corriger les expressions JSX mal formatées
function fixJSXExpressions(content) {
  // Corriger les expressions avec des guillemets échappés
  content = content.replace(/\{\s*\\"([^"]*)\\"\s*\}/g, '{"$1"}');
  content = content.replace(/\{\s*\\'([^']*)\\'\\s*\}/g, "{'$1'}");
  
  // Corriger les expressions avec des guillemets manquants
  content = content.replace(/\{\s*([a-zA-Z0-9\-_]+)\s*\}/g, '{"$1"}');
  
  // Corriger les expressions avec des opérateurs ternaires mal formatés
  content = content.replace(/\?\s*([a-zA-Z0-9\-_]+)\s*:\s*"([^"]*)/g, '? "$1" : "$2"');
  
  return content;
}

// Fonction pour corriger les objets de traduction
function fixTranslationObjects(content) {
  // Corriger les clés avec des guillemets doubles
  content = content.replace(/""([^"]+)":\s*""([^"]+)"/g, '"$1": "$2"');
  content = content.replace(/""([^"]+)":\s*"([^"]+)"/g, '"$1": "$2"');
  
  // Corriger les clés avec des guillemets simples
  content = content.replace(/''([^']+)':\s*''([^']+)'/g, '"$1": "$2"');
  content = content.replace(/''([^']+)':\s*'([^']+)'/g, '"$1": "$2"');
  
  // Corriger les objets mal fermés
  content = content.replace(/};''"'"/g, '};');
  content = content.replace(/};''"/g, '};');
  
  return content;
}

// Fonction pour corriger les types mal formatés
function fixTypeDefinitions(content) {
  // Corriger les propriétés avec des guillemets échappés
  content = content.replace(/([a-zA-Z0-9\-_]+)\?\s*":\s*([^;]+);/g, '$1?: $2;');
  content = content.replace(/([a-zA-Z0-9\-_]+)\s*":\s*([^;]+);/g, '$1: $2;');
  
  // Corriger les types avec des guillemets mal formatés
  content = content.replace(/type:\s*"([^"]+)"\s*\|\s*"([^"]+)"/g, 'type: "$1" | "$2"');
  
  return content;
}

// Fonction pour corriger les template literals mal formatés
function fixTemplateLiterals(content) {
  // Corriger les template literals avec des backticks échappés
  content = content.replace(/`([^`]*\\`[^`]*)`/g, (match, inner) => {
    return `\`${inner.replace(/\\`/g, '`')}\``;
  });
  
  // Corriger les expressions dans les template literals
  content = content.replace(/\$\{([^}]*)\}/g, (match, expr) => {
    return `\${${expr.replace(/\\"/g, '"').replace(/\\'/g, "'")}}`;
  });
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux fichiers
function fixFileSpecificErrors(content, filePath) {
  if (filePath.includes('Reservations.tsx')) {
    // Corrections spécifiques pour Reservations.tsx
    content = content.replace(/className=text-4xl font-bold text-gray-900 mb-4/g, 'className="text-4xl font-bold text-gray-900 mb-4"');
    content = content.replace(/className=grid lg:grid-cols-2 gap-12/g, 'className="grid lg:grid-cols-2 gap-12"');
    content = content.replace(/className=shadow-xl border-gray-200/g, 'className="shadow-xl border-gray-200"');
    content = content.replace(/className=bg-gradient-to-r from-amber-600 to-orange-600 text-white/g, 'className="bg-gradient-to-r from-amber-600 to-orange-600 text-white"');
    content = content.replace(/className=mr-2 h-5 w-5/g, 'className="mr-2 h-5 w-5"');
    content = content.replace(/className="p-8/g, 'className="p-8"');
    content = content.replace(/className="space-y-6/g, 'className="space-y-6"');
    content = content.replace(/htmlFor=name"/g, 'htmlFor="name"');
    content = content.replace(/className="block text-sm font-medium text-gray-700 mb-2/g, 'className="block text-sm font-medium text-gray-700 mb-2"');
    content = content.replace(/id=name"/g, 'id="name"');
    content = content.replace(/type=text"/g, 'type="text"');
    content = content.replace(/placeholder="Votre nom complet/g, 'placeholder="Votre nom complet"');
    content = content.replace(/type=email"/g, 'type="email"');
    content = content.replace(/placeholder="votre@email.com/g, 'placeholder="votre@email.com"');
    content = content.replace(/type=tel"/g, 'type="tel"');
    content = content.replace(/placeholder=+33 1 23 45 67 89/g, 'placeholder="+33 1 23 45 67 89"');
    content = content.replace(/htmlFor="date className=block text-sm font-medium text-gray-700 mb-2/g, 'htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2"');
    content = content.replace(/handleInputChange\(date", e\.target\.value\)/g, 'handleInputChange("date", e.target.value)');
    content = content.replace(/min={new Date\(\)\.toISOString\( \|\| ' \|\|  \|\| '\)\.split\(T\)\[0\]}/g, 'min={new Date().toISOString().split("T")[0]}');
    content = content.replace(/className=text-red-500 text-sm mt-1/g, 'className="text-red-500 text-sm mt-1"');
    content = content.replace(/htmlFor=time className="block text-sm font-medium text-gray-700 mb-2/g, 'htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2"');
    content = content.replace(/errors\.time \? border-red-500" : border-gray-300"/g, 'errors.time ? "border-red-500" : "border-gray-300"');
    content = content.replace(/errors\.guests \? border-red-500 : "border-gray-300/g, 'errors.guests ? "border-red-500" : "border-gray-300"');
  }
  
  if (filePath.includes('translations/fr.ts')) {
    // Corrections spécifiques pour les traductions
    content = content.replace(/""home\.message": ""([^"]+)"/g, '"home.message": "$1"');
    content = content.replace(/""about\.mission\.title": ""([^"]+)"/g, '"about.mission.title": "$1"');
    content = content.replace(/""about\.mission\.content": ""([^"]+)"/g, '"about.mission.content": "$1"');
    content = content.replace(/""admin\.login": ""([^"]+)"/g, '"admin.login": "$1"');
    content = content.replace(/""admin\.username": ""([^"]+)"/g, '"admin.username": "$1"');
  }
  
  if (filePath.includes('types/admin.ts')) {
    // Corrections spécifiques pour les types admin
    content = content.replace(/data\?\s*":\s*T;/g, 'data?: T;');
    content = content.replace(/specialRequests\?\s*":\s*string;/g, 'specialRequests?: string;');
    content = content.replace(/downloadUrl\?\s*":\s*string;/g, 'downloadUrl?: string;');
    content = content.replace(/validation\?\s*":\s*{/g, 'validation?: {');
    content = content.replace(/page\?\s*":\s*number;/g, 'page?: number;');
  }
  
  if (filePath.includes('types/stats.ts')) {
    // Corrections spécifiques pour les types stats
    content = content.replace(/^\s*"\s*$/gm, '');
  }
  
  return content;
}

// Fonction principale de correction
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer les corrections selon le type de fichier
    const newContent1 = fixJSXAttributes(content);
    if (newContent1 !== content) {
      content = newContent1;
      hasChanges = true;
    }
    
    const newContent2 = fixUnterminatedStrings(content);
    if (newContent2 !== content) {
      content = newContent2;
      hasChanges = true;
    }
    
    const newContent3 = fixJSXExpressions(content);
    if (newContent3 !== content) {
      content = newContent3;
      hasChanges = true;
    }
    
    const newContent4 = fixTranslationObjects(content);
    if (newContent4 !== content) {
      content = newContent4;
      hasChanges = true;
    }
    
    const newContent5 = fixTypeDefinitions(content);
    if (newContent5 !== content) {
      content = newContent5;
      hasChanges = true;
    }
    
    const newContent6 = fixTemplateLiterals(content);
    if (newContent6 !== content) {
      content = newContent6;
      hasChanges = true;
    }
    
    const newContent7 = fixFileSpecificErrors(content, filePath);
    if (newContent7 !== content) {
      content = newContent7;
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
  console.log('🔧 Début de la correction ultime et finale...\n');
  
  // Trouver tous les fichiers avec des erreurs
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Traiter les fichiers prioritaires en premier
  const priorityFiles = allFiles.filter(file => 
    file.includes('Reservations.tsx') ||
    file.includes('translations/') || 
    file.includes('types/')
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
    console.log('\n🎉 Correction ultime et finale terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 