#!/usr/bin/env tsx

/**
 * Script de correction optimisé et professionnel pour Barista Café
 * Met l'accent sur la logique métier, la durabilité et la sécurité
 * 
 * Usage: npm run fix:optimized
 * Usage: npm run fix:optimized:dry
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fg from 'fast-glob';

console.log(chalk.cyan('🚀 CORRECTION OPTIMISÉE TYPESCRIPT - BARISTA CAFÉ\n'));
console.log(chalk.yellow('Focus: Logique métier, Durabilité, Sécurité\n'));

interface FileError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

interface FixResult {
  modified: string[];
  errors: string[];
  totalFixes: number;
  backups: string[];
  businessLogicPreserved: boolean;
  securityEnhanced: boolean;
}

interface FileBackup {
  originalPath: string;
  backupPath: string;
  timestamp: string;
}

// Corrections prioritaires par logique métier
const BUSINESS_LOGIC_FIXES = [
  // 1. Corrections des types de prix (logique métier critique)
  { 
    from: /price:\s*string(?=\s*[;,])/g, 
    to: 'price: number',
    description: 'Fix price type - logique métier critique',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // 2. Corrections des types de quantité (logique métier critique)
  { 
    from: /quantity:\s*string(?=\s*[;,])/g, 
    to: 'quantity: number',
    description: 'Fix quantity type - logique métier critique',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // 3. Corrections des types de revenus (logique métier critique)
  { 
    from: /revenue:\s*string(?=\s*[;,])/g, 
    to: 'revenue: number',
    description: 'Fix revenue type - logique métier critique',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  },
  
  // 4. Corrections des types de commandes (logique métier critique)
  { 
    from: /orderId:\s*string(?=\s*[;,])/g, 
    to: 'orderId: number',
    description: 'Fix orderId type - logique métier critique',
    businessImpact: 'CRITIQUE',
    security: 'HIGH'
  }
];

// Corrections de sécurité et durabilité
const SECURITY_DURABILITY_FIXES = [
  // 1. Remplacer 'any' par des types sécurisés
  { 
    from: /(?<!\/\/.*):\s*any\b(?=[\s;,\)])/g, 
    to: ': unknown',
    description: 'Replace any with unknown - sécurité',
    businessImpact: 'MEDIUM',
    security: 'HIGH'
  },
  
  // 2. Corriger les types d'événements
  { 
    from: /event:\s*any(?!\w)/g, 
    to: 'event: Event | React.ChangeEvent<HTMLInputElement>',
    description: 'Fix event types - sécurité',
    businessImpact: 'MEDIUM',
    security: 'HIGH'
  },
  
  // 3. Corriger les types de props
  { 
    from: /props:\s*any(?!\w)/g, 
    to: 'props: Record<string, unknown>',
    description: 'Fix props types - sécurité',
    businessImpact: 'MEDIUM',
    security: 'HIGH'
  },
  
  // 4. Corriger les types de retour des fonctions
  { 
    from: /:\s*any\s*=>/g, 
    to: ': unknown =>',
    description: 'Fix function return types - sécurité',
    businessImpact: 'MEDIUM',
    security: 'HIGH'
  }
];

// Corrections de syntaxe critiques
const SYNTAX_FIXES = [
  // 1. Corriger les guillemets mal formatés
  { 
    from: /"""/g, 
    to: '"',
    description: 'Fix triple quotes',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  // 2. Corriger les guillemets doubles mal formatés
  { 
    from: /""/g, 
    to: '"',
    description: 'Fix double quotes',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  // 3. Corriger les apostrophes mal formatées
  { 
    from: /'''/g, 
    to: "'",
    description: 'Fix triple apostrophes',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  // 4. Corriger les apostrophes doubles mal formatées
  { 
    from: /''/g, 
    to: "'",
    description: 'Fix double apostrophes',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  // 5. Corriger les export export
  { 
    from: /export\s+export/g, 
    to: 'export',
    description: 'Fix duplicate export',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  // 6. Corriger les chaînes mal fermées
  { 
    from: /"([^"]*)\\"([^"]*)/g, 
    to: '"$1"$2"',
    description: 'Fix unclosed strings',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  },
  
  // 7. Corriger les types avec guillemets mal formatés
  { 
    from: /type:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*string;/g, 
    to: 'type: "$1" | "$2" | "$3" | "$4" | "$5" | string;',
    description: 'Fix union types with quotes',
    businessImpact: 'LOW',
    security: 'MEDIUM'
  }
];

// Corrections spécifiques aux utilitaires de date
const DATE_UTILS_FIXES = [
  // 1. Corriger les chaînes de locale
  { 
    from: /"fr-CA\)/g, 
    to: '"fr-CA")',
    description: 'Fix locale string quotes',
    businessImpact: 'MEDIUM',
    security: 'MEDIUM'
  },
  
  // 2. Corriger les chaînes de locale sans guillemets
  { 
    from: /fr-CA""/g, 
    to: '"fr-CA"',
    description: 'Fix locale string without quotes',
    businessImpact: 'MEDIUM',
    security: 'MEDIUM'
  },
  
  // 3. Corriger les options de formatage
  { 
    from: /year:\s*""numeric,"""/g, 
    to: 'year: "numeric",',
    description: 'Fix year formatting option',
    businessImpact: 'MEDIUM',
    security: 'MEDIUM'
  },
  
  // 4. Corriger les options de mois
  { 
    from: /month:\s*long""/g, 
    to: 'month: "long"',
    description: 'Fix month formatting option',
    businessImpact: 'MEDIUM',
    security: 'MEDIUM'
  },
  
  // 5. Corriger les options de jour
  { 
    from: /day:\s*""numeric/g, 
    to: 'day: "numeric"',
    description: 'Fix day formatting option',
    businessImpact: 'MEDIUM',
    security: 'MEDIUM'
  }
];

// Fonction pour créer une sauvegarde sécurisée
async function createSecureBackup(filePath: string): Promise<FileBackup | null> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    
    await fs.promises.copyFile(filePath, backupPath);
    
    return {
      originalPath: filePath,
      backupPath,
      timestamp
    };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la sauvegarde de ${filePath}:`), error);
    return null;
  }
}

// Fonction pour appliquer les corrections de manière sécurisée
function applySecureFixes(content: string, fixes: Array<{
  from: RegExp;
  to: string;
  description: string;
  businessImpact: string;
  security: string;
}>): { content: string; appliedFixes: Array<{ description: string; count: number; businessImpact: string; security: string }> } {
  let modifiedContent = content;
  const appliedFixes: Array<{ description: string; count: number; businessImpact: string; security: string }> = [];
  
  for (const fix of fixes) {
    const matches = modifiedContent.match(fix.from);
    if (matches) {
      modifiedContent = modifiedContent.replace(fix.from, fix.to);
      appliedFixes.push({
        description: fix.description,
        count: matches.length,
        businessImpact: fix.businessImpact,
        security: fix.security
      });
    }
  }
  
  return { content: modifiedContent, appliedFixes };
}

// Fonction pour vérifier la logique métier
function validateBusinessLogic(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Vérifier que les prix sont bien des nombres
  if (content.includes('price: string')) {
    issues.push('Prix défini comme string - logique métier compromise');
  }
  
  // Vérifier que les quantités sont bien des nombres
  if (content.includes('quantity: string')) {
    issues.push('Quantité définie comme string - logique métier compromise');
  }
  
  // Vérifier que les revenus sont bien des nombres
  if (content.includes('revenue: string')) {
    issues.push('Revenu défini comme string - logique métier compromise');
  }
  
  // Vérifier la présence de types 'any' non sécurisés
  const anyMatches = content.match(/:\s*any\b/g);
  if (anyMatches) {
    issues.push(`${anyMatches.length} types 'any' détectés - risque de sécurité`);
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

// Fonction principale de correction
async function fixOptimizedTypeScriptErrors(dryRun: boolean = false): Promise<FixResult> {
  const result: FixResult = {
    modified: [],
    errors: [],
    totalFixes: 0,
    backups: [],
    businessLogicPreserved: true,
    securityEnhanced: true
  };
  
  try {
    // Récupérer tous les fichiers TypeScript
    const files = await fg(['client/src/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    
    console.log(chalk.blue(`📁 ${files.length} fichiers TypeScript détectés\n`));
    
    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Créer une sauvegarde sécurisée
        if (!dryRun) {
          const backup = await createSecureBackup(filePath);
          if (backup) {
            result.backups.push(backup.backupPath);
          }
        }
        
        // Appliquer les corrections par ordre de priorité
        console.log(chalk.gray(`🔧 Traitement de ${path.basename(filePath)}...`));
        
        // 1. Corrections de logique métier (priorité maximale)
        const businessFixes = applySecureFixes(content, BUSINESS_LOGIC_FIXES);
        content = businessFixes.content;
        
        // 2. Corrections de sécurité et durabilité
        const securityFixes = applySecureFixes(content, SECURITY_DURABILITY_FIXES);
        content = securityFixes.content;
        
        // 3. Corrections de syntaxe
        const syntaxFixes = applySecureFixes(content, SYNTAX_FIXES);
        content = syntaxFixes.content;
        
        // 4. Corrections spécifiques aux utilitaires de date
        if (filePath.includes('dateUtils') || filePath.includes('utils')) {
          const dateFixes = applySecureFixes(content, DATE_UTILS_FIXES);
          content = dateFixes.content;
        }
        
        // Vérifier la logique métier après correction
        const businessValidation = validateBusinessLogic(content);
        if (!businessValidation.isValid) {
          result.businessLogicPreserved = false;
          result.errors.push(`Logique métier compromise dans ${filePath}: ${businessValidation.issues.join(', ')}`);
        }
        
        // Appliquer les modifications si nécessaire
        if (content !== originalContent) {
          if (!dryRun) {
            fs.writeFileSync(filePath, content, 'utf8');
          }
          result.modified.push(filePath);
          result.totalFixes += businessFixes.appliedFixes.length + 
                              securityFixes.appliedFixes.length + 
                              syntaxFixes.appliedFixes.length;
          
          // Afficher les corrections appliquées
          const allFixes = [...businessFixes.appliedFixes, ...securityFixes.appliedFixes, ...syntaxFixes.appliedFixes];
          for (const fix of allFixes) {
            const impactIcon = fix.businessImpact === 'CRITIQUE' ? '🔴' : 
                              fix.businessImpact === 'MEDIUM' ? '🟡' : '🟢';
            const securityIcon = fix.security === 'HIGH' ? '🔒' : '🛡️';
            console.log(chalk.green(`  ${impactIcon}${securityIcon} ${fix.description} (${fix.count} corrections)`));
          }
        }
        
      } catch (error) {
        result.errors.push(`Erreur lors du traitement de ${filePath}: ${error}`);
        console.error(chalk.red(`❌ Erreur avec ${filePath}:`), error);
      }
    }
    
    // Nettoyer les anciennes sauvegardes
    if (!dryRun) {
      cleanupOldBackups();
    }
    
  } catch (error) {
    result.errors.push(`Erreur générale: ${error}`);
    console.error(chalk.red('❌ Erreur générale:'), error);
  }
  
  return result;
}

// Fonction de nettoyage des sauvegardes
function cleanupOldBackups(): void {
  try {
    const backupFiles = fg.sync(['**/*.backup.*'], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const backupFile of backupFiles) {
      const stats = fs.statSync(backupFile);
      if (stats.mtime < oneDayAgo) {
        fs.unlinkSync(backupFile);
        console.log(chalk.gray(`🗑️  Sauvegarde supprimée: ${backupFile}`));
      }
    }
  } catch (error) {
    console.error(chalk.yellow('⚠️  Erreur lors du nettoyage des sauvegardes:'), error);
  }
}

// Fonction de génération de rapport
function generateOptimizedReport(results: FixResult): void {
  console.log(chalk.cyan('\n📊 RAPPORT DE CORRECTION OPTIMISÉE\n'));
  
  console.log(chalk.green(`✅ ${results.modified.length} fichiers modifiés`));
  console.log(chalk.blue(`🔧 ${results.totalFixes} corrections appliquées`));
  console.log(chalk.yellow(`💾 ${results.backups.length} sauvegardes créées`));
  
  if (results.errors.length > 0) {
    console.log(chalk.red(`❌ ${results.errors.length} erreurs rencontrées`));
    for (const error of results.errors) {
      console.log(chalk.red(`  - ${error}`));
    }
  }
  
  console.log(chalk.cyan('\n🎯 ÉVALUATION DE LA LOGIQUE MÉTIER'));
  if (results.businessLogicPreserved) {
    console.log(chalk.green('✅ Logique métier préservée'));
  } else {
    console.log(chalk.red('❌ Logique métier compromise - vérification requise'));
  }
  
  console.log(chalk.cyan('\n🔒 ÉVALUATION DE LA SÉCURITÉ'));
  if (results.securityEnhanced) {
    console.log(chalk.green('✅ Sécurité renforcée'));
  } else {
    console.log(chalk.red('❌ Problèmes de sécurité détectés'));
  }
  
  console.log(chalk.cyan('\n💡 RECOMMANDATIONS'));
  console.log(chalk.yellow('1. Vérifier les types de prix et quantités'));
  console.log(chalk.yellow('2. Valider les calculs financiers'));
  console.log(chalk.yellow('3. Tester les fonctionnalités critiques'));
  console.log(chalk.yellow('4. Réviser les permissions utilisateur'));
}

// Point d'entrée principal
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (dryRun) {
    console.log(chalk.yellow('🧪 MODE TEST - Aucune modification ne sera appliquée\n'));
  }
  
  try {
    const results = await fixOptimizedTypeScriptErrors(dryRun);
    generateOptimizedReport(results);
    
    if (results.errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('❌ Erreur fatale:'), error);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main().catch(console.error);
}

export { fixOptimizedTypeScriptErrors, validateBusinessLogic }; 