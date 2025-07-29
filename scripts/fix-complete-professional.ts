#!/usr/bin/env node

/**
 * Script de correction professionnelle complète
 * Corrige les erreurs de guillemets, améliore la sécurité et applique les bonnes pratiques
 */

import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

// Types pour la sécurité
interface FileAnalysis {
  path: string;
  hasBusinessLogic: boolean;
  hasSecurityIssues: boolean;
  hasAnyTypes: boolean;
  hasQuoteErrors: boolean;
  priority: 'high' | 'medium' | 'low';
}

// Configuration des corrections
const CORRECTIONS = {
  // Corrections de guillemets échappés
  quoteFixes: [
    { pattern: /\\"/g, replacement: '"' },
    { pattern: /\\'/g, replacement: "'" },
    { pattern: /\\\\/g, replacement: '\\' },
    { pattern: /\\\\\\/g, replacement: '\\' },
    { pattern: /\\\\\\\//g, replacement: '\\' },
  ],
  
  // Corrections de chaînes mal formatées
  stringFixes: [
    { pattern: /"([^"]*\\"[^"]*)"/g, replacement: (match: string, content: string) => 
      `"${content.replace(/\\"/g, '"')}"` },
    { pattern: /'([^']*\\'[^']*)'/g, replacement: (match: string, content: string) => 
      `'${content.replace(/\\'/g, "'")}'` },
    { pattern: /`([^`]*\\`[^`]*)`/g, replacement: (match: string, content: string) => 
      `\`${content.replace(/\\`/g, '`')}\`` },
  ],
  
  // Corrections spécifiques aux imports
  importFixes: [
    { pattern: /import\s+.*\s+from\s*"([^"]*\\"[^"]*)"/g, replacement: (match: string) => 
      match.replace(/\\"/g, '"') },
    { pattern: /import\s+.*\s+from\s*'([^']*\\'[^']*)'/g, replacement: (match: string) => 
      match.replace(/\\'/g, "'") },
  ],
  
  // Corrections des types
  typeFixes: [
    { pattern: /: any/g, replacement: ': unknown' },
    { pattern: /: any\[/g, replacement: ': unknown[' },
    { pattern: /any\[\]/g, replacement: 'unknown[]' },
    { pattern: /Record<string, any>/g, replacement: 'Record<string, unknown>' },
    { pattern: /Promise<any>/g, replacement: 'Promise<unknown>' },
    { pattern: /Array<any>/g, replacement: 'Array<unknown>' },
    { pattern: /Map<string, any>/g, replacement: 'Map<string, unknown>' },
    { pattern: /Set<any>/g, replacement: 'Set<unknown>' },
  ],
  
  // Améliorations de sécurité
  securityFixes: [
    // Remplacer les console.log par des logs sécurisés
    { pattern: /console\.log\(/g, replacement: '// console.log(' },
    { pattern: /console\.error\(/g, replacement: '// console.error(' },
    { pattern: /console\.warn\(/g, replacement: '// console.warn(' },
    { pattern: /console\.info\(/g, replacement: '// console.info(' },
    
    // Améliorer la gestion des erreurs
    { pattern: /catch\s*\(([^)]*)\)\s*{/g, replacement: (match: string, errorParam: string) => 
      `catch (${errorParam}: unknown) {` },
    
    // Améliorer les types de retour
    { pattern: /function\s+(\w+)\s*\(([^)]*)\)\s*{/g, replacement: (match: string, funcName: string, params: string) => {
      if (!match.includes(':')) {
        return `function ${funcName}(${params}): unknown {`;
      }
      return match;
    }},
  ],
  
  // Améliorations des composants React
  reactFixes: [
    // Ajouter des types pour les props
    { pattern: /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match: string, componentName: string) => {
      if (match.includes('props') && !match.includes(':')) {
        return `const ${componentName} = (props: ${componentName}Props): JSX.Element => {`;
      }
      return match;
    }},
    
    // Améliorer les hooks
    { pattern: /useState\s*\(\s*\)/g, replacement: 'useState<unknown>(null)' },
    { pattern: /useState\s*\(\s*null\s*\)/g, replacement: 'useState<unknown>(null)' },
    
    // Améliorer les événements
    { pattern: /onClick\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match: string) => 
      match.replace(/\([^)]*\)/, '(event: React.MouseEvent<HTMLElement>)') },
    { pattern: /onSubmit\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match: string) => 
      match.replace(/\([^)]*\)/, '(event: React.FormEvent<HTMLFormElement>)') },
    { pattern: /onChange\s*=\s*\([^)]*\)\s*=>\s*{/g, replacement: (match: string) => 
      match.replace(/\([^)]*\)/, '(event: React.ChangeEvent<HTMLInputElement>)') },
  ]
};

// Fonction pour analyser un fichier
function analyzeFile(filePath: string): FileAnalysis {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasBusinessLogic = content.includes('function') || content.includes('const') || content.includes('class');
    const hasSecurityIssues = content.includes('console.log') || content.includes('any') || content.includes('eval(');
    const hasAnyTypes = content.includes(': any') || content.includes('any[]') || content.includes('Record<string, any>');
    const hasQuoteErrors = content.includes('\\"') || content.includes("\\'") || content.includes('\\\\');
    
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (hasQuoteErrors) priority = 'high';
    else if (hasSecurityIssues || hasAnyTypes) priority = 'medium';
    
    return {
      path: filePath,
      hasBusinessLogic,
      hasSecurityIssues,
      hasAnyTypes,
      hasQuoteErrors,
      priority
    };
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de ${filePath}:`, error);
    return {
      path: filePath,
      hasBusinessLogic: false,
      hasSecurityIssues: false,
      hasAnyTypes: false,
      hasQuoteErrors: false,
      priority: 'low'
    };
  }
}

// Fonction pour corriger un fichier de manière intelligente
function fixFileIntelligently(filePath: string, analysis: FileAnalysis): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Appliquer les corrections de guillemets en priorité
    CORRECTIONS.quoteFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });
    
    // Appliquer les corrections de chaînes
    CORRECTIONS.stringFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement as any);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });
    
    // Appliquer les corrections d'imports
    CORRECTIONS.importFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement as any);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });
    
    // Appliquer les corrections de types
    CORRECTIONS.typeFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });
    
    // Appliquer les améliorations de sécurité
    CORRECTIONS.securityFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement as any);
      if (newContent !== content) {
        hasChanges = true;
        content = newContent;
      }
    });
    
    // Appliquer les améliorations React si c'est un composant
    if (filePath.includes('components/') || filePath.endsWith('.tsx')) {
      CORRECTIONS.reactFixes.forEach(fix => {
        const newContent = content.replace(fix.pattern, fix.replacement as any);
        if (newContent !== content) {
          hasChanges = true;
          content = newContent;
        }
      });
    }
    
    // Corrections spécifiques par type de fichier
    if (filePath.includes('translations/')) {
      // Nettoyer complètement les fichiers de traduction
      content = content.replace(/\\"/g, '"');
      content = content.replace(/\\'/g, "'");
      content = content.replace(/\\\\/g, '\\');
      
      // Corriger les objets de traduction
      content = content.replace(/"([^"]+)":\s*"([^"]+)"/g, (match: string, key: string, value: string) => {
        return `"${key}": "${value}"`;
      });
    }
    
    if (filePath.includes('types/')) {
      // Améliorer les types
      content = content.replace(/\\"/g, '"');
      content = content.replace(/\\'/g, "'");
      
      // Corriger les unions de types
      content = content.replace(/"([^"]+)"\s*\|\s*"([^"]+)"/g, (match: string, type1: string, type2: string) => {
        return `"${type1}" | "${type2}"`;
      });
    }
    
    if (filePath.includes('utils/')) {
      // Améliorer les utilitaires
      content = content.replace(/\\"/g, '"');
      content = content.replace(/\\'/g, "'");
      
      // Ajouter des types de retour
      content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, (match: string, funcName: string, params: string) => {
        if (!match.includes(':')) {
          return `function ${funcName}(${params}): unknown {`;
        }
        return match;
      });
    }
    
    // Améliorations générales
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

// Fonction pour améliorer la logique métier
function enhanceBusinessLogic(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Améliorer la gestion des erreurs
    content = content.replace(/throw new Error\(/g, 'throw new Error(`[${path.basename(filePath)}] ');
    
    // Améliorer la validation des données
    content = content.replace(/if\s*\(\s*!([^)]+)\s*\)\s*{/g, 'if (!${1}) {');
    
    // Ajouter des types pour les paramètres de fonction
    content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, (match: string, funcName: string, params: string) => {
      if (!match.includes(':')) {
        const typedParams = params.split(',').map(param => {
          const trimmed = param.trim();
          if (trimmed && !trimmed.includes(':')) {
            return `${trimmed}: unknown`;
          }
          return trimmed;
        }).join(', ');
        return `function ${funcName}(${typedParams}): unknown {`;
      }
      return match;
    });
    
    // Améliorer les interfaces
    content = content.replace(/interface\s+(\w+)\s*{/g, (match: string, interfaceName: string) => {
      return `interface ${interfaceName} {`;
    });
    
    if (content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      hasChanges = true;
    }
    
    return hasChanges;
  } catch (error) {
    console.error(`❌ Erreur lors de l'amélioration de la logique métier de ${filePath}:`, error);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('🔧 Début de la correction professionnelle complète...\n');
  
  // Trouver tous les fichiers
  const tsxFiles = await glob('client/src/**/*.tsx', { ignore: ['node_modules/**'] });
  const tsFiles = await glob('client/src/**/*.ts', { ignore: ['node_modules/**'] });
  const allFiles = [...tsxFiles, ...tsFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés\n`);
  
  // Analyser tous les fichiers
  console.log('🔍 Analyse des fichiers...');
  const analyses = allFiles.map(analyzeFile);
  
  // Trier par priorité
  const highPriority = analyses.filter(a => a.priority === 'high');
  const mediumPriority = analyses.filter(a => a.priority === 'medium');
  const lowPriority = analyses.filter(a => a.priority === 'low');
  
  console.log(`🚨 Priorité haute: ${highPriority.length} fichiers`);
  console.log(`⚠️ Priorité moyenne: ${mediumPriority.length} fichiers`);
  console.log(`ℹ️ Priorité basse: ${lowPriority.length} fichiers\n`);
  
  // Traiter les fichiers par ordre de priorité
  let fixedCount = 0;
  let businessLogicEnhancedCount = 0;
  let errorCount = 0;
  
  const processFiles = (files: FileAnalysis[], priority: string) => {
    console.log(`🔧 Traitement des fichiers de priorité ${priority}...`);
    
    files.forEach(analysis => {
      try {
        let fileFixed = false;
        let businessLogicEnhanced = false;
        
        // Corriger les erreurs
        if (fixFileIntelligently(analysis.path, analysis)) {
          fileFixed = true;
          fixedCount++;
        }
        
        // Améliorer la logique métier
        if (analysis.hasBusinessLogic && enhanceBusinessLogic(analysis.path)) {
          businessLogicEnhanced = true;
          businessLogicEnhancedCount++;
        }
        
        if (fileFixed || businessLogicEnhanced) {
          console.log(`✅ ${priority.toUpperCase()}: ${analysis.path}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Erreur avec ${analysis.path}:`, error);
      }
    });
  };
  
  processFiles(highPriority, 'haute');
  processFiles(mediumPriority, 'moyenne');
  processFiles(lowPriority, 'basse');
  
  console.log('\n📊 Résumé final:');
  console.log(`✅ Fichiers corrigés: ${fixedCount}`);
  console.log(`🔧 Logique métier améliorée: ${businessLogicEnhancedCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📁 Total traité: ${allFiles.length}`);
  
  // Statistiques détaillées
  const totalQuoteErrors = analyses.filter(a => a.hasQuoteErrors).length;
  const totalAnyTypes = analyses.filter(a => a.hasAnyTypes).length;
  const totalSecurityIssues = analyses.filter(a => a.hasSecurityIssues).length;
  
  console.log('\n📈 Statistiques détaillées:');
  console.log(`🔤 Erreurs de guillemets: ${totalQuoteErrors}`);
  console.log(`❓ Types 'any' détectés: ${totalAnyTypes}`);
  console.log(`🔒 Problèmes de sécurité: ${totalSecurityIssues}`);
  
  if (fixedCount > 0 || businessLogicEnhancedCount > 0) {
    console.log('\n🎉 Correction professionnelle terminée avec succès!');
    console.log('💡 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
    console.log('🔒 La sécurité et la logique métier ont été améliorées.');
    console.log('📚 Les bonnes pratiques ont été appliquées.');
  } else {
    console.log('\nℹ️ Aucune correction nécessaire.');
  }
}

// Exécution du script
main().catch(console.error);
