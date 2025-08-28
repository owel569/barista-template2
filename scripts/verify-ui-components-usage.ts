
#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface UIComponentIssue {
  file: string;
  component: string;
  issue: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
}

interface VerificationStats {
  errors: number;
  warnings: number;
  info: number;
  totalIssues: number;
}

class UIComponentsVerifier {
  private issues: UIComponentIssue[] = [];
  private readonly uiComponentsDir = 'client/src/components/ui';
  private readonly srcDir = 'client/src';

  async verifyAll(): Promise<void> {
    console.log(chalk.cyan('🔍 VÉRIFICATION DES COMPOSANTS UI\n'));
    
    await this.verifyExports();
    await this.verifyTypes();
    await this.verifyUsage();
    await this.verifyImports();
    
    this.generateReport();
  }

  private async verifyExports(): Promise<void> {
    console.log(chalk.blue('📦 Vérification des exports...'));
    
    const indexPath = path.join(this.uiComponentsDir, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      this.addIssue({
        file: indexPath,
        component: 'index.ts',
        issue: 'Fichier index.ts manquant',
        severity: 'error'
      });
      return;
    }

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const uiFiles = this.getUIFiles();
    
    for (const filePath of uiFiles) {
      const componentName = path.basename(filePath, '.tsx');
      const exportPattern = new RegExp(`export.*from.*['"]\\.\/${componentName}['"]`);
      
      if (!exportPattern.test(indexContent)) {
        this.addIssue({
          file: indexPath,
          component: componentName,
          issue: `Export manquant pour le composant ${componentName}`,
          severity: 'warning'
        });
      }
    }
  }

  private async verifyTypes(): Promise<void> {
    console.log(chalk.blue('🔧 Vérification des types TypeScript...'));
    
    const problematicPatterns = [
      {
        pattern: /:\s*any\b/g,
        issue: 'Type "any" détecté',
        severity: 'error' as const
      },
      {
        pattern: /=\s*{}\s*(?:as|;|,|\)|$)/g,
        issue: 'Type vide "{}" détecté',
        severity: 'warning' as const
      },
      {
        pattern: /React\.ComponentProps</g,
        issue: 'Type générique React.ComponentProps détecté',
        severity: 'info' as const
      }
    ];

    const uiFiles = this.getUIFiles();
    
    for (const filePath of uiFiles) {
      if (!fs.existsSync(filePath)) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const { pattern, issue, severity } of problematicPatterns) {
        lines.forEach((line, index) => {
          const matches = line.match(pattern);
          if (matches && !this.isIgnoredLine(line)) {
            this.addIssue({
              file: filePath,
              component: path.basename(filePath, '.tsx'),
              issue: `${issue}: ${line.trim()}`,
              line: index + 1,
              severity
            });
          }
        });
      }
    }
  }

  private async verifyUsage(): Promise<void> {
    console.log(chalk.blue('🎯 Vérification de l\'utilisation...'));
    
    const usageFiles = this.getAllTSXFiles();
    const uiComponents = this.getUIComponentNames();
    const componentUsage = new Map<string, number>();

    // Initialiser le comptage
    uiComponents.forEach(comp => componentUsage.set(comp, 0));

    // Compter l'utilisation
    for (const filePath of usageFiles) {
      if (filePath.includes('/ui/')) continue; // Ignorer les fichiers UI eux-mêmes
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const component of uiComponents) {
        const importPattern = new RegExp(`import.*{[^}]*${component}[^}]*}.*from.*['"]@/components/ui['"]`, 'g');
        const usagePattern = new RegExp(`<${component}[\\s>]`, 'g');
        
        if (importPattern.test(content) || usagePattern.test(content)) {
          componentUsage.set(component, (componentUsage.get(component) || 0) + 1);
        }
      }
    }

    // Signaler les composants non utilisés
    for (const [component, count] of componentUsage) {
      if (count === 0) {
        this.addIssue({
          file: `client/src/components/ui/${component}.tsx`,
          component,
          issue: 'Composant jamais utilisé',
          severity: 'info'
        });
      }
    }
  }

  private async verifyImports(): Promise<void> {
    console.log(chalk.blue('📥 Vérification des imports...'));
    
    const tsxFiles = this.getAllTSXFiles();
    
    for (const filePath of tsxFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
      
      for (const [lineIndex, line] of importLines.entries()) {
        // Vérifier les imports d'UI components
        if (line.includes('@/components/ui')) {
          const match = line.match(/import\s*{([^}]+)}\s*from\s*['"]@\/components\/ui(?:\/([^'"]*))?['"]/);
          if (match) {
            const imports = match[1].split(',').map(imp => imp.trim());
            const specificFile = match[2];
            
            if (specificFile) {
              // Import spécifique d'un fichier
              const expectedPath = path.join(this.uiComponentsDir, `${specificFile}.tsx`);
              if (!fs.existsSync(expectedPath)) {
                this.addIssue({
                  file: filePath,
                  component: specificFile,
                  issue: `Import d'un composant inexistant: ${specificFile}`,
                  line: lineIndex + 1,
                  severity: 'error'
                });
              }
            }
          }
        }
      }
    }
  }

  private getUIFiles(): string[] {
    if (!fs.existsSync(this.uiComponentsDir)) return [];
    
    return fs.readdirSync(this.uiComponentsDir)
      .filter(file => file.endsWith('.tsx') && file !== 'index.tsx')
      .map(file => path.join(this.uiComponentsDir, file));
  }

  private getAllTSXFiles(): string[] {
    const files: string[] = [];
    
    const walk = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };
    
    walk(this.srcDir);
    return files;
  }

  private getUIComponentNames(): string[] {
    return this.getUIFiles()
      .map(file => path.basename(file, '.tsx'))
      .filter(name => name !== 'index');
  }

  private isIgnoredLine(line: string): boolean {
    return line.includes('// @ts-ignore') || 
           line.includes('// eslint-disable') ||
           line.includes('// Type intentionally any') ||
           line.includes('Object.create(null)');
  }

  private addIssue(issue: UIComponentIssue): void {
    this.issues.push(issue);
  }

  private generateReport(): void {
    const stats = this.calculateStats();
    
    console.log(chalk.cyan('\n📊 RAPPORT DE VÉRIFICATION\n'));
    
    console.log(chalk.red(`❌ Erreurs: ${stats.errors}`));
    console.log(chalk.yellow(`⚠️  Avertissements: ${stats.warnings}`));
    console.log(chalk.blue(`ℹ️  Informations: ${stats.info}\n`));
    
    // Afficher les erreurs
    if (stats.errors > 0) {
      console.log(chalk.red('ERROR:'));
      this.issues
        .filter(issue => issue.severity === 'error')
        .forEach(issue => {
          const location = issue.line ? `:${issue.line}` : '';
          console.log(chalk.red(`  ${issue.file}${location}`));
          console.log(chalk.red(`    ${issue.component}: ${issue.issue}`));
        });
      console.log();
    }
    
    // Afficher les avertissements
    if (stats.warnings > 0) {
      console.log(chalk.yellow('WARNING:'));
      this.issues
        .filter(issue => issue.severity === 'warning')
        .forEach(issue => {
          const location = issue.line ? `:${issue.line}` : '';
          console.log(chalk.yellow(`  ${issue.file}${location}`));
          console.log(chalk.yellow(`    ${issue.component}: ${issue.issue}`));
        });
      console.log();
    }
    
    // Afficher les informations (limité aux 15 premières)
    const infoIssues = this.issues.filter(issue => issue.severity === 'info');
    if (infoIssues.length > 0) {
      console.log(chalk.blue('INFO:'));
      infoIssues.slice(0, 15).forEach(issue => {
        const location = issue.line ? `:${issue.line}` : '';
        console.log(chalk.blue(`  ${issue.file}${location}`));
        console.log(chalk.blue(`    ${issue.component}: ${issue.issue}`));
      });
      
      if (infoIssues.length > 15) {
        console.log(chalk.blue(`  ... et ${infoIssues.length - 15} autres informations`));
      }
      console.log();
    }
    
    // Recommandations
    if (stats.totalIssues > 0) {
      console.log(chalk.cyan('🚀 RECOMMANDATIONS:\n'));
      console.log('1. Corrigez les erreurs critiques en premier');
      console.log('2. Examinez les avertissements pour améliorer la qualité');
      console.log('3. Considérez les suggestions d\'optimisation');
      
      if (stats.errors === 0 && stats.warnings === 0) {
        console.log(chalk.green('\n✅ Excellente qualité de code ! Seulement des informations à examiner.'));
      }
    } else {
      console.log(chalk.green('🎉 Aucun problème détecté ! Excellent travail !'));
    }
  }

  private calculateStats(): VerificationStats {
    const stats: VerificationStats = {
      errors: 0,
      warnings: 0,
      info: 0,
      totalIssues: this.issues.length
    };
    
    for (const issue of this.issues) {
      switch (issue.severity) {
        case 'error':
          stats.errors++;
          break;
        case 'warning':
          stats.warnings++;
          break;
        case 'info':
          stats.info++;
          break;
      }
    }
    
    return stats;
  }
}

// Exécution du script
async function main(): Promise<void> {
  try {
    const verifier = new UIComponentsVerifier();
    await verifier.verifyAll();
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la vérification:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
