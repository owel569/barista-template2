#!/usr/bin/env tsx

/**
 * Script d'amélioration complète du projet
 * Applique les meilleures pratiques de sécurité, typage et architecture
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { TypeScriptFixer } from './fix-typescript-errors-complete';

interface ImprovementResult {
  file: string;
  improvements: string[];
  errors: string[];
}

class ProjectImprover {
  private results: ImprovementResult[] = [];
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Trouve tous les fichiers TypeScript/JavaScript du projet
   */
  private findSourceFiles(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
    const files: string[] = [];
    
    if (!existsSync(dir]) return files;

    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory(]) {
        // Ignorer les dossiers node_modules, .git, etc.
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item]) {
          files.push(...this.findSourceFiles(fullPath, extensions]);
        }
      } else if (extensions.includes(extname(item])) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Améliore un fichier de routes avec les meilleures pratiques
   */
  private improveRouteFile(filePath: string): ImprovementResult {
    const result: ImprovementResult = { file: filePath, improvements: [,], errors: [] };
    
    if (!existsSync(filePath)) {
      result.errors.push('Fichier non trouvé');
      return result;
    }

    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    try {
      // 1. Améliorer les imports
      if (content.includes('authenticateUser']) {
        content = content.replace(/import { authenticateUser, requireRoles } from '../middleware/auth';
          "import { authenticateUser, requireRoles } from '../middleware/auth';");
        modified = true;
        result.improvements.push('Remplacé authenticateUser par authenticateUser');
      }

      if (content.includes('requireRoles([']) {
        content = content.replace(/requireRole\(/g, 'requireRoles([']);
        content = content.replace(/\)\)/g, '])');
        modified = true;
        result.improvements.push('Remplacé requireRole par requireRoles');
      }

      // 2. Ajouter les imports manquants
      if (content.includes('createLogger') && !content.includes('import.*createLogger']) {
        content = content.replace(/import.*from.*logging.*/g,
          "import { createLogger )} from '../middleware/logging';");
        modified = true;
        result.improvements.push('Ajouté import createLogger');
      }

      if (content.includes('asyncHandler') && !content.includes('import.*asyncHandler']) {
        content = content.replace(/import.*from.*error-handler.*/g,
          "import { asyncHandler )} from '../middleware/error-handler';");
        modified = true;
        result.improvements.push('Ajouté import asyncHandler');
      }

      // 3. Corriger les imports de base de données
      if (content.includes('import { db }') && !content.includes('getDb']) {
        content = content.replace(/import \{ db \)} from '\.\.\/db';/g,
          "import { getDb } from '../db';");
        modified = true;
        result.improvements.push('Remplacé db par getDb');
      }

      // 4. Ajouter la gestion d'erreurs avec logger
      if (content.includes('console.error') && !content.includes('logger.error']) {
        content = content.replace(/console\.error\(/g, 'logger.error(');
        modified = true;
        result.improvements.push('Remplacé console.error par logger.error');
      }

      // 5. Améliorer la gestion des erreurs
      if (content.includes('catch (error)') && !content.includes('error instanceof Error']) {
        content = content.replace(
          /catch \(error\) \{([^}]+)\}/g,
          'catch (error) {\n      logger.error(\'Erreur\', { error: error instanceof Error ? error.message : \'Erreur inconnue\' )});$1\n    }'
        );
        modified = true;
        result.improvements.push('Amélioré la gestion d\'erreurs');
      }

      // 6. Ajouter les types manquants
      if (content.includes(': unknown']) {
        content = content.replace(/: unknown/g, ': unknown');
        modified = true;
        result.improvements.push('Remplacé any par unknown');
      }

      // 7. Améliorer les réponses API
      if (content.includes('res.json(') && !content.includes('success: true']) {
        content = content.replace(
          /res\.json\(([^])]+)\)/g,
          'res.json({\n        success: true,\n        data: $1\n      })'
        );
        modified = true;
        result.improvements.push('Standardisé les réponses API');
      }

      // 8. Ajouter la validation des paramètres
      if (content.includes('req.params') && !content.includes('validateParams']) {
        // Ajouter la validation des paramètres si elle n'existe pas
        const paramValidation = `
const ParamSchema = z.object({
  id: z.string()}).regex(/^\\d+$/, 'ID doit être un nombre')
});

router.get('/:id',
  authenticateUser,
  requireRoles(['admin', 'manager']),
  validateParams(ParamSchema),
  asyncHandler(async (req, res) => {`;
        
        content = content.replace(
          /router\.get\('\/:id',\s*asyncHandler\(/g,
          paramValidation
        );
        modified = true;
        result.improvements.push('Ajouté validation des paramètres');
      
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  })

      if (modified) {
        writeFileSync(filePath, content, 'utf8');
      }

    } catch (error) {
      result.errors.push(`Erreur lors de l'amélioration: ${error instanceof Error ? error.message : 'Erreur inconnue')}`);
    }

    return result;
  }

  /**
   * Améliore un fichier de composant React
   */
  private improveReactComponent(filePath: string): ImprovementResult {
    const result: ImprovementResult = { file: filePath, improvements: [,], errors: [] };
    
    if (!existsSync(filePath)) {
      result.errors.push('Fichier non trouvé');
      return result;
    }

    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    try {
      // 1. Ajouter les types manquants
      if (content.includes(': unknown']) {
        content = content.replace(/: unknown/g, ': unknown');
        modified = true;
        result.improvements.push('Remplacé any par unknown');
      }

      // 2. Améliorer les interfaces
      if (content.includes('interface') && !content.includes('export interface']) {
        content = content.replace(/interface (\w+)/g, 'export interface $1');
        modified = true;
        result.improvements.push('Exporté les interfaces');
      }

      // 3. Ajouter les types pour les props
      if (content.includes('React.FC') && !content.includes('<']) {
        content = content.replace(/React\.FC/g, 'React.FC<{)}>');
        modified = true;
        result.improvements.push('Ajouté types pour React.FC');
      }

      // 4. Améliorer la gestion d'erreurs
      if (content.includes('catch (error)') && !content.includes('error instanceof Error']) {
        content = content.replace(
          /catch \(error\) \{([^}]+)\}/g,
          'catch (error) {\n      console.error(\'Erreur\', error instanceof Error ? error.message : \'Erreur inconnue\');$1\n    }'
        );
        modified = true;
        result.improvements.push('Amélioré la gestion d\'erreurs');
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
   * Améliore un fichier de service
   */
  private improveServiceFile(filePath: string): ImprovementResult {
    const result: ImprovementResult = { file: filePath, improvements: [,], errors: [] };
    
    if (!existsSync(filePath)) {
      result.errors.push('Fichier non trouvé');
      return result;
    }

    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    try {
      // 1. Ajouter les types manquants
      if (content.includes(': unknown']) {
        content = content.replace(/: unknown/g, ': unknown');
        modified = true;
        result.improvements.push('Remplacé any par unknown');
      }

      // 2. Améliorer les interfaces
      if (content.includes('interface') && !content.includes('export interface']) {
        content = content.replace(/interface (\w+)/g, 'export interface $1');
        modified = true;
        result.improvements.push('Exporté les interfaces');
      }

      // 3. Ajouter la gestion d'erreurs
      if (content.includes('throw new Error') && !content.includes('logger.error']) {
        content = content.replace(
          /throw new Error\(/g,
          'logger.error(\'Erreur service\', { error: \'$&\' )});\n    throw new Error('
        );
        modified = true;
        result.improvements.push('Ajouté logging des erreurs');
      }

      // 4. Améliorer les méthodes async
      if (content.includes('async function') && !content.includes(': Promise<']) {
        content = content.replace(
          /async function (\w+)\(([^)]*)\)/g,
          'async function $1($2): Promise<unknown>'
        );
        modified = true;
        result.improvements.push('Ajouté types de retour pour les fonctions async');
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
   * Améliore un fichier de types
   */
  private improveTypesFile(filePath: string): ImprovementResult {
    const result: ImprovementResult = { file: filePath, improvements: [,], errors: [] };
    
    if (!existsSync(filePath)) {
      result.errors.push('Fichier non trouvé');
      return result;
    }

    let content = readFileSync(filePath, 'utf8');
    let modified = false;

    try {
      // 1. Remplacer any par unknown
      if (content.includes(': unknown']) {
        content = content.replace(/: unknown/g, ': unknown');
        modified = true;
        result.improvements.push('Remplacé any par unknown');
      }

      // 2. Ajouter les types manquants
      if (content.includes('Record<string,') && !content.includes('unknown']) {
        content = content.replace(/Record<string, any>/g, 'Record<string, unknown>');
        modified = true;
        result.improvements.push('Amélioré Record types');
      }

      // 3. Améliorer les unions de types
      if (content.includes('| any']) {
        content = content.replace(/\| any/g, '| unknown');
        modified = true;
        result.improvements.push('Amélioré unions de types');
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
   * Améliore tous les fichiers du projet
   */
  public async improveAll(): Promise<void> {
    console.log('🚀 Début de l\'amélioration complète du projet...\n');

    // 1. Trouver tous les fichiers source
    console.log('📁 Recherche des fichiers source...');
    const sourceFiles = this.findSourceFiles(this.projectRoot);
    console.log(`📊 ${sourceFiles.length} fichiers trouvés\n`);

    // 2. Améliorer chaque fichier selon son type
    console.log('🔧 Application des améliorations...\n');
    
    for (const filePath of sourceFiles) {
      const relativePath = filePath.replace(this.projectRoot, '').substring(1);
      console.log(`📄 Traitement de: ${relativePath}`);
      
      let result: ImprovementResult;

      if (filePath.includes('/routes/') || filePath.includes('routes/']) {
        result = this.improveRouteFile(filePath);
      } else if (filePath.includes('/components/') || filePath.includes('.tsx']) {
        result = this.improveReactComponent(filePath);
      } else if (filePath.includes('/services/') || filePath.includes('service.']) {
        result = this.improveServiceFile(filePath);
      } else if (filePath.includes('/types/') || filePath.includes('types.']) {
        result = this.improveTypesFile(filePath);
      } else {
        result = { file: filePath, improvements: [,], errors: [] };
      }

      this.results.push(result);

      // Afficher les résultats
      if (result.improvements.length > 0) {
        console.log(`  ✅ ${result.improvements.length)} améliorations appliquées`);
        result.improvements.forEach(improvement => console.log(`    - ${improvement}`]);
      }
      
      if (result.errors.length > 0) {
        console.log(`  ⚠️  ${result.errors.length)} erreurs`);
        result.errors.forEach(error => console.log(`    - ${error}`]);
      }
      
      console.log('');
    }

    // 3. Appliquer les corrections TypeScript
    console.log('🔧 Application des corrections TypeScript...');
    const fixer = new TypeScriptFixer(this.projectRoot);
    await fixer.fixAll();

    // 4. Générer le rapport final
    this.generateReport();
  }

  /**
   * Génère un rapport des améliorations
   */
  private generateReport(): void {
    const totalImprovements = this.results.reduce((sum, result) => sum + result.improvements.length, 0);
    const totalErrors = this.results.reduce((sum, result) => sum + result.errors.length, 0);
    const filesProcessed = this.results.length;

    console.log('\n📊 RAPPORT D\'AMÉLIORATION');
    console.log('=========================');
    console.log(`📁 Fichiers traités: ${filesProcessed}`);
    console.log(`✅ Améliorations appliquées: ${totalImprovements}`);
    console.log(`⚠️  Erreurs rencontrées: ${totalErrors}`);
    
    if (totalImprovements > 0) {
      console.log('\n🎯 Améliorations appliquées:');
      this.results.forEach(result => {
        if (result.improvements.length > 0}) {
          const relativePath = result.file.replace(this.projectRoot, '').substring(1);
          console.log(`  📄 ${relativePath}: ${result.improvements.length} améliorations`);
        }
      });
    }

    if (totalErrors > 0) {
      console.log('\n⚠️  Erreurs nécessitant une intervention manuelle:');
      this.results.forEach(result => {
        if (result.errors.length > 0}) {
          const relativePath = result.file.replace(this.projectRoot, '').substring(1);
          console.log(`  📄 ${relativePath}:`);
          result.errors.forEach(error => console.log(`    - ${error}`]);
        }
      });
    }

    console.log('\n🎉 Amélioration du projet terminée !');
    console.log('\n📋 Prochaines étapes recommandées:');
    console.log('  1. Vérifier les erreurs restantes manuellement');
    console.log('  2. Tester les fonctionnalités modifiées');
    console.log('  3. Exécuter les tests unitaires');
    console.log('  4. Vérifier la conformité aux standards de sécurité');
  }
}

// Exécution du script
async function main() {
  const projectRoot = process.cwd();
  const improver = new ProjectImprover(projectRoot);
  
  try {
    await improver.improveAll();
  } catch (error) {
    console.error('❌ Erreur lors de l\'amélioration:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ProjectImprover }; 