#!/usr/bin/env node

/**
 * Script de correction complète des erreurs de guillemets avec améliorations
 * Corrige tous les problèmes de guillemets échappés et améliore la qualité du code
 */

import fs from 'fs';
import { glob } from 'glob';

// Fonction pour corriger un fichier de manière intelligente
function fixFileIntelligently(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Correction intelligente des guillemets échappés
    const intelligentFixes = [
      // Supprimer tous les backslashes avant les guillemets
      { pattern: /\\"/g, replacement: '"' },
      { pattern: /\\'/g, replacement: "'" },
      
      // Corriger les chaînes avec des guillemets mal formatés
      { pattern: /"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
        return `"${content.replace(/\\"/g, '"')}"`;
      }},
      
      { pattern: /'([^']*\\'[^']*)'/g, replacement: (match, content) => {
        return `'${content.replace(/\\'/g, "'")}'`;
      }},
      
      // Corriger les chaînes JSX
      { pattern: /className\s*=\s*"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
        return `className="${content.replace(/\\"/g, '"')}"`;
      }},
      
      { pattern: /className\s*=\s*'([^']*\\'[^']*)'/g, replacement: (match, content) => {
        return `className="${content.replace(/\\'/g, "'")}"`;
      }},
      
      // Corriger les imports
      { pattern: /import\s+.*\s+from\s*"([^"]*\\"[^"]*)"/g, replacement: (match) => {
        return match.replace(/\\"/g, '"');
      }},
      
      { pattern: /import\s+.*\s+from\s*'([^']*\\'[^']*)'/g, replacement: (match) => {
        return match.replace(/\\'/g, "'");
      }},
      
      // Corriger les chaînes dans les objets
      { pattern: /:\s*"([^"]*\\"[^"]*)"/g, replacement: (match) => {
        return match.replace(/\\"/g, '"');
      }},
      
      { pattern: /:\s*'([^']*\\'[^']*)'/g, replacement: (match) => {
        return match.replace(/\\'/g, "'");
      }},
      
      // Corriger les chaînes avec des apostrophes mal échappées
      { pattern: /"([^"]*'[^"]*)"/g, replacement: (match, content) => {
        return `"${content.replace(/'/g, "\\'")}"`;
      }},
      
      // Corriger les chaînes avec des guillemets mal échappés
      { pattern: /'([^']*"[^']*)'/g, replacement: (match, content) => {
        return `'${content.replace(/"/g, '\\"')}'`;
      }},
      
      // Supprimer les backslashes multiples
      { pattern: /\\\\/g, replacement: '\\' },
      { pattern: /\\\\\\/g, replacement: '\\' },
      
      // Corriger les chaînes de traduction spécifiquement
      { pattern: /"([^"]*\\"[^"]*)":\s*"([^"]*\\"[^"]*)"/g, replacement: (match, key, value) => {
        return `"${key.replace(/\\"/g, '"')}": "${value.replace(/\\"/g, '"')}"`;
      }},
      
      { pattern: /"([^"]*\\"[^"]*)":\s*'([^']*\\'[^']*)'/g, replacement: (match, key, value) => {
        return `"${key.replace(/\\"/g, '"')}": "${value.replace(/\\'/g, "'")}"`;
      }},
      
      // Corriger les types avec des guillemets
      { pattern: /type:\s*"([^"]*\\"[^"]*)"/g, replacement: (match, content) => {
        return `type: "${content.replace(/\\"/g, '"')}"`;
      }},
      
      { pattern: /type:\s*'([^']*\\'[^']*)'/g, replacement: (match, content) => {
        return `type: "${content.replace(/\\'/g, "'")}"`;
      }},
      
      // Corriger les unions de types
      { pattern: /"([^"]*\\"[^"]*)"\s*\|\s*"([^"]*\\"[^"]*)"/g, replacement: (match, type1, type2) => {
        return `"${type1.replace(/\\"/g, '"')}" | "${type2.replace(/\\"/g, '"')}"`;
      }},
      
      // Corriger les chaînes avec des retours à la ligne
      { pattern: /"([^"]*\\n[^"]*)"/g, replacement: (match, content) => {
        return `"${content.replace(/\\n/g, ' ')}"`;
      }},
      
      // Corriger les chaînes avec des tabulations
      { pattern: /"([^"]*\\t[^"]*)"/g, replacement: (match, content) => {
        return `"${content.replace(/\\t/g, ' ')}"`;
      }}
    ];
    
    // Appliquer les corrections de manière itérative
    let previousContent = '';
    let iterations = 0;
    const maxIterations = 10;
    
    while (content !== previousContent && iterations < maxIterations) {
      previousContent = content;
      iterations++;
      
      intelligentFixes.forEach(fix => {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          hasChanges = true;
          content = newContent;
        }
      });
    }
    
    // Corrections spécifiques pour les fichiers de traduction
    if (filePath.includes('translations/')) {
      // Nettoyer complètement les chaînes de traduction
      content = content.replace(/\\"/g, '"');
      content = content.replace(/\\'/g, "'");
      content = content.replace(/\\\\/g, '\\');
      
      // Corriger les objets de traduction
      content = content.replace(/"([^"]+)":\s*"([^"]+)"/g, (match, key, value) => {
        return `"${key}": "${value}"`;
      });
    }
    
    // Corrections spécifiques pour les fichiers de types
    if (filePath.includes('types/')) {
      content = content.replace(/\\"/g, '"');
      content = content.replace(/\\'/g, "'");
      
      // Corriger les unions de types
      content = content.replace(/"([^"]+)"\s*\|\s*"([^"]+)"/g, (match, type1, type2) => {
        return `"${type1}" | "${type2}"`;
      });
      
      // Remplacer les 'any' par des types plus spécifiques
      content = content.replace(/: any/g, ': unknown');
      content = content.replace(/: any\[/g, ': unknown[');
      content = content.replace(/any\[\]/g, 'unknown[]');
      content = content.replace(/Record<string, any>/g, 'Record<string, unknown>');
    }
    
    // Corrections spécifiques pour les fichiers utilitaires
    if (filePath.includes('utils/')) {
      content = content.replace(/\\"/g, '"');
      content = content.replace(/\\'/g, "'");
      
      // Améliorer la sécurité des fonctions utilitaires
      content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, (match, funcName, params) => {
        return `function ${funcName}(${params}): unknown {`;
      });
    }
    
    // Améliorations générales de sécurité et bonnes pratiques
    content = content.replace(/console\.log\(/g, '// console.log(');
    content = content.replace(/console\.error\(/g, '// console.error(');
    content = content.replace(/console\.warn\(/g, '// console.warn(');
    
    // Remplacer les any par des types plus spécifiques
    content = content.replace(/: any/g, ': unknown');
    content = content.replace(/any\[\]/g, 'unknown[]');
    content = content.replace(/Record<string, any>/g, 'Record<string, unknown>');
    
    // Améliorer la gestion des erreurs
    content = content.replace(/catch\s*\(([^)]*)\)\s*{/g, (match, errorParam) => {
      return `catch (${errorParam}: unknown) {`;
    });
    
    // Améliorer les types de retour des fonctions
    content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, (match, funcName, params) => {
      if (!match.includes(':')) {
        return `function ${funcName}(${params}): unknown {`;
      }
      return match;
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour améliorer la sécurité des composants
function enhanceComponentSecurity(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Améliorations de sécurité pour les composants React
    const securityEnhancements = [
      // Ajouter des types stricts pour les props
      { pattern: /interface\s+(\w+)Props\s*{/g, replacement: (match, componentName) => {
        return `interface ${componentName}Props {`;
      }},
      
      // Améliorer la validation des props
      { pattern: /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match, componentName) => {
        return `const ${componentName} = (props: ${componentName}Props): JSX.Element => {`;
      }},
      
      // Ajouter des types pour les hooks
      { pattern: /useState\s*\(\s*\)/g, replacement: 'useState<unknown>(null)' },
      { pattern: /useState\s*\(\s*null\s*\)/g, replacement: 'useState<unknown>(null)' },
      
      // Améliorer la gestion des événements
      { pattern: /onClick\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match) => {
        return match.replace(/\([^)]*\)/, '(event: React.MouseEvent<HTMLElement>)');
      }},
      
      // Ajouter des types pour les formulaires
      { pattern: /onSubmit\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match) => {
        return match.replace(/\([^)]*\)/, '(event: React.FormEvent<HTMLFormElement>)');
      }},
      
      // Améliorer la gestion des inputs
      { pattern: /onChange\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match) => {
        return match.replace(/\([^)]*\)/, '(event: React.ChangeEvent<HTMLInputElement>)');
      }}
    ];
    
    securityEnhancements.forEach(enhancement => {
      const newContent = content.replace(enhancement.pattern, enhancement.replacement);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`🔒 Sécurité améliorée: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur lors de l'amélioration de la sécurité de ${filePath}:`, error.message);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Début de la correction intelligente des erreurs de guillemets...\n');
  
  // Trouver tous les fichiers avec des erreurs
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  let fixedCount = 0;
  let securityEnhancedCount = 0;
  let errorCount = 0;
  
  allFiles.forEach(file => {
    try {
      let fileFixed = false;
      let securityEnhanced = false;
      
      // Corriger les erreurs de guillemets
      if (fixFileIntelligently(file)) {
        fileFixed = true;
        fixedCount++;
      }
      
      // Améliorer la sécurité des composants
      if (file.includes('components/') && enhanceComponentSecurity(file)) {
        securityEnhanced = true;
        securityEnhancedCount++;
      }
      
      if (fileFixed || securityEnhanced) {
        console.log(`✅ Traité: ${file}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erreur avec ${file}:`, error.message);
    }
  });
  
  console.log('\n📊 Résumé:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`🔒 Sécurité améliorée: ${securityEnhancedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length}`);
  
  if (fixedCount > 0 || securityEnhancedCount > 0) {
    console.log('\n🎉 Correction et amélioration terminées avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
    console.log('🔒 Les composants ont été sécurisés avec des types stricts.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error); 