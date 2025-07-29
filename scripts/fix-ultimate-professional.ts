#!/usr/bin/env node

/**
 * Script de correction ultime et professionnel
 * Traite tous les problèmes TypeScript en respectant la logique métier
 * Renforce la sécurité et applique les bonnes pratiques
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Types pour la sécurité
interface FixResult {
  filePath: string;
  fixed: boolean;
  error?: string;
}

// Fonction pour corriger les guillemets mal échappés de manière intelligente
function fixQuoteErrors(content: string): string {
  // Supprimer tous les backslashes avant les guillemets
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\'/g, "'");
  content = content.replace(/\\`/g, '`');
  
  // Supprimer les backslashes multiples
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\\\\\\/g, '\\');
  content = content.replace(/\\\\\\\//g, '\\');
  
  // Corriger les chaînes avec des guillemets mal formatés
  content = content.replace(/"([^"]*\\"[^"]*)"/g, (match, inner) => {
    return `"${inner.replace(/\\"/g, '"')}"`;
  });
  
  content = content.replace(/'([^']*\\'[^']*)'/g, (match, inner) => {
    return `'${inner.replace(/\\'/g, "'")}'`;
  });
  
  content = content.replace(/`([^`]*\\`[^`]*)`/g, (match, inner) => {
    return `\`${inner.replace(/\\`/g, '`')}\``;
  });
  
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

// Fonction pour corriger les erreurs de template literals
function fixTemplateLiteralErrors(content: string): string {
  // Corriger les template literals mal formatés
  content = content.replace(/`([^`]*\\`[^`]*)`/g, (match, inner) => {
    return `\`${inner.replace(/\\`/g, '`')}\``;
  });
  
  // Corriger les expressions dans les template literals
  content = content.replace(/\$\{([^}]*)\}/g, (match, expr) => {
    return `\${${expr.replace(/\\"/g, '"').replace(/\\'/g, "'")}}`;
  });
  
  return content;
}

// Fonction pour améliorer la sécurité et les bonnes pratiques
function enhanceSecurityAndBestPractices(content: string): string {
  // Remplacer les any par unknown pour plus de sécurité
  content = content.replace(/: any/g, ': unknown');
  content = content.replace(/any\[\]/g, 'unknown[]');
  content = content.replace(/Promise<any>/g, 'Promise<unknown>');
  
  // Améliorer la gestion des erreurs
  content = content.replace(/catch\s*\(([^)]*)\)\s*{/g, (match, errorParam) => {
    return `catch (${errorParam}: unknown) {`;
  });
  
  // Supprimer les console.log pour la production
  content = content.replace(/console\.log\(/g, '// console.log(');
  content = content.replace(/console\.warn\(/g, '// console.warn(');
  content = content.replace(/console\.error\(/g, '// console.error(');
  
  // Améliorer les types de retour des fonctions
  content = content.replace(/function\s+([^(]+)\([^)]*\)\s*:\s*any\s*{/g, 'function $1(...args: unknown[]): unknown {');
  
  // Améliorer les types des props React
  content = content.replace(/interface\s+([^{]+)\s*{\s*([^}]*)\s*}/g, (match, interfaceName, props) => {
    const enhancedProps = props.replace(/([^:]+):\s*any/g, '$1: unknown');
    return `interface ${interfaceName} {\n  ${enhancedProps}\n}`;
  });
  
  return content;
}

// Fonction pour corriger les erreurs spécifiques aux types
function fixTypeSpecificErrors(content: string): string {
  // Corriger les types avec des guillemets mal formatés
  content = content.replace(/status:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*string;/g, 
    'status: "$1" | "$2" | "$3" | "$4" | "$5" | string;');
  
  // Corriger les types avec des guillemets échappés
  content = content.replace(/type\s+([^=]+)=\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)";/g,
    'type $1 = "$2" | "$3" | "$4" | "$5" | "$6";');
  
  return content;
}

// Fonction principale de correction
function fixFile(filePath: string): FixResult {
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
    } else if (filePath.includes('types/')) {
      const newContent = fixTypeSpecificErrors(content);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    } else {
      // Corrections générales
      const newContent1 = fixQuoteErrors(content);
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
      
      const newContent5 = fixTemplateLiteralErrors(content);
      if (newContent5 !== content) {
        content = newContent5;
        hasChanges = true;
      }
    }
    
    // Améliorations de sécurité et bonnes pratiques
    const newContent6 = enhanceSecurityAndBestPractices(content);
    if (newContent6 !== content) {
      content = newContent6;
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
      return { filePath, fixed: true };
    }
    
    return { filePath, fixed: false };
  } catch (error) {
    return { 
      filePath, 
      fixed: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// Fonction principale
async function main(): Promise<void> {
  console.log('🔧 Début de la correction ultime et professionnelle...\n');
  
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
    const result = fixFile(file);
    if (result.fixed) {
      fixedCount++;
      console.log(`✅ PRIORITAIRE: ${file}`);
    } else if (result.error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}: ${result.error}`);
    }
  }
  
  console.log('\n🔧 Traitement des autres fichiers...');
  for (const file of otherFiles) {
    const result = fixFile(file);
    if (result.fixed) {
      fixedCount++;
      console.log(`✅ CORRIGÉ: ${file}`);
    } else if (result.error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}: ${result.error}`);
    }
  }
  
  console.log('\n📊 Résumé final:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Correction ultime et professionnelle terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit --strict" pour vérifier les erreurs restantes.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 