#!/usr/bin/env tsx

/**
 * Script de correction des erreurs de syntaxe critiques
 * Corrige spécifiquement les problèmes de guillemets et de syntaxe TypeScript
 * 
 * Usage: npm run fix:syntax
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import fg from 'fast-glob';

console.log(chalk.cyan('🔧 CORRECTION SYNTAXE CRITIQUE - BARISTA CAFÉ\n'));

interface SyntaxFix {
  pattern: RegExp;
  replacement: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

// Corrections de syntaxe critiques par priorité
const CRITICAL_SYNTAX_FIXES: SyntaxFix[] = [
  // CRITICAL - Guillemets mal formatés
  {
    pattern: /"""/g,
    replacement: '"',
    description: 'Triple guillemets → guillemet simple',
    priority: 'CRITICAL'
  },
  {
    pattern: /""/g,
    replacement: '"',
    description: 'Double guillemets → guillemet simple',
    priority: 'CRITICAL'
  },
  {
    pattern: /'''/g,
    replacement: "'",
    description: 'Triple apostrophes → apostrophe simple',
    priority: 'CRITICAL'
  },
  {
    pattern: /''/g,
    replacement: "'",
    description: 'Double apostrophes → apostrophe simple',
    priority: 'CRITICAL'
  },
  
  // CRITICAL - Export export
  {
    pattern: /export\s+export/g,
    replacement: 'export',
    description: 'Export export → export',
    priority: 'CRITICAL'
  },
  
  // CRITICAL - Chaînes mal fermées
  {
    pattern: /"([^"]*)\\"([^"]*)/g,
    replacement: '"$1"$2"',
    description: 'Chaînes mal fermées avec backslash',
    priority: 'CRITICAL'
  },
  
  // HIGH - Types avec guillemets mal formatés
  {
    pattern: /type:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*string;/g,
    replacement: 'type: "$1" | "$2" | "$3" | "$4" | "$5" | string;',
    description: 'Types union avec guillemets mal formatés',
    priority: 'HIGH'
  },
  
  // HIGH - Chaînes de locale mal formatées
  {
    pattern: /"fr-CA\)/g,
    replacement: '"fr-CA")',
    description: 'Locale string mal fermée',
    priority: 'HIGH'
  },
  {
    pattern: /fr-CA""/g,
    replacement: '"fr-CA"',
    description: 'Locale string sans guillemets',
    priority: 'HIGH'
  },
  {
    pattern: /fr-FR""/g,
    replacement: '"fr-FR"',
    description: 'Locale string sans guillemets',
    priority: 'HIGH'
  },
  
  // HIGH - Options de formatage mal formatées
  {
    pattern: /year:\s*""numeric,"""/g,
    replacement: 'year: "numeric",',
    description: 'Option year mal formatée',
    priority: 'HIGH'
  },
  {
    pattern: /month:\s*long""/g,
    replacement: 'month: "long"',
    description: 'Option month mal formatée',
    priority: 'HIGH'
  },
  {
    pattern: /day:\s*""numeric/g,
    replacement: 'day: "numeric"',
    description: 'Option day mal formatée',
    priority: 'HIGH'
  },
  {
    pattern: /hour:\s*2-digit""/g,
    replacement: 'hour: "2-digit"',
    description: 'Option hour mal formatée',
    priority: 'HIGH'
  },
  {
    pattern: /minute:\s*""2-digit/g,
    replacement: 'minute: "2-digit"',
    description: 'Option minute mal formatée',
    priority: 'HIGH'
  },
  
  // MEDIUM - Autres corrections de syntaxe
  {
    pattern: /\\"/g,
    replacement: '"',
    description: 'Backslash avant guillemet',
    priority: 'MEDIUM'
  },
  {
    pattern: /\\'/g,
    replacement: "'",
    description: 'Backslash avant apostrophe',
    priority: 'MEDIUM'
  },
  {
    pattern: /\\\\/g,
    replacement: '\\',
    description: 'Double backslash',
    priority: 'MEDIUM'
  },
  {
    pattern: /\\n/g,
    replacement: ' ',
    description: 'Backslash n',
    priority: 'MEDIUM'
  },
  {
    pattern: /\\t/g,
    replacement: ' ',
    description: 'Backslash t',
    priority: 'MEDIUM'
  },
  {
    pattern: /\\r/g,
    replacement: ' ',
    description: 'Backslash r',
    priority: 'MEDIUM'
  }
];

// Corrections spécifiques aux fichiers de types
const TYPE_FILE_FIXES: SyntaxFix[] = [
  {
    pattern: /status:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*string;/g,
    replacement: 'status: "$1" | "$2" | "$3" | "$4" | "$5" | string;',
    description: 'Status union type mal formaté',
    priority: 'CRITICAL'
  },
  {
    pattern: /environment:\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*\|\s*"([^"]*)"\s*;/g,
    replacement: 'environment: "$1" | "$2" | "$3";',
    description: 'Environment union type mal formaté',
    priority: 'CRITICAL'
  }
];

// Corrections spécifiques aux utilitaires de date
const DATE_UTILS_FIXES: SyntaxFix[] = [
  {
    pattern: /const\s+d\s*=\s*typeof\s+date\s*===\s*string""\s*\?\s*new\s+Date\(date\)\s*:\s*date;""""/g,
    replacement: 'const d = typeof date === "string" ? new Date(date) : date;',
    description: 'Type check mal formaté',
    priority: 'CRITICAL'
  },
  {
    pattern: /const\s+d\s*=\s*typeof\s+date\s*===\s*""string\s*\?\s*new\s+Date\(date\)\s*:\s*date;""/g,
    replacement: 'const d = typeof date === "string" ? new Date(date) : date;',
    description: 'Type check mal formaté',
    priority: 'CRITICAL'
  },
  {
    pattern: /return\s+d\.toLocaleDateString\(fr-FR"",\s*\{/g,
    replacement: 'return d.toLocaleDateString("fr-FR", {',
    description: 'Locale string mal formatée',
    priority: 'HIGH'
  },
  {
    pattern: /return\s+d\.toLocaleTimeString\(""fr-FR,\s*\{""/g,
    replacement: 'return d.toLocaleTimeString("fr-FR", {',
    description: 'Locale string mal formatée',
    priority: 'HIGH'
  },
  {
    pattern: /return\s+d\.toISOString\(\)\.split\(T'\)\[0\]\s*\|\|\s*'';/g,
    replacement: "return d.toISOString().split('T')[0] || '';",
    description: 'Split mal formaté',
    priority: 'HIGH'
  }
];

interface FixResult {
  file: string;
  fixes: Array<{
    description: string;
    count: number;
    priority: string;
  }>;
  totalFixes: number;
  success: boolean;
  error?: string;
}

// Fonction pour appliquer les corrections de syntaxe
function applySyntaxFixes(content: string, filePath: string): FixResult {
  const result: FixResult = {
    file: filePath,
    fixes: [],
    totalFixes: 0,
    success: true
  };
  
  let modifiedContent = content;
  
  // Déterminer les corrections à appliquer selon le type de fichier
  let fixesToApply = [...CRITICAL_SYNTAX_FIXES];
  
  if (filePath.includes('types/') || filePath.endsWith('.d.ts')) {
    fixesToApply = [...fixesToApply, ...TYPE_FILE_FIXES];
  }
  
  if (filePath.includes('dateUtils') || filePath.includes('utils/')) {
    fixesToApply = [...fixesToApply, ...DATE_UTILS_FIXES];
  }
  
  // Appliquer les corrections par ordre de priorité
  for (const fix of fixesToApply) {
    const matches = modifiedContent.match(fix.pattern);
    if (matches) {
      modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
      result.fixes.push({
        description: fix.description,
        count: matches.length,
        priority: fix.priority
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

// Fonction principale
async function fixCriticalSyntax(): Promise<void> {
  try {
    // Récupérer tous les fichiers TypeScript
    const files = await fg(['client/src/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}'], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    
    console.log(chalk.blue(`📁 ${files.length} fichiers TypeScript détectés\n`));
    
    const results: FixResult[] = [];
    let totalFilesFixed = 0;
    let totalFixesApplied = 0;
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const result = applySyntaxFixes(content, filePath);
        results.push(result);
        
        if (result.totalFixes > 0) {
          totalFilesFixed++;
          totalFixesApplied += result.totalFixes;
          
          console.log(chalk.green(`✅ ${path.basename(filePath)}`));
          for (const fix of result.fixes) {
            const priorityIcon = fix.priority === 'CRITICAL' ? '🔴' : 
                                fix.priority === 'HIGH' ? '🟡' : '🟢';
            console.log(chalk.gray(`  ${priorityIcon} ${fix.description} (${fix.count})`));
          }
        }
        
      } catch (error) {
        console.error(chalk.red(`❌ Erreur avec ${filePath}:`), error);
      }
    }
    
    // Rapport final
    console.log(chalk.cyan('\n📊 RAPPORT DE CORRECTION SYNTAXE\n'));
    console.log(chalk.green(`✅ ${totalFilesFixed} fichiers corrigés`));
    console.log(chalk.blue(`🔧 ${totalFixesApplied} corrections appliquées`));
    
    const criticalFixes = results.flatMap(r => r.fixes.filter(f => f.priority === 'CRITICAL'));
    const highFixes = results.flatMap(r => r.fixes.filter(f => f.priority === 'HIGH'));
    const mediumFixes = results.flatMap(r => r.fixes.filter(f => f.priority === 'MEDIUM'));
    
    console.log(chalk.red(`🔴 ${criticalFixes.length} corrections critiques`));
    console.log(chalk.yellow(`🟡 ${highFixes.length} corrections importantes`));
    console.log(chalk.green(`🟢 ${mediumFixes.length} corrections mineures`));
    
    // Vérifier s'il reste des erreurs
    console.log(chalk.cyan('\n🔍 Vérification des erreurs restantes...'));
    try {
      const { execSync } = await import('child_process');
      const output = execSync('npx tsc --noEmit --strict', { encoding: 'utf8', stdio: 'pipe' });
      console.log(chalk.green('✅ Aucune erreur TypeScript détectée'));
    } catch (error: any) {
      const errorCount = (error.stdout || '').match(/Found (\d+) errors/)?.[1] || '?';
      console.log(chalk.yellow(`⚠️  ${errorCount} erreurs TypeScript restantes`));
      console.log(chalk.gray('Exécutez "npm run fix:optimized" pour les corriger'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Erreur fatale:'), error);
    process.exit(1);
  }
}

// Exécution du script
fixCriticalSyntax().catch(console.error);

export { fixCriticalSyntax, applySyntaxFixes }; 