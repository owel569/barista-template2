#!/usr/bin/env tsx

/**
 * Script de correction automatique des erreurs TypeScript
 * Version simplifiée et robuste
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface FixResult {
  file: string;
  fixes: string[];
  errors: string[];
}

class SimpleTypeScriptFixer {
  private results: FixResult[] = [];

  /**
   * Applique les corrections de sécurité et de typage
   */
  private applySecurityFixes(filePath: string): FixResult {
    const result: FixResult = { file: filePath, fixes: [,], errors: [] };
    
    if (!existsSync(filePath)) {
      result.errors.push('Fichier non trouvé');
      return result;
    }

    try {
      let content = readFileSync(filePath, 'utf8');
      let modified = false;

      // 1. Corriger les vérifications de null/undefined
      if (content.includes('currentCustomer.loyaltyPoints') && !content.includes('if (!currentCustomer)']) {
        const pattern = /const currentCustomer = customer\[0\];\s*const currentLevel/g;
        if (pattern.test(content]) {
          content = content.replace(
            /const currentCustomer = customer\[0\];\s*const currentLevel/g,
            `const currentCustomer = customer[0];
      if (!currentCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Client non trouvé'
        });
      }
      
      const currentLevel`
          );
          modified = true;
          result.fixes.push('Ajouté vérification de null/undefined pour currentCustomer');
        }
      }

      // 2. Remplacer les imports obsolètes
      if (content.includes('authenticateUser']) {
        content = content.replace(/import { authenticateUser, requireRoles )} from '../middleware/auth';
          "import { authenticateUser, requireRoles } from '../middleware/auth';");
        modified = true;
        result.fixes.push('Remplacé authenticateUser par authenticateUser');
      }

      // 3. Corriger les imports de base de données
      if (content.includes('import { db }') && !content.includes('getDb']) {
        content = content.replace(/import \{ db \)} from '\.\.\/db';/g,
          "import { getDb } from '../db';");
        modified = true;
        result.fixes.push('Remplacé db par getDb');
      }

      // 4. Ajouter les imports manquants
      if (content.includes('createLogger') && !content.includes('import.*createLogger']) {
        content = content.replace(/import.*from.*logging.*/g,
          "import { createLogger )} from '../middleware/logging';");
        modified = true;
        result.fixes.push('Ajouté import createLogger');
      }

      // 5. Remplacer any par unknown
      if (content.includes(': unknown']) {
        content = content.replace(/: unknown/g, ': unknown');
        modified = true;
        result.fixes.push('Remplacé any par unknown');
      }

      // 6. Améliorer la gestion d'erreurs
      if (content.includes('console.error') && !content.includes('logger.error']) {
        content = content.replace(/console\.error\(/g, 'logger.error(');
        modified = true;
        result.fixes.push('Remplacé console.error par logger.error');
      }

      // 7. Standardiser les réponses API
      if (content.includes('res.json(') && !content.includes('success: true']) {
        content = content.replace(
          /res\.json\(([^])]+)\)/g,
          'res.json({\n        success: true,\n        data: $1\n      })'
        );
        modified = true;
        result.fixes.push('Standardisé les réponses API');
      }

      if (modified) {
        writeFileSync(filePath, content, 'utf8');
      }

    } catch (error) {
      result.errors.push(`Erreur lors de l'amélioration: ${error instanceof Error ? error.message : 'Erreur inconnue')}`);
    }

    return result;
  }

  /**
   * Trouve tous les fichiers TypeScript/JavaScript
   */
  private findSourceFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!existsSync(dir]) return files;

    try {
      const { readdirSync, statSync } = await import('fs');
      const items = readdirSync(dir);
      
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory(]) {
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item]) {
            files.push(...this.findSourceFiles(fullPath]);
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx']) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de fichiers:', error);
    }
    
    return files;
  }

  /**
   * Exécute toutes les corrections
   */
  public async fixAll(): Promise<void> {
    console.log('🚀 Début de la correction automatique des erreurs TypeScript...\n');

    const projectRoot = process.cwd();
    const sourceFiles = this.findSourceFiles(projectRoot);
    
    console.log(`📊 ${sourceFiles.length} fichiers TypeScript trouvés\n`);

    // Appliquer les corrections par fichier
    console.log('🔧 Application des corrections...\n');
    
    for (const filePath of sourceFiles) {
      const relativePath = filePath.replace(projectRoot, '').substring(1);
      console.log(`📄 Traitement de: ${relativePath}`);
      
      const result = this.applySecurityFixes(filePath);
      this.results.push(result);

      // Afficher les résultats
      if (result.fixes.length > 0) {
        console.log(`  ✅ ${result.fixes.length)} corrections appliquées`);
        result.fixes.forEach(fix => console.log(`    - ${fix}`]);
      }
      
      if (result.errors.length > 0) {
        console.log(`  ⚠️  ${result.errors.length)} erreurs`);
        result.errors.forEach(error => console.log(`    - ${error}`]);
      }
      
      console.log('');
    }

    // Générer le rapport
    this.generateReport();
  }

  /**
   * Génère un rapport des corrections
   */
  private generateReport(): void {
    const totalFixes = this.results.reduce((sum, result) => sum + result.fixes.length, 0);
    const totalErrors = this.results.reduce((sum, result) => sum + result.errors.length, 0);
    const filesProcessed = this.results.length;

    console.log('\n📊 RAPPORT DE CORRECTION');
    console.log('========================');
    console.log(`📁 Fichiers traités: ${filesProcessed}`);
    console.log(`✅ Corrections appliquées: ${totalFixes}`);
    console.log(`⚠️  Erreurs rencontrées: ${totalErrors}`);
    
    if (totalFixes > 0) {
      console.log('\n🎯 Corrections appliquées:');
      this.results.forEach(result => {
        if (result.fixes.length > 0}) {
          const relativePath = result.file.replace(process.cwd(), '').substring(1);
          console.log(`  📄 ${relativePath}: ${result.fixes.length} corrections`);
        }
      });
    }

    console.log('\n🎉 Correction automatique terminée !');
  }
}

// Exécution du script
async function main() {
  const fixer = new SimpleTypeScriptFixer();
  
  try {
    await fixer.fixAll();
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

main().catch(console.error); 