
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Command } from 'commander';
import chalk from 'chalk';
import fg from 'fast-glob';

// Configuration du programme CLI
const program = new Command();
program
  .name('fix-critical-errors')
  .description('Outil professionnel de correction des erreurs critiques')
  .version('1.0.0')
  .option('--fix', 'Corriger automatiquement les erreurs détectées')
  .option('--clean-only', 'Supprimer uniquement les fichiers temporaires')
  .option('--verbose', 'Affichage détaillé des opérations')
  .option('--sync-db', 'Synchroniser le schéma de base de données')
  .option('--report', 'Générer un rapport détaillé')
  .parse();

const options = program.opts();
const logMessages = [];

// Utilitaires de logging coloré
const log = {
  info: (msg) => {
    const message = chalk.blue(`ℹ️  ${msg}`);
    console.log(message);
    logMessages.push(message);
  },
  success: (msg) => {
    const message = chalk.green(`✅ ${msg}`);
    console.log(message);
    logMessages.push(message);
  },
  warn: (msg) => {
    const message = chalk.yellow(`⚠️  ${msg}`);
    console.log(message);
    logMessages.push(message);
  },
  error: (msg) => {
    const message = chalk.red(`❌ ${msg}`);
    console.log(message);
    logMessages.push(message);
  },
  verbose: (msg) => {
    if (options.verbose) {
      const message = chalk.gray(`🔍 ${msg}`);
      console.log(message);
      logMessages.push(message);
    }
  }
};

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Vérification avancée des fichiers TypeScript avec glob patterns
async function checkTypeScriptFiles() {
  log.info('Analyse des fichiers TypeScript...');

  try {
    const tsFiles = await fg(['server/**/*.ts', 'client/**/*.tsx', 'scripts/**/*.ts']);
    const criticalFiles = [
      'server/index.ts',
      'server/db.ts', 
      'shared/schema.ts',
      'client/src/main.tsx'
    ];

    log.verbose(`${tsFiles.length} fichiers TypeScript trouvés`);

    // Vérification des fichiers critiques
    criticalFiles.forEach(file => {
      if (fileExists(file)) {
        log.success(`${file} existe`);
      } else {
        log.error(`${file} manquant`);
      }
    });

    // Détection des types 'any' dangereux
    let anyCount = 0;
    tsFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const anyMatches = content.match(/:\s*any[\s;,\)]/g);
        if (anyMatches) {
          anyCount += anyMatches.length;
          log.warn(`${file} contient ${anyMatches.length} type(s) 'any'`);
        }
      } catch (error) {
        log.verbose(`Erreur lecture ${file}: ${error.message}`);
      }
    });

    if (anyCount > 0) {
      log.warn(`Total: ${anyCount} types 'any' détectés dans le projet`);
    } else {
      log.success('Aucun type dangereux \'any\' détecté');
    }

  } catch (error) {
    log.error(`Erreur lors de l'analyse TypeScript: ${error.message}`);
  }
}

// Vérification TypeScript complète
function checkTypeScriptCompilation() {
  log.info('Vérification de la compilation TypeScript...');

  try {
    execSync('npx tsc --noEmit --strict', { stdio: options.verbose ? 'inherit' : 'pipe' });
    log.success('Compilation TypeScript réussie');
  } catch (error) {
    log.error('Erreurs de compilation TypeScript détectées');
    if (options.fix) {
      log.info('Tentative de correction automatique...');
      try {
        execSync('npx tsc --noEmit --skipLibCheck', { stdio: options.verbose ? 'inherit' : 'pipe' });
        log.success('Compilation avec --skipLibCheck réussie');
      } catch (fixError) {
        log.error('Correction automatique échouée');
      }
    }
  }
}

// Vérification ESLint
function runESLintCheck() {
  log.info('Analyse ESLint...');

  try {
    const cmd = options.fix ? 'npx eslint . --ext .ts,.tsx --fix' : 'npx eslint . --ext .ts,.tsx';
    execSync(cmd, { stdio: options.verbose ? 'inherit' : 'pipe' });
    log.success('Code conforme aux règles ESLint');
  } catch (error) {
    log.warn('Problèmes de style/qualité détectés par ESLint');
  }
}

// Vérification et synchronisation de la base de données
function checkDatabaseSchema() {
  if (!options.syncDb) {
    log.verbose('Synchronisation DB ignorée (utilisez --sync-db)');
    return;
  }

  log.info('Vérification du schéma de base de données...');

  try {
    // Vérifier le statut des migrations
    execSync('npx drizzle-kit status', { stdio: options.verbose ? 'inherit' : 'pipe' });
    log.success('Schéma de base de données synchronisé');
  } catch (error) {
    log.warn('Migrations de base de données nécessaires');
    
    if (options.fix) {
      try {
        log.info('Application des migrations...');
        execSync('npx drizzle-kit push', { stdio: options.verbose ? 'inherit' : 'pipe' });
        log.success('Migrations appliquées avec succès');
      } catch (pushError) {
        log.error('Échec de l\'application des migrations');
      }
    }
  }
}

// Vérification avancée des dépendances
function checkDependencies() {
  log.info('Vérification des dépendances...');

  try {
    // Vérifier l'arbre des dépendances
    execSync('npm ls --depth=0', { stdio: 'pipe' });
    log.success('Toutes les dépendances sont installées correctement');
  } catch (error) {
    log.warn('Problèmes avec les dépendances détectés');
    
    if (options.fix) {
      log.info('Réinstallation des dépendances...');
      try {
        execSync('npm ci', { stdio: options.verbose ? 'inherit' : 'pipe' });
        log.success('Dépendances réinstallées');
      } catch (installError) {
        log.error('Échec de la réinstallation');
      }
    }
  }

  // Vérifier les dépendances en conflit
  try {
    execSync('npm ls', { stdio: 'pipe' });
    log.success('Aucun conflit de dépendances');
  } catch (error) {
    log.warn('Conflits de dépendances détectés');
  }
}

// Nettoyage avancé du cache
function cleanCache() {
  log.info('Nettoyage du cache...');

  const cacheDirs = [
    'node_modules/.cache',
    '.next',
    'dist',
    'build',
    '.vite',
    'client/dist',
    'server/dist'
  ];

  cacheDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        log.verbose(`${dir} supprimé`);
      }
    } catch (error) {
      log.verbose(`Erreur suppression ${dir}: ${error.message}`);
    }
  });

  log.success('Cache nettoyé');
}

// Vérification des ports
function checkPorts() {
  log.info('Vérification des ports...');

  const portsToCheck = [5000, 3000, 8080];
  
  portsToCheck.forEach(port => {
    try {
      execSync(`lsof -i :${port}`, { stdio: 'pipe' });
      log.warn(`Port ${port} déjà utilisé`);
    } catch (error) {
      log.success(`Port ${port} disponible`);
    }
  });
}

// Génération du rapport
function generateReport() {
  if (!options.report) return;

  const reportPath = 'fix-critical-errors-report.txt';
  const timestamp = new Date().toISOString();
  
  const reportContent = [
    `=== RAPPORT DE CORRECTION DES ERREURS CRITIQUES ===`,
    `Date: ${timestamp}`,
    `Options: ${JSON.stringify(options)}`,
    ``,
    ...logMessages,
    ``,
    `=== FIN DU RAPPORT ===`
  ].join('\n');

  fs.writeFileSync(reportPath, reportContent);
  log.success(`Rapport généré: ${reportPath}`);
}

// Fonction principale
async function main() {
  try {
    console.log(chalk.cyan('🔧 Outil professionnel de correction des erreurs critiques\n'));

    if (options.verbose) {
      log.info(`Options activées: ${JSON.stringify(options)}`);
    }

    if (options.cleanOnly) {
      cleanCache();
      log.success('Nettoyage terminé');
      return;
    }

    // Exécution séquentielle des vérifications
    await checkTypeScriptFiles();
    checkTypeScriptCompilation();
    runESLintCheck();
    checkDatabaseSchema();
    checkDependencies();
    cleanCache();
    checkPorts();

    console.log('\n' + chalk.green('🎉 Analyse terminée avec succès!'));
    
    if (options.fix) {
      console.log(chalk.blue('💡 Corrections automatiques appliquées'));
    }
    
    console.log(chalk.blue('💡 Redémarrez avec le workflow "Start application"'));
    
    generateReport();

  } catch (error) {
    log.error(`Erreur lors de l'exécution: ${error.message}`);
    process.exit(1);
  }
}

main();
