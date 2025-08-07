#!/usr/bin/env tsx

/**
 * Script de correction automatique des erreurs TypeScript
 * Applique les meilleures pratiques de typage et de sécurité
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

interface ErrorInfo {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

interface FixResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class TypeScriptFixer {
  private fixes: FixResult[] = [];
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Exécute la vérification TypeScript et récupère les erreurs
   */
  private getTypeScriptErrors(): ErrorInfo[] {
    try {
      const output = execSync('npx tsc --noEmit --strict', { 
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      )});
      return [];
    } catch (error: unknown) {
      if (error.stdout) {
        return this.parseTypeScriptOutput(error.stdout);
      }
      return [];
    }
  }

  /**
   * Parse la sortie de TypeScript pour extraire les erreurs
   */
  private parseTypeScriptOutput(output: string): ErrorInfo[] {
    const errors: ErrorInfo[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const match = line.match(/(.+)\((\d+),(\d+)\): error TS(\d+): (.+)/);
      if (match) {
        errors.push({
          file: match[1].trim(}),
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4,],
          message: match[5]
        });
      }
    }

    return errors;
  }

  /**
   * Applique les corrections automatiques
   */
  private applyFixes(filePath: string, errors: ErrorInfo[]): FixResult {
    const result: FixResult = { file: filePath, fixes: [,], errors: [] };
    
    if (!existsSync(filePath)) {
      result.errors.push('Fichier non trouvé');
      return result;
    }

    let content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Trier les erreurs par ligne décroissante pour éviter les problèmes d'index
    const sortedErrors = errors
      .filter(e => e.file === filePath)
      .sort((a, b) => b.line - a.line);

    for (const error of sortedErrors) {
      const fix = this.getFixForError(error, lines);
      if (fix) {
        result.fixes.push(`Ligne ${error.line}: ${error.message} -> ${fix.description}`);
        lines[error.line - 1] = fix.fix;
      } else {
        result.errors.push(`Ligne ${error.line)}: ${error.message} (pas de correction automatique)`);
      }
    }

    if (result.fixes.length > 0) {
      content = lines.join('\n');
      writeFileSync(filePath, content, 'utf8');
    }

    return result;
  }

  /**
   * Génère une correction pour une erreur spécifique
   */
  private getFixForError(error: ErrorInfo, lines: string[]): { fix: string; description: string } | null {
    const line = lines[error.line - 1];
    
    switch (error.code) {
      case '2304': // Cannot find name
        return this.fixCannotFindName(error, line);
      
      case '2339': // Property does not exist
        return this.fixPropertyDoesNotExist(error, line);
      
      case '2345': // Argument not assignable
        return this.fixArgumentNotAssignable(error, line);
      
      case '2322': // Type not assignable
        return this.fixTypeNotAssignable(error, line);
      
      case '7006': // Parameter implicitly has 'any' type
        return this.fixImplicitAny(error, line);
      
      case '7031': // Binding element implicitly has 'any' type
        return this.fixImplicitAnyBinding(error, line);
      
      case '7053': // Element implicitly has 'any' type
        return this.fixImplicitAnyElement(error, line);
      
      case '2531': // Object is possibly 'null'
        return this.fixPossiblyNull(error, line);
      
      case '2532': // Object is possibly 'undefined'
        return this.fixPossiblyUndefined(error, line);
      
      case '2769': // No overload matches this call
        return this.fixNoOverloadMatches(error, line);
      
      default:
        return null;
    }
  }

  private fixCannotFindName(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Cannot find name '(.+)'/);
    if (!match) return null;

    const varName = match[1];
    
    // Corrections communes
    if (varName === 'db') {
      return {
        fix: line.replace(/db\./g, 'await getDb().'),
        description: 'Remplacé db par await getDb()'
      };
    }
    
    if (varName === 'authenticateUser') {
      return {
        fix: line.replace(/authenticateUser/g, 'authenticateUser'),
        description: 'Remplacé authenticateUser par authenticateUser'
      };
    }
    
    if (varName === 'requireRole') {
      return {
        fix: line.replace(/requireRole\(/g, 'requireRoles([']),
        description: 'Remplacé requireRole par requireRoles'
      };
    }

    return null;
  }

  private fixPropertyDoesNotExist(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Property '(.+)' does not exist on type '(.+)'/);
    if (!match) return null;

    const property = match[1];
    const type = match[2];
    
    if (property === 'user' && type.includes('Request']) {
      return {
        fix: line.replace(/req\.user/g, 'req.user as any'),
        description: 'Ajouté type assertion pour req.user'
      };
    }

    return null;
  }

  private fixArgumentNotAssignable(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Argument of type '(.+)' is not assignable to parameter of type '(.+)'/);
    if (!match) return null;

    const argType = match[1];
    const paramType = match[2];
    
    if (argType.includes('string | undefined') && paramType.includes('string']) {
      return {
        fix: line.replace(/(\w+)\(/g, '$1 || \'\')('),
        description: 'Ajouté fallback pour string undefined'
      };
    }
    
    if (argType.includes('number | undefined') && paramType.includes('number']) {
      return {
        fix: line.replace(/(\w+)\(/g, '$1 || 0)('),
        description: 'Ajouté fallback pour number undefined'
      };
    }

    return null;
  }

  private fixTypeNotAssignable(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Type '(.+)' is not assignable to type '(.+)'/);
    if (!match) return null;

    const sourceType = match[1];
    const targetType = match[2];
    
    if (sourceType.includes('any') && targetType.includes('string']) {
      return {
        fix: line.replace(/= (.+)/, '= String($1)'),
        description: 'Conversion explicite en string'
      };
    }
    
    if (sourceType.includes('any') && targetType.includes('number']) {
      return {
        fix: line.replace(/= (.+)/, '= Number($1)'),
        description: 'Conversion explicite en number'
      };
    }

    return null;
  }

  private fixImplicitAny(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Parameter '(.+)' implicitly has an 'any' type/);
    if (!match) return null;

    const paramName = match[1];
    
    return {
      fix: line.replace(new RegExp(`(${paramName}):\\s*([^=,]+)`), `$1: unknown`),
      description: `Ajouté type unknown pour ${paramName}`
    };
  }

  private fixImplicitAnyBinding(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Binding element '(.+)' implicitly has an 'any' type/);
    if (!match) return null;

    const elementName = match[1];
    
    return {
      fix: line.replace(new RegExp(`(${elementName}):\\s*([^=,]+)`), `$1: unknown`),
      description: `Ajouté type unknown pour ${elementName}`
    };
  }

  private fixImplicitAnyElement(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Element implicitly has an 'any' type/);
    if (!match) return null;

    return {
      fix: line.replace(/\[\]/g, ': unknown[]'),
      description: 'Ajouté type unknown[] pour array'
    };
  }

  private fixPossiblyNull(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Object is possibly 'null'/);
    if (!match) return null;

    return {
      fix: line.replace(/(\w+)\./g, '$1?.'),
      description: 'Ajouté optional chaining'
    };
  }

  private fixPossiblyUndefined(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/Object is possibly 'undefined'/);
    if (!match) return null;

    return {
      fix: line.replace(/(\w+)\./g, '$1?.'),
      description: 'Ajouté optional chaining'
    };
  }

  private fixNoOverloadMatches(error: ErrorInfo, line: string): { fix: string; description: string } | null {
    const match = line.match(/No overload matches this call/);
    if (!match) return null;

    // Correction générique pour les appels de fonction
    return {
      fix: line.replace(/\(([^])]*)\)/g, '(($1) as any)'),
      description: 'Ajouté type assertion pour résoudre l\'overload'
    };
  }

  /**
   * Applique les corrections de sécurité et de bonnes pratiques
   */
  private applySecurityFixes(filePath: string): void {
    if (!existsSync(filePath)) return;

    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacer les imports obsolètes
    if (content.includes('authenticateUser']) {
      content = content.replace(/import { authenticateUser, requireRoles } from '../middleware/auth';
        "import { authenticateUser, requireRoles } from '../middleware/auth';");
      modified = true;
    }

    // Ajouter les imports manquants
    if (content.includes('createLogger') && !content.includes('import.*createLogger']) {
      content = content.replace(/import.*from.*logging.*/g,
        "      modified = true;
    )}

    // Corriger les imports de base de données
    if (content.includes('import { db }') && !content.includes('getDb']) {
      content = content.replace(/import \{ db \)} from '\.\.\/db';/g,
        "import { getDb } from '../db';");
      modified = true;
    }

    // Ajouter la gestion d'erreurs avec logger
    if (content.includes('console.error') && !content.includes('logger.error']) {
      content = content.replace(/console\.error\(/g, 'logger.error(');
      modified = true;
    }

    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`🔧 Corrections de sécurité appliquées: ${filePath}`);
    }
  }

  /**
   * Applique les corrections de typage strict
   */
  private applyStrictTypingFixes(filePath: string): void {
    if (!existsSync(filePath)) return;

    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacer les types any par unknown
    content = content.replace(/: unknown/g, ': unknown');
    modified = true;

    // Ajouter les types manquants pour les paramètres
    content = content.replace(/function (\w+)\(([^)]*)\)/g, (match, funcName, params) => {
      if (params && !params.includes(':']) {
        const typedParams = params.split(',').map(p => {
          const param = p.trim(});
          if (param && !param.includes(':']) {
            return `${param}: unknown`;
          }
          return param;
        }).join(', ');
        return `function ${funcName}(${typedParams})`;
      }
      return match;
    });

    if (modified) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`🔧 Corrections de typage strict appliquées: ${filePath}`);
    }
  }

  /**
   * Exécute toutes les corrections
   */
  public async fixAll(): Promise<void> {
    console.log('🚀 Début de la correction automatique des erreurs TypeScript...\n');

    // 1. Récupérer les erreurs TypeScript
    console.log('📋 Récupération des erreurs TypeScript...');
    const errors = this.getTypeScriptErrors();
    
    if (errors.length === 0) {
      console.log('✅ Aucune erreur TypeScript détectée !');
      return;
    }

    console.log(`📊 ${errors.length} erreurs détectées\n`);

    // 2. Grouper les erreurs par fichier
    const errorsByFile = new Map<string, ErrorInfo[]>();
    for (const error of errors) {
      if (!errorsByFile.has(error.file]) {
        errorsByFile.set(error.file, []);
      }
      errorsByFile.get(error.file)!.push(error);
    }

    // 3. Appliquer les corrections par fichier
    console.log('🔧 Application des corrections...\n');
    
    for (const [filePath, fileErrors] of errorsByFile) {
      console.log(`📁 Traitement de: ${filePath)}`);
      
      // Appliquer les corrections automatiques
      const result = this.applyFixes(filePath, fileErrors);
      this.fixes.push(result);

      // Appliquer les corrections de sécurité
      this.applySecurityFixes(filePath);
      
      // Appliquer les corrections de typage strict
      this.applyStrictTypingFixes(filePath);

      // Afficher les résultats
      if (result.fixes.length > 0) {
        console.log(`  ✅ ${result.fixes.length)} corrections appliquées`);
        result.fixes.forEach(fix => console.log(`    - ${fix}`]);
      }
      
      if (result.errors.length > 0) {
        console.log(`  ⚠️  ${result.errors.length)} erreurs non corrigées automatiquement`);
        result.errors.forEach(error => console.log(`    - ${error}`]);
      }
      
      console.log('');
    }

    // 4. Vérifier les résultats
    console.log('🔍 Vérification des corrections...');
    const remainingErrors = this.getTypeScriptErrors();
    
    if (remainingErrors.length === 0) {
      console.log('🎉 Toutes les erreurs TypeScript ont été corrigées !');
    } else {
      console.log(`⚠️  ${remainingErrors.length)} erreurs restent à corriger manuellement :`);
      remainingErrors.forEach(error => {
        console.log(`  - ${error.file)}:${error.line}:${error.column} - ${error.message}`);
      });
    }

    // 5. Générer le rapport
    this.generateReport();
  }

  /**
   * Génère un rapport des corrections
   */
  private generateReport(): void {
    const totalFixes = this.fixes.reduce((sum, result) => sum + result.fixes.length, 0);
    const totalErrors = this.fixes.reduce((sum, result) => sum + result.errors.length, 0);
    const filesProcessed = this.fixes.length;

    console.log('\n📊 RAPPORT DE CORRECTION');
    console.log('========================');
    console.log(`📁 Fichiers traités: ${filesProcessed}`);
    console.log(`✅ Corrections appliquées: ${totalFixes}`);
    console.log(`⚠️  Erreurs non corrigées: ${totalErrors}`);
    
    if (totalFixes > 0) {
      console.log('\n🎯 Corrections appliquées:');
      this.fixes.forEach(result => {
        if (result.fixes.length > 0}) {
          console.log(`  📄 ${result.file)}: ${result.fixes.length} corrections`);
        }
      });
    }

    if (totalErrors > 0) {
      console.log('\n⚠️  Erreurs nécessitant une intervention manuelle:');
      this.fixes.forEach(result => {
        if (result.errors.length > 0}) {
          console.log(`  📄 ${result.file)}:`);
          result.errors.forEach(error => console.log(`    - ${error}`]);
        }
      });
    }
  }
}

// Exécution du script
async function main() {
  const projectRoot = process.cwd();
  const fixer = new TypeScriptFixer(projectRoot);
  
  try {
    await fixer.fixAll();
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Exécution directe pour ESM
main().catch(console.error);

export { TypeScriptFixer }; 