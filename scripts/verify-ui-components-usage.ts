
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

class UIComponentsVerifier {
  private issues: UIComponentIssue[] = [];
  private uiComponentsDir = 'client/src/components/ui';
  private srcDir = 'client/src';

  async verifyAll(): Promise<void> {
    console.log(chalk.cyan('🔍 VÉRIFICATION DES COMPOSANTS UI\n'));
    
    // 1. Vérifier les exports dans index.ts
    await this.verifyExports();
    
    // 2. Vérifier les types TypeScript
    await this.verifyTypes();
    
    // 3. Vérifier l'utilisation dans le code
    await this.verifyUsage();
    
    // 4. Vérifier les imports manquants
    await this.verifyImports();
    
    this.generateReport();
  }

  private async verifyExports(): Promise<void> {
    console.log(chalk.blue('📦 Vérification des exports...'));
    
    const indexPath = path.join(this.uiComponentsDir, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      this.issues.push({
        file: indexPath,
        component: 'index.ts',
        issue: 'Fichier index.ts manquant',
        severity: 'error'
      });
      return;
    }

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const uiFiles = fs.readdirSync(this.uiComponentsDir)
      .filter(file => file.endsWith('.tsx') && file !== 'index.ts');

    for (const file of uiFiles) {
      const componentName = file.replace('.tsx', '');
      if (!indexContent.includes(componentName)) {
        this.issues.push({
          file: indexPath,
          component: componentName,
          issue: `Export manquant pour ${componentName}`,
          severity: 'warning'
        });
      }
    }
  }

  private async verifyTypes(): Promise<void> {
    console.log(chalk.blue('🔧 Vérification des types TypeScript...'));
    
    const problematicPatterns = [
      { pattern: /:\s*any(?!\w)/g, issue: 'Type "any" détecté', severity: 'error' as const },
      { pattern: /\{\s*\}/g, issue: 'Type vide "{}" détecté', severity: 'warning' as const },
      { pattern: /\w+\?\.\w+/g, issue: 'Optional chaining sans vérification', severity: 'info' as const },
      { pattern: /React\.ComponentProps<['"]div['"]>/g, issue: 'Type générique React.ComponentProps', severity: 'info' as const }
    ];

    const uiFiles = this.getUIFiles();
    
    for (const filePath of uiFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const { pattern, issue, severity } of problematicPatterns) {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            this.issues.push({
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
    console.log(chalk.blue('🎯 Vérification de l'utilisation...'));
    
    const usageFiles = this.getAllTSXFiles();
    const uiComponents = this.getUIComponentNames();
    const componentUsage = new Map<string, number>();

    // Initialiser le comptage
    uiComponents.forEach(comp => componentUsage.set(comp, 0));

    for (const filePath of usageFiles) {
      if (filePath.includes('/ui/')) continue; // Ignorer les fichiers UI eux-mêmes
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const component of uiComponents) {
        const importRegex = new RegExp(`import.*\\b${component}\\b.*from.*@/components/ui`, 'g');
        const usageRegex = new RegExp(`<${component}[\\s>]`, 'g');
        
        if (importRegex.test(content) || usageRegex.test(content)) {
          componentUsage.set(component, componentUsage.get(component)! + 1);
        }
      }
    }

    // Signaler les composants non utilisés
    componentUsage.forEach((count, component) => {
      if (count === 0) {
        this.issues.push({
          file: `${this.uiComponentsDir}/${component}.tsx`,
          component,
          issue: 'Composant jamais utilisé',
          severity: 'info'
        });
      }
    });
  }

  private async verifyImports(): Promise<void> {
    console.log(chalk.blue('📥 Vérification des imports...'));
    
    const usageFiles = this.getAllTSXFiles();
    
    for (const filePath of usageFiles) {
      if (filePath.includes('/ui/')) continue;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Rechercher les imports UI problématiques
      lines.forEach((line, index) => {
        if (line.includes('@/components/ui') && line.includes('import')) {
          // Vérifier les imports de composants inexistants
          const importMatch = line.match(/import\s*\{([^}]+)\}\s*from\s*['"]@\/components\/ui['"]/);
          if (importMatch) {
            const imports = importMatch[1].split(',').map(imp => imp.trim());
            for (const imp of imports) {
              const componentFile = path.join(this.uiComponentsDir, `${imp}.tsx`);
              if (!fs.existsSync(componentFile)) {
                this.issues.push({
                  file: filePath,
                  component: imp,
                  issue: `Import de composant inexistant: ${imp}`,
                  line: index + 1,
                  severity: 'error'
                });
              }
            }
          }
        }
      });
    }
  }

  private getUIFiles(): string[] {
    return fs.readdirSync(this.uiComponentsDir)
      .filter(file => file.endsWith('.tsx'))
      .map(file => path.join(this.uiComponentsDir, file));
  }

  private getUIComponentNames(): string[] {
    return fs.readdirSync(this.uiComponentsDir)
      .filter(file => file.endsWith('.tsx'))
      .map(file => file.replace('.tsx', ''));
  }

  private getAllTSXFiles(): string[] {
    const files: string[] = [];
    
    const searchDir = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules')) {
          searchDir(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };
    
    searchDir(this.srcDir);
    return files;
  }

  private generateReport(): void {
    console.log(chalk.cyan('\n📊 RAPPORT DE VÉRIFICATION\n'));
    
    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;
    const infoCount = this.issues.filter(i => i.severity === 'info').length;
    
    console.log(chalk.red(`❌ Erreurs: ${errorCount}`));
    console.log(chalk.yellow(`⚠️  Avertissements: ${warningCount}`));
    console.log(chalk.blue(`ℹ️  Informations: ${infoCount}`));
    
    if (this.issues.length === 0) {
      console.log(chalk.green('\n✅ Tous les composants UI sont correctement utilisés!'));
      return;
    }
    
    // Grouper par sévérité
    const groupedIssues = {
      error: this.issues.filter(i => i.severity === 'error'),
      warning: this.issues.filter(i => i.severity === 'warning'),
      info: this.issues.filter(i => i.severity === 'info')
    };
    
    for (const [severity, issues] of Object.entries(groupedIssues)) {
      if (issues.length === 0) continue;
      
      const color = severity === 'error' ? chalk.red : 
                   severity === 'warning' ? chalk.yellow : chalk.blue;
      
      console.log(color(`\n${severity.toUpperCase()}:`));
      
      issues.forEach(issue => {
        const location = issue.line ? `:${issue.line}` : '';
        console.log(color(`  ${issue.file}${location}`));
        console.log(`    ${issue.component}: ${issue.issue}`);
      });
    }
    
    // Recommandations
    console.log(chalk.cyan('\n🚀 RECOMMANDATIONS:\n'));
    
    if (errorCount > 0) {
      console.log(chalk.red('1. Corrigez les erreurs critiques en premier'));
    }
    
    if (warningCount > 0) {
      console.log(chalk.yellow('2. Examinez les avertissements pour améliorer la qualité'));
    }
    
    if (infoCount > 0) {
      console.log(chalk.blue('3. Considérez les suggestions d\'optimisation'));
    }
  }
}

// Exécution
new UIComponentsVerifier().verifyAll().catch(console.error);
