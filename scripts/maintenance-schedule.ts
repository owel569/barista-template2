#!/usr/bin/env tsx

/**
 * Script de maintenance régulière - Barista Café
 * Automatise les tâches de maintenance pour maintenir la qualité
 * 
 * Usage: npm run maintenance:daily
 * Usage: npm run maintenance:weekly
 * Usage: npm run maintenance:monthly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

console.log(chalk.cyan('🔧 MAINTENANCE RÉGULIÈRE - BARISTA CAFÉ\n'));

interface MaintenanceTask {
  name: string;
  command: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  critical: boolean;
}

interface MaintenanceResult {
  task: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

class MaintenanceScheduler {
  private tasks: MaintenanceTask[] = [
    // Tâches quotidiennes
    {
      name: 'Vérification TypeScript',
      command: 'npx tsc --noEmit --strict',
      description: 'Vérification des erreurs TypeScript',
      frequency: 'daily',
      critical: true
    },
    {
      name: 'Tests unitaires',
      command: 'npm run test:business-logic',
      description: 'Exécution des tests de logique métier',
      frequency: 'daily',
      critical: true
    },
    {
      name: 'Analyse de sécurité',
      command: 'npm audit --audit-level moderate',
      description: 'Vérification des vulnérabilités de sécurité',
      frequency: 'daily',
      critical: true
    },
    {
      name: 'Nettoyage des logs',
      command: 'find logs -name "*.log" -mtime +7 -delete',
      description: 'Suppression des anciens fichiers de logs',
      frequency: 'daily',
      critical: false
    },

    // Tâches hebdomadaires
    {
      name: 'Analyse de la logique métier',
      command: 'npm run analyze:business-logic',
      description: 'Analyse des types any dans la logique métier',
      frequency: 'weekly',
      critical: true
    },
    {
      name: 'Optimisation des scripts',
      command: 'npm run fix:optimized',
      description: 'Correction automatique des erreurs TypeScript',
      frequency: 'weekly',
      critical: false
    },
    {
      name: 'Sauvegarde de la base de données',
      command: 'pg_dump barista_cafe > backup_$(date +%Y%m%d).sql',
      description: 'Sauvegarde complète de la base de données',
      frequency: 'weekly',
      critical: true
    },
    {
      name: 'Analyse des performances',
      command: 'npm run analyze:performance',
      description: 'Analyse des performances de l\'application',
      frequency: 'weekly',
      critical: false
    },

    // Tâches mensuelles
    {
      name: 'Audit de sécurité complet',
      command: 'npm audit --audit-level low && npm run security:scan',
      description: 'Audit de sécurité approfondi',
      frequency: 'monthly',
      critical: true
    },
    {
      name: 'Mise à jour des dépendances',
      command: 'npm update && npm audit fix',
      description: 'Mise à jour des packages et correction des vulnérabilités',
      frequency: 'monthly',
      critical: false
    },
    {
      name: 'Analyse de l\'architecture',
      command: 'npm run analyze:architecture',
      description: 'Analyse de la qualité de l\'architecture',
      frequency: 'monthly',
      critical: false
    },
    {
      name: 'Génération du rapport de maintenance',
      command: 'npm run generate:maintenance-report',
      description: 'Génération du rapport mensuel de maintenance',
      frequency: 'monthly',
      critical: false
    }
  ];

  async runMaintenance(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    console.log(chalk.yellow(`🔄 DÉMARRAGE MAINTENANCE ${frequency.toUpperCase()}\n`));
    
    const frequencyTasks = this.tasks.filter(task => task.frequency === frequency);
    const results: MaintenanceResult[] = [];
    
    for (const task of frequencyTasks) {
      console.log(chalk.blue(`\n📋 Exécution: ${task.name}`));
      console.log(chalk.gray(`   ${task.description}`));
      
      const startTime = Date.now();
      const result = await this.executeTask(task);
      const duration = Date.now() - startTime;
      
      results.push({
        task: task.name,
        success: result.success,
        output: result.output,
        error: result.error,
        duration
      });
      
      if (result.success) {
        console.log(chalk.green(`   ✅ Succès (${duration}ms)`));
      } else {
        console.log(chalk.red(`   ❌ Échec (${duration}ms)`));
        if (task.critical) {
          console.log(chalk.red(`   ⚠️  TÂCHE CRITIQUE ÉCHOUÉE`));
        }
      }
    }
    
    this.generateReport(results, frequency);
  }

  private async executeTask(task: MaintenanceTask): Promise<{success: boolean, output?: string, error?: string}> {
    try {
      const output = execSync(task.command, { 
        encoding: 'utf8',
        timeout: 300000, // 5 minutes max
        stdio: 'pipe'
      });
      
      return { success: true, output };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      return { success: false, error: errorMessage };
    }
  }

  private generateReport(results: MaintenanceResult[], frequency: string): void {
    const total = results.length;
    const success = results.filter(r => r.success).length;
    const failed = total - success;
    const criticalFailed = results.filter(r => !r.success && this.isTaskCritical(r.task)).length;
    
    console.log(chalk.blue('\n' + '═'.repeat(60)));
    console.log(chalk.cyan(`📊 RAPPORT MAINTENANCE ${frequency.toUpperCase()}`));
    console.log(chalk.blue('═'.repeat(60)));
    console.log(chalk.green(`✅ Tâches réussies: ${success}/${total}`));
    console.log(chalk.red(`❌ Tâches échouées: ${failed}/${total}`));
    console.log(chalk.yellow(`⚠️  Tâches critiques échouées: ${criticalFailed}`));
    console.log(chalk.blue(`📈 Taux de réussite: ${Math.round((success / total) * 100)}%`));
    
    if (failed > 0) {
      console.log(chalk.red('\n🔍 Tâches échouées:'));
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(chalk.red(`  - ${r.task}`));
          if (r.error) {
            console.log(chalk.gray(`    Erreur: ${r.error}`));
          }
        });
    }
    
    // Sauvegarder le rapport
    const reportPath = `reports/maintenance-${frequency}-${new Date().toISOString().split('T')[0]}.json`;
    const reportData = {
      date: new Date().toISOString(),
      frequency,
      summary: {
        total,
        success,
        failed,
        criticalFailed,
        successRate: Math.round((success / total) * 100)
      },
      results
    };
    
    // Créer le dossier reports s'il n'existe pas
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(chalk.blue(`\n📄 Rapport sauvegardé: ${reportPath}`));
    
    // Recommandations
    this.printRecommendations(results, criticalFailed);
  }

  private isTaskCritical(taskName: string): boolean {
    const task = this.tasks.find(t => t.name === taskName);
    return task?.critical || false;
  }

  private printRecommendations(results: MaintenanceResult[], criticalFailed: number): void {
    console.log(chalk.blue('\n🎯 RECOMMANDATIONS:'));
    
    if (criticalFailed > 0) {
      console.log(chalk.red('  🚨 URGENT: Corriger les tâches critiques échouées'));
      console.log(chalk.red('  🚨 Ne pas déployer en production avant correction'));
      console.log(chalk.red('  🚨 Contacter l\'équipe de développement'));
    } else if (results.some(r => !r.success)) {
      console.log(chalk.yellow('  ⚠️  Corriger les tâches échouées non critiques'));
      console.log(chalk.yellow('  ⚠️  Planifier une maintenance corrective'));
    } else {
      console.log(chalk.green('  ✅ Toutes les tâches de maintenance réussies'));
      console.log(chalk.green('  ✅ Le système est en bon état'));
    }
    
    console.log(chalk.blue('  📅 Planifier la prochaine maintenance'));
    console.log(chalk.blue('  📊 Surveiller les métriques de performance'));
  }

  // Méthodes utilitaires
  async runDaily(): Promise<void> {
    await this.runMaintenance('daily');
  }

  async runWeekly(): Promise<void> {
    await this.runMaintenance('weekly');
  }

  async runMonthly(): Promise<void> {
    await this.runMaintenance('monthly');
  }

  // Génération d'un plan de maintenance
  generateMaintenancePlan(): void {
    console.log(chalk.cyan('\n📅 PLAN DE MAINTENANCE RECOMMANDÉ\n'));
    
    const dailyTasks = this.tasks.filter(t => t.frequency === 'daily');
    const weeklyTasks = this.tasks.filter(t => t.frequency === 'weekly');
    const monthlyTasks = this.tasks.filter(t => t.frequency === 'monthly');
    
    console.log(chalk.yellow('📅 QUOTIDIEN:'));
    dailyTasks.forEach(task => {
      const critical = task.critical ? ' 🔴' : ' 🟢';
      console.log(`  ${critical} ${task.name}`);
    });
    
    console.log(chalk.yellow('\n📅 HEBDOMADAIRE:'));
    weeklyTasks.forEach(task => {
      const critical = task.critical ? ' 🔴' : ' 🟢';
      console.log(`  ${critical} ${task.name}`);
    });
    
    console.log(chalk.yellow('\n📅 MENSUEL:'));
    monthlyTasks.forEach(task => {
      const critical = task.critical ? ' 🔴' : ' 🟢';
      console.log(`  ${critical} ${task.name}`);
    });
    
    console.log(chalk.blue('\n💡 CONSEILS:'));
    console.log(chalk.blue('  - Automatiser les tâches quotidiennes avec cron'));
    console.log(chalk.blue('  - Configurer des alertes pour les tâches critiques'));
    console.log(chalk.blue('  - Documenter les procédures de maintenance'));
    console.log(chalk.blue('  - Former l\'équipe aux procédures de maintenance'));
  }
}

// ===== EXÉCUTION =====

if (require.main === module) {
  const scheduler = new MaintenanceScheduler();
  
  const frequency = process.argv[2] as 'daily' | 'weekly' | 'monthly' | 'plan';
  
  switch (frequency) {
    case 'daily':
      scheduler.runDaily();
      break;
    case 'weekly':
      scheduler.runWeekly();
      break;
    case 'monthly':
      scheduler.runMonthly();
      break;
    case 'plan':
      scheduler.generateMaintenancePlan();
      break;
    default:
      console.log(chalk.red('Usage: npm run maintenance:daily|weekly|monthly|plan'));
      process.exit(1);
  }
}

export { MaintenanceScheduler }; 