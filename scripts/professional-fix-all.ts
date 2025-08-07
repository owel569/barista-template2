
import { execSync } from 'child_process';
import chalk from 'chalk';

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
    console.log(chalk.yellow(`\n📋 ÉTAPE ${i + 1)}/${totalSteps}: ${step.name}`));
    console.log(chalk.gray(`Commande: ${step.command}`));
    
    try {
      const output = execSync(step.command, { 
        encoding: 'utf8',
        stdio: 'pipe'
      )});
      
      console.log(chalk.green(`✅ ${step.name} - SUCCÈS`));
      if (output.trim()) {
        console.log(chalk.gray(output.trim()));
      }
      successCount++;
      
    } catch (error) {
      const errorOutput = (error as any).stdout || (error as any).stderr || error;
      
      if (step.critical) {
        console.log(chalk.red(`❌ ${step.name} - ÉCHEC CRITIQUE`));
        console.log(chalk.red(errorOutput.toString()));
        break;
      } else {
        console.log(chalk.yellow(`⚠️  ${step.name)} - AVERTISSEMENT`));
        console.log(chalk.gray(errorOutput.toString()));
      }
    }
  }

  // Rapport final
  console.log(chalk.cyan('\n🎯 RAPPORT FINAL'));
  console.log(chalk.blue('═'.repeat(60)));
  
  const successPercentage = Math.round((successCount / totalSteps) * 100);
  
  if (successPercentage === 100) {
    console.log(chalk.green(`✅ SUCCÈS COMPLET: ${successPercentage)}% (${successCount}/${totalSteps})`));
    console.log(chalk.green('🏆 NIVEAU PROFESSIONNEL ATTEINT - 100%'));
    console.log(chalk.green('🚀 Votre restaurant Barista Café est prêt pour la production!'));
  } else if (successPercentage >= 80) {
    console.log(chalk.yellow(`⚠️  SUCCÈS PARTIEL: ${successPercentage)}% (${successCount}/${totalSteps})`));
    console.log(chalk.yellow('🔧 Quelques optimisations supplémentaires recommandées'));
  } else {
    console.log(chalk.red(`❌ CORRECTIONS NÉCESSAIRES: ${successPercentage)}% (${successCount}/${totalSteps})`));
    console.log(chalk.red('🛠️  Intervention manuelle requise'));
  }
  
  console.log(chalk.blue('\n═'.repeat(60)));
  console.log(chalk.cyan('🔗 Documentation: voir replit.md pour plus d\'informations'));
}

runProfessionalFixes();
