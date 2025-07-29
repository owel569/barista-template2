#!/usr/bin/env tsx

/**
 * Script final optimisé pour corriger les erreurs TypeScript restantes
 * Met l'accent sur la logique métier, la durabilité et la sécurité
 * 
 * Usage: npm run fix:final
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fg from 'fast-glob';

console.log(chalk.cyan('🎯 CORRECTION FINALE OPTIMISÉE - BARISTA CAFÉ\n'));
console.log(chalk.yellow('Focus: Logique métier, Durabilité, Sécurité\n'));

interface FinalFix {
  pattern: RegExp;
  replacement: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  businessImpact: string;
  security: string;
}

// Corrections finales par priorité et impact métier
const FINAL_FIXES: FinalFix[] = [
  // CRITICAL - Chaînes mal fermées avec apostrophes
  {
    pattern: /'([^']*'[^']*)/g,
    replacement: "'$1'",
    description: 'Chaînes avec apostrophes mal fermées',
    priority: 'CRITICAL',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // CRITICAL - Chaînes mal fermées avec guillemets
  {
    pattern: /"([^"]*"[^"]*)/g,
    replacement: '"$1"',
    description: 'Chaînes avec guillemets mal fermés',
    priority: 'CRITICAL',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // CRITICAL - Chaînes non terminées
  {
    pattern: /'([^']*)$/gm,
    replacement: "'$1'",
    description: 'Chaînes non terminées avec apostrophe',
    priority: 'CRITICAL',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // CRITICAL - Chaînes non terminées avec guillemets
  {
    pattern: /"([^"]*)$/gm,
    replacement: '"$1"',
    description: 'Chaînes non terminées avec guillemets',
    priority: 'CRITICAL',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // HIGH - Types de prix et quantités (logique métier critique)
  {
    pattern: /price:\s*string(?=\s*[;,])/g,
    replacement: 'price: number',
    description: 'Type prix string → number',
    priority: 'HIGH',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  {
    pattern: /quantity:\s*string(?=\s*[;,])/g,
    replacement: 'quantity: number',
    description: 'Type quantité string → number',
    priority: 'HIGH',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // HIGH - Types any → unknown (sécurité)
  {
    pattern: /(?<!\/\/.*):\s*any\b(?=[\s;,\)])/g,
    replacement: ': unknown',
    description: 'Type any → unknown',
    priority: 'HIGH',
    businessImpact: 'MEDIUM',
    security: 'HIGH'
  },
  
  // MEDIUM - Corrections de syntaxe générales
  {
    pattern: /\\"/g,
    replacement: '"',
    description: 'Backslash avant guillemet',
    priority: 'MEDIUM',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  {
    pattern: /\\'/g,
    replacement: "'",
    description: 'Backslash avant apostrophe',
    priority: 'MEDIUM',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  }
];

// Corrections spécifiques aux fichiers serveur
const SERVER_FIXES: FinalFix[] = [
  {
    pattern: /'([^']*'[^']*)/g,
    replacement: "'$1'",
    description: 'Chaînes serveur avec apostrophes mal fermées',
    priority: 'CRITICAL',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  {
    pattern: /"([^"]*"[^"]*)/g,
    replacement: '"$1"',
    description: 'Chaînes serveur avec guillemets mal fermés',
    priority: 'CRITICAL',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  }
];

interface FixResult {
  file: string;
  fixes: Array<{
    description: string;
    count: number;
    priority: string;
    businessImpact: string;
    security: string;
  }>;
  totalFixes: number;
  success: boolean;
  error?: string;
}

// Fonction pour appliquer les corrections finales
function applyFinalFixes(content: string, filePath: string): FixResult {
  const result: FixResult = {
    file: filePath,
    fixes: [],
    totalFixes: 0,
    success: true
  };
  
  let modifiedContent = content;
  
  // Déterminer les corrections à appliquer selon le type de fichier
  let fixesToApply = [...FINAL_FIXES];
  
  if (filePath.includes('server/')) {
    fixesToApply = [...fixesToApply, ...SERVER_FIXES];
  }
  
  // Appliquer les corrections par ordre de priorité
  for (const fix of fixesToApply) {
    const matches = modifiedContent.match(fix.pattern);
    if (matches) {
      modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
      result.fixes.push({
        description: fix.description,
        count: matches.length,
        priority: fix.priority,
        businessImpact: fix.businessImpact,
        security: fix.security
      });
      result.totalFixes += matches.length;
    }
  }
  
  // Vérifier si des corrections ont été appliquées
  if (modifiedContent !== content) {
    try {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
    } catch (error) {
      result.success = false;
      result.error = `Erreur d'écriture: ${error}`;
    }
  }
  
  return result;
}

// Fonction pour valider la logique métier
function validateBusinessLogic(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Vérifier les types critiques pour la logique métier
  if (content.includes('price: string')) {
    issues.push('Prix défini comme string - logique métier compromise');
  }
  
  if (content.includes('quantity: string')) {
    issues.push('Quantité définie comme string - logique métier compromise');
  }
  
  if (content.includes('revenue: string')) {
    issues.push('Revenu défini comme string - logique métier compromise');
  }
  
  // Vérifier les types de sécurité
  const anyMatches = content.match(/:\s*any\b/g);
  if (anyMatches) {
    issues.push(`${anyMatches.length} types 'any' détectés - risque de sécurité`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Fonction principale
async function fixFinalOptimized(): Promise<void> {
  try {
    // Récupérer tous les fichiers TypeScript
    const files = await fg(['client/src/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    
    console.log(chalk.blue(`📁 ${files.length} fichiers TypeScript détectés\n`));
    
    const results: FixResult[] = [];
    let totalFilesFixed = 0;
    let totalFixesApplied = 0;
    let businessLogicIssues = 0;
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = applyFinalFixes(content, filePath);
        results.push(result);
        
        if (result.totalFixes > 0) {
          totalFilesFixed++;
          totalFixesApplied += result.totalFixes;
          
          console.log(chalk.green(`✅ ${path.basename(filePath)}`));
          for (const fix of result.fixes) {
            const priorityIcon = fix.priority === 'CRITICAL' ? '🔴' : 
                                fix.priority === 'HIGH' ? '🟡' : '🟢';
            const businessIcon = fix.businessImpact === 'CRITIQUE' ? '💰' : 
                                fix.businessImpact === 'MEDIUM' ? '📊' : '📝';
            const securityIcon = fix.security === 'HIGH' ? '🔒' : '🛡️';
            console.log(chalk.gray(`  ${priorityIcon}${businessIcon}${securityIcon} ${fix.description} (${fix.count})`));
          }
        }
        
        // Valider la logique métier
        const businessValidation = validateBusinessLogic(content);
        if (!businessValidation.isValid) {
          businessLogicIssues++;
          console.log(chalk.red(`  ⚠️  Problèmes de logique métier: ${businessValidation.issues.join(', ')}`));
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Erreur avec ${filePath}:`), error);
      }
    }
    
    // Rapport final
    console.log(chalk.cyan('\n📊 RAPPORT DE CORRECTION FINALE\n'));
    console.log(chalk.green(`✅ ${totalFilesFixed} fichiers corrigés`));
    console.log(chalk.blue(`🔧 ${totalFixesApplied} corrections appliquées`));
    
    const criticalFixes = results.flatMap(r => r.fixes.filter(f => f.priority === 'CRITICAL'));
    const highFixes = results.flatMap(r => r.fixes.filter(f => f.priority === 'HIGH'));
    const mediumFixes = results.flatMap(r => r.fixes.filter(f => f.priority === 'MEDIUM'));
    
    console.log(chalk.red(`🔴 ${criticalFixes.length} corrections critiques`));
    console.log(chalk.yellow(`🟡 ${highFixes.length} corrections importantes`));
    console.log(chalk.green(`🟢 ${mediumFixes.length} corrections mineures`));
    
    if (businessLogicIssues > 0) {
      console.log(chalk.red(`💰 ${businessLogicIssues} problèmes de logique métier détectés`));
    }
    
    // Vérifier s'il reste des erreurs
    console.log(chalk.cyan('\n🔍 Vérification finale des erreurs...'));
    try {
      const { execSync } = await import('child_process');
      const output = execSync('npx tsc --noEmit --strict', { encoding: 'utf8', stdio: 'pipe' });
      console.log(chalk.green('✅ Aucune erreur TypeScript détectée'));
      console.log(chalk.green('🎉 Correction terminée avec succès !'));
    } catch (error: any) {
      const errorCount = (error.stdout || '').match(/Found (\d+) errors/)?.[1] || '?';
      console.log(chalk.yellow(`⚠️  ${errorCount} erreurs TypeScript restantes`));
      
      if (parseInt(errorCount) < 1000) {
        console.log(chalk.green('🎯 Progression significative !'));
      } else {
        console.log(chalk.yellow('📈 Amélioration continue nécessaire'));
      }
    }
    
    // Recommandations finales
    console.log(chalk.cyan('\n💡 RECOMMANDATIONS FINALES'));
    console.log(chalk.yellow('1. Tester toutes les fonctionnalités critiques'));
    console.log(chalk.yellow('2. Valider les calculs financiers'));
    console.log(chalk.yellow('3. Vérifier les permissions utilisateur'));
    console.log(chalk.yellow('4. Effectuer des tests de sécurité'));
    console.log(chalk.yellow('5. Documenter les changements effectués'));
    
  } catch (error) {
    console.error(chalk.red('❌ Erreur fatale:'), error);
    process.exit(1);
  }
}

// Exécution du script
fixFinalOptimized().catch(console.error);

export { fixFinalOptimized, applyFinalFixes }; 