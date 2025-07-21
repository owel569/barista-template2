
import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import chalk from 'chalk';

interface AnyReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Définitions des remplacements courants
const commonReplacements: AnyReplacement[] = [
  {
    pattern: /:\s*any\[\]/g,
    replacement: ': unknown[]',
    description: 'Array of any → Array of unknown'
  },
  {
    pattern: /:\s*any\s*\|/g,
    replacement: ': unknown |',
    description: 'Union with any → Union with unknown'
  },
  {
    pattern: /\|\s*any\s*;/g,
    replacement: '| unknown;',
    description: 'Union ending with any → Union ending with unknown'
  },
  {
    pattern: /event:\s*any/g,
    replacement: 'event: Event',
    description: 'Event handler any → Event'
  },
  {
    pattern: /error:\s*any/g,
    replacement: 'error: unknown',
    description: 'Error any → unknown'
  },
  {
    pattern: /data:\s*any/g,
    replacement: 'data: Record<string, unknown>',
    description: 'Data any → Record<string, unknown>'
  },
  {
    pattern: /props:\s*any/g,
    replacement: 'props: Record<string, unknown>',
    description: 'Props any → Record<string, unknown>'
  },
  {
    pattern: /params:\s*any/g,
    replacement: 'params: Record<string, unknown>',
    description: 'Params any → Record<string, unknown>'
  },
  {
    pattern: /config:\s*any/g,
    replacement: 'config: Record<string, unknown>',
    description: 'Config any → Record<string, unknown>'
  },
  {
    pattern: /options:\s*any/g,
    replacement: 'options: Record<string, unknown>',
    description: 'Options any → Record<string, unknown>'
  }
];

async function fixAnyTypes(dryRun: boolean = true): Promise<void> {
  console.log(chalk.cyan('🔧 Correction automatique des types "any"\n'));

  try {
    const files = await fg([
      'server/**/*.ts',
      'client/**/*.tsx',
      'client/**/*.ts',
      'scripts/**/*.ts',
      'shared/**/*.ts'
    ], {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    console.log(chalk.blue(`📁 ${files.length} fichiers TypeScript trouvés\n`));

    let totalReplacements = 0;
    const modifiedFiles: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      let fileReplacements = 0;

      for (const replacement of commonReplacements) {
        const matches = content.match(replacement.pattern);
        if (matches) {
          newContent = newContent.replace(replacement.pattern, replacement.replacement);
          fileReplacements += matches.length;
          console.log(chalk.yellow(`  ⚡ ${replacement.description}: ${matches.length} remplacement(s)`));
        }
      }

      if (fileReplacements > 0) {
        totalReplacements += fileReplacements;
        modifiedFiles.push(file);
        
        console.log(chalk.green(`✅ ${file}: ${fileReplacements} remplacement(s)`));
        
        if (!dryRun) {
          fs.writeFileSync(file, newContent);
        }
        console.log();
      }
    }

    console.log(chalk.magenta(`\n📊 Résumé:`));
    console.log(chalk.white(`  • ${totalReplacements} remplacements effectués`));
    console.log(chalk.white(`  • ${modifiedFiles.length} fichiers modifiés`));
    
    if (dryRun) {
      console.log(chalk.yellow(`\n⚠️  Mode simulation - aucun fichier n'a été modifié`));
      console.log(chalk.blue(`   Exécutez avec --apply pour appliquer les changements`));
    } else {
      console.log(chalk.green(`\n🎉 Modifications appliquées avec succès!`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la correction:'), error);
    process.exit(1);
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const applyChanges = args.includes('--apply');

fixAnyTypes(!applyChanges);
