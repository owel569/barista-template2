
import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import { promisify } from 'util';

const logToFile = (message: string) => {
  fs.appendFileSync('verification.log', `${new Date().toISOString()} - ${message}\n`);
};

const execAsync = promisify(execSync);

async function runProfessionalFixes(): Promise<void> {
  console.log(chalk.cyan('🚀 BARISTA CAFÉ - CORRECTION PROFESSIONNELLE COMPLÈTE\n'));
  console.log(chalk.blue('═'.repeat(60)));
  
  const steps = [
    {
      name: 'Correction des types ANY',
      command: 'npm run fix:any-types -- --apply',
      critical: true
    },
    {
      name: 'Correction TypeScript complète',
      command: 'tsx scripts/fix-typescript-errors.ts',
      critical: true
    },
    {
      name: 'Correction professionnelle complète',
      command: 'tsx scripts/fix-complete-professional.ts',
      critical: true
    },
    {
      name: 'Vérification TypeScript finale',
      command: 'npx tsc --noEmit --strict',
      critical: false
    },
    {
      name: 'Vérification ESLint',
      command: 'npm run lint',
      critical: false
    }
  ];

  let successCount = 0;
  let totalSteps = steps.length;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step) continue; // Sécurité linter : step est toujours défini mais on ajoute une vérification
    console.log(chalk.yellow(`\n📋 ÉTAPE ${i + 1}/${totalSteps}: ${step.name}`));
    console.log(chalk.gray(`Commande: ${step.command}`));
    logToFile(`START: ${step.name}`);
    try {
      // Vérification dépendances critiques
      if (step.command.includes('tsx')) {
        try { execSync('tsx --version', { stdio: 'ignore' }); } catch { console.log(chalk.red('❌ TSX non installé. Exécutez "npm install -g tsx"')); process.exit(1); }
      }
      if (step.command.includes('eslint')) {
        try { execSync('eslint --version', { stdio: 'ignore' }); } catch { console.log(chalk.red('❌ ESLint non installé. Exécutez "npm install --save-dev eslint"')); process.exit(1); }
      }
      const output = execSync(step.command, { encoding: 'utf8', stdio: 'pipe' });
      logToFile(`SUCCESS: ${step.name}`);
      console.log(chalk.green(`✅ ${step.name} - SUCCÈS`));
      if (output.trim()) {
        console.log(chalk.gray(output.trim()));
        logToFile(output.trim());
      }
      successCount++;
    } catch (error) {
      const errorOutput = (error as any).stdout || (error as any).stderr || error;
      logToFile(`FAIL: ${step.name} - ${errorOutput}`);
      if (step.critical) {
        console.log(chalk.red(`❌ ${step.name} - ÉCHEC CRITIQUE`));
        console.log(chalk.red(errorOutput.toString()));
        break;
      } else {
        console.log(chalk.yellow(`⚠️  ${step.name} - AVERTISSEMENT`));
        console.log(chalk.gray(errorOutput.toString()));
      }
    }
  }

  // Rapport final
  console.log(chalk.cyan('\n🎯 RAPPORT FINAL'));
  console.log(chalk.blue('═'.repeat(60)));
  
  const successPercentage = Math.round((successCount / totalSteps) * 100);
  
  if (successPercentage === 100) {
    console.log(chalk.green(`✅ SUCCÈS COMPLET: ${successPercentage}% (${successCount}/${totalSteps})`));
    console.log(chalk.green('🏆 NIVEAU PROFESSIONNEL ATTEINT - 100%'));
    console.log(chalk.green('🚀 Votre restaurant Barista Café est prêt pour la production!'));
  } else if (successPercentage >= 80) {
    console.log(chalk.yellow(`⚠️  SUCCÈS PARTIEL: ${successPercentage}% (${successCount}/${totalSteps})`));
    console.log(chalk.yellow('🔧 Quelques optimisations supplémentaires recommandées'));
  } else {
    console.log(chalk.red(`❌ CORRECTIONS NÉCESSAIRES: ${successPercentage}% (${successCount}/${totalSteps})`));
    console.log(chalk.red('🛠️  Intervention manuelle requise'));
  }
  
  console.log(chalk.blue('\n═'.repeat(60)));
  console.log(chalk.cyan('🔗 Documentation: voir replit.md pour plus d\'informations'));
}

runProfessionalFixes();
