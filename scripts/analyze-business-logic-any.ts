
import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import chalk from 'chalk';

interface BusinessAnyUsage {
  file: string;
  line: number;
  context: string;
  suggestion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Patterns spécifiques à la logique métier du restaurant
const businessLogicPatterns = [
  // Gestion des commandes
  { pattern: /order.*:\s*any/gi, type: 'Order', severity: 'critical' as const },
  { pattern: /menu.*:\s*any/gi, type: 'MenuItem', severity: 'critical' as const },
  { pattern: /reservation.*:\s*any/gi, type: 'Reservation', severity: 'critical' as const },
  { pattern: /customer.*:\s*any/gi, type: 'Customer', severity: 'high' as const },
  { pattern: /payment.*:\s*any/gi, type: 'Payment', severity: 'critical' as const },
  { pattern: /inventory.*:\s*any/gi, type: 'InventoryItem', severity: 'high' as const },
  { pattern: /analytics.*:\s*any/gi, type: 'AnalyticsData', severity: 'medium' as const },
  { pattern: /employee.*:\s*any/gi, type: 'Employee', severity: 'high' as const },
  { pattern: /table.*:\s*any/gi, type: 'Table', severity: 'high' as const },
  { pattern: /booking.*:\s*any/gi, type: 'Booking', severity: 'critical' as const },
  { pattern: /pos.*:\s*any/gi, type: 'POSData', severity: 'critical' as const },
];

// Types spécifiques pour le restaurant
const restaurantTypes = {
  'Order': 'Order | OrderItem[]',
  'MenuItem': 'MenuItem | MenuCategory',
  'Reservation': 'Reservation | BookingDetails',
  'Customer': 'Customer | CustomerProfile',
  'Payment': 'PaymentMethod | Transaction',
  'InventoryItem': 'InventoryItem | StockLevel',
  'AnalyticsData': 'AnalyticsData | MetricData',
  'Employee': 'Employee | StaffMember',
  'Table': 'Table | TableReservation',
  'Booking': 'Booking | ReservationSlot',
  'POSData': 'POSTransaction | SaleData'
};

async function analyzeBusinessLogicAny(): Promise<void> {
  console.log(chalk.cyan('🔍 ANALYSE DES TYPES "ANY" DANS LA LOGIQUE MÉTIER\n'));
  console.log(chalk.blue('🍽️  Restaurant Barista Café - Analyse spécialisée'));
  console.log(chalk.blue('═'.repeat(60)));

  const findings: BusinessAnyUsage[] = [];

  try {
    const files = await fg([
      'server/**/*.ts',
      'client/**/*.tsx',
      'client/**/*.ts',
      'shared/**/*.ts'
    ], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
    });

    console.log(chalk.blue(`📁 Analyse de ${files.length} fichiers...\n`));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Recherche des patterns de logique métier avec any
        businessLogicPatterns.forEach(pattern => {
          const matches = line.match(pattern.pattern);
          if (matches) {
            const suggestion = restaurantTypes[pattern.type] || 'Record<string, unknown>';
            findings.push({
              file,
              line: index + 1,
              context: line.trim(),
              suggestion: `Remplacer par: ${suggestion}`,
              severity: pattern.severity
            });
          }
        });

        // Détection des any dangereux dans les fonctions critiques
        if (line.includes('any') && (
          line.includes('processPayment') ||
          line.includes('createOrder') ||
          line.includes('updateInventory') ||
          line.includes('manageReservation') ||
          line.includes('calculateTotal') ||
          line.includes('generateInvoice')
        )) {
          findings.push({
            file,
            line: index + 1,
            context: line.trim(),
            suggestion: 'CRITIQUE: Fonction métier critique avec type any',
            severity: 'critical'
          });
        }
      });
    }

    // Affichage des résultats par severité
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');
    const mediumFindings = findings.filter(f => f.severity === 'medium');

    console.log(chalk.red(`🚨 CRITIQUE (${criticalFindings.length}): Types any dans fonctions essentielles`));
    criticalFindings.forEach(finding => {
      console.log(chalk.red(`   ${finding.file}:${finding.line}`));
      console.log(chalk.gray(`      ${finding.context}`));
      console.log(chalk.yellow(`      💡 ${finding.suggestion}`));
      console.log();
    });

    console.log(chalk.yellow(`⚠️  ÉLEVÉ (${highFindings.length}): Types any dans données importantes`));
    highFindings.forEach(finding => {
      console.log(chalk.yellow(`   ${finding.file}:${finding.line}`));
      console.log(chalk.gray(`      ${finding.context}`));
      console.log(chalk.cyan(`      💡 ${finding.suggestion}`));
      console.log();
    });

    console.log(chalk.blue(`ℹ️  MOYEN (${mediumFindings.length}): Types any à améliorer`));
    mediumFindings.slice(0, 5).forEach(finding => {
      console.log(chalk.blue(`   ${finding.file}:${finding.line}`));
      console.log(chalk.gray(`      ${finding.context}`));
      console.log(chalk.cyan(`      💡 ${finding.suggestion}`));
      console.log();
    });

    // Résumé et recommandations
    console.log(chalk.cyan('\n📊 RÉSUMÉ ANALYSE MÉTIER'));
    console.log(chalk.blue('═'.repeat(60)));
    console.log(chalk.white(`Total problèmes détectés: ${findings.length}`));
    console.log(chalk.red(`🚨 Critiques à corriger immédiatement: ${criticalFindings.length}`));
    console.log(chalk.yellow(`⚠️  Élevés à corriger rapidement: ${highFindings.length}`));
    console.log(chalk.blue(`ℹ️  Moyens à améliorer: ${mediumFindings.length}`));

    if (criticalFindings.length > 0) {
      console.log(chalk.red('\n🎯 ACTIONS PRIORITAIRES:'));
      console.log(chalk.white('1. Corriger immédiatement les fonctions de paiement'));
      console.log(chalk.white('2. Typer correctement les commandes et réservations'));
      console.log(chalk.white('3. Sécuriser les données client et inventaire'));
    }

    if (findings.length === 0) {
      console.log(chalk.green('\n🎉 EXCELLENT! Aucun type "any" problématique détecté dans la logique métier'));
      console.log(chalk.green('🏆 Votre restaurant Barista Café respecte les standards professionnels'));
    }

  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de l\'analyse:'), error);
  }
}

analyzeBusinessLogicAny();
