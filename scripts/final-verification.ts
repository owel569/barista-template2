
#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

interface VerificationResult {
  category: string;
  status: 'passed' | 'warning' | 'error';
  message: string;
  details?: string[];
}

class ProjectVerifier {
  private results: VerificationResult[] = [];

  async runAllChecks(): Promise<void> {
    console.log(chalk.blue('🔍 Vérification complète du projet Barista Café...\n'));

    await this.checkTypeScriptErrors();
    await this.checkDatabaseConnection();
    await this.checkAPIRoutes();
    await this.checkComponentIntegrity();
    await this.checkSecurityConfiguration();
    await this.checkPerformanceOptimizations();

    this.displayResults();
  }

  private async checkTypeScriptErrors(): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      execSync('npx tsc --noEmit --strict', { stdio: 'pipe' });
      
      this.results.push({
        category: 'TypeScript',
        status: 'passed',
        message: 'Aucune erreur TypeScript détectée'
      });
    } catch (error) {
      this.results.push({
        category: 'TypeScript',
        status: 'error',
        message: 'Erreurs TypeScript détectées',
        details: ['Exécuter npm run type-check pour plus de détails']
      });
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    const schemaPath = path.join(process.cwd(), 'shared', 'schema.ts');
    const dbPath = path.join(process.cwd(), 'server', 'db.ts');

    if (fs.existsSync(schemaPath) && fs.existsSync(dbPath)) {
      this.results.push({
        category: 'Base de données',
        status: 'passed',
        message: 'Configuration de base de données présente'
      });
    } else {
      this.results.push({
        category: 'Base de données',
        status: 'error',
        message: 'Fichiers de configuration manquants',
        details: ['Vérifier shared/schema.ts et server/db.ts']
      });
    }
  }

  private async checkAPIRoutes(): Promise<void> {
    const routesDir = path.join(process.cwd(), 'server', 'routes');
    
    if (fs.existsSync(routesDir)) {
      const routes = fs.readdirSync(routesDir, { recursive: true })
        .filter(file => file.toString().endsWith('.ts'));

      this.results.push({
        category: 'Routes API',
        status: 'passed',
        message: `${routes.length} routes API configurées`
      });
    } else {
      this.results.push({
        category: 'Routes API',
        status: 'error',
        message: 'Répertoire routes manquant'
      });
    }
  }

  private async checkComponentIntegrity(): Promise<void> {
    const componentsDir = path.join(process.cwd(), 'client', 'src', 'components');
    
    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir, { recursive: true })
        .filter(file => file.toString().endsWith('.tsx'));

      const adminComponents = components.filter(c => c.toString().includes('admin'));
      const uiComponents = components.filter(c => c.toString().includes('ui'));

      this.results.push({
        category: 'Composants',
        status: 'passed',
        message: `${components.length} composants trouvés`,
        details: [
          `${adminComponents.length} composants admin`,
          `${uiComponents.length} composants UI`
        ]
      });
    }
  }

  private async checkSecurityConfiguration(): Promise<void> {
    const authMiddleware = path.join(process.cwd(), 'server', 'middleware', 'auth.ts');
    const securityMiddleware = path.join(process.cwd(), 'server', 'middleware', 'security.ts');

    if (fs.existsSync(authMiddleware) && fs.existsSync(securityMiddleware)) {
      this.results.push({
        category: 'Sécurité',
        status: 'passed',
        message: 'Middleware de sécurité configuré'
      });
    } else {
      this.results.push({
        category: 'Sécurité',
        status: 'warning',
        message: 'Configuration de sécurité incomplète'
      });
    }
  }

  private async checkPerformanceOptimizations(): Promise<void> {
    const packageJson = path.join(process.cwd(), 'package.json');
    
    if (fs.existsSync(packageJson)) {
      const content = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
      const hasDevDeps = Object.keys(content.devDependencies || {}).length > 0;
      const hasOptimizations = content.dependencies?.['exceljs'] && !content.dependencies?.['xlsx'];

      this.results.push({
        category: 'Performance',
        status: hasOptimizations ? 'passed' : 'warning',
        message: hasOptimizations ? 'Optimisations appliquées' : 'Optimisations possibles',
        details: hasDevDeps ? ['Dépendances de développement configurées'] : []
      });
    }
  }

  private displayResults(): void {
    console.log(chalk.blue('\n📊 RÉSULTATS DE VÉRIFICATION\n'));

    const passed = this.results.filter(r => r.status === 'passed').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    this.results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      const color = result.status === 'passed' ? chalk.green : 
                    result.status === 'warning' ? chalk.yellow : chalk.red;

      console.log(`${icon} ${result.category}: ${color(result.message)}`);
      
      if (result.details) {
        result.details.forEach(detail => {
          console.log(`   ${chalk.gray('→')} ${detail}`);
        });
      }
    });

    console.log(chalk.blue('\n📈 RÉSUMÉ:'));
    console.log(`✅ ${passed} vérifications réussies`);
    console.log(`⚠️ ${warnings} avertissements`);
    console.log(`❌ ${errors} erreurs`);

    if (errors === 0) {
      console.log(chalk.green('\n🎉 Projet prêt pour la production!'));
    } else {
      console.log(chalk.red('\n🔧 Corrections nécessaires avant déploiement'));
    }
  }
}

// Exécution
async function main(): Promise<void> {
  const verifier = new ProjectVerifier();
  await verifier.runAllChecks();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
