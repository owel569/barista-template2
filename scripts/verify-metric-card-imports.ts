
#!/usr/bin/env tsx

/**
 * Script de vérification des imports MetricCard après unification
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

const COMPONENT_PATHS = [
  'client/src/components/**/*.tsx',
  'client/src/pages/**/*.tsx'
];

const CORRECT_IMPORT = "import { MetricCard } from '@/components/admin/analytics/MetricCard';";
const DEPRECATED_IMPORTS = [
  "from './components/MetricCard'",
  "from '../analytics/components/MetricCard'",
  "from '../../analytics/components/MetricCard'",
  "from '../statistics/components/MetricCard'",
  "from '../../statistics/components/MetricCard'"
];

async function verifyMetricCardImports(): Promise<void> {
  console.log('🔍 Vérification des imports MetricCard...\n');

  const allFiles = await glob(COMPONENT_PATHS);
  const issues: Array<{ file: string; line: number; content: string }> = [];
  const correctedFiles: string[] = [];

  for (const file of allFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Vérifier les imports obsolètes
        for (const deprecatedImport of DEPRECATED_IMPORTS) {
          if (line.includes(deprecatedImport) && line.includes('MetricCard')) {
            issues.push({
              file,
              line: i + 1,
              content: line.trim()
            });
          }
        }
      }

      // Vérifier si le fichier utilise MetricCard mais n'a pas le bon import
      if (content.includes('<MetricCard') && !content.includes("@/components/admin/analytics/MetricCard")) {
        const hasAnyMetricCardImport = DEPRECATED_IMPORTS.some(imp => content.includes(imp));
        if (!hasAnyMetricCardImport) {
          issues.push({
            file,
            line: 1,
            content: 'Utilise MetricCard mais aucun import détecté'
          });
        }
      }

    } catch (error) {
      console.log(`❌ Erreur lecture ${file}:`, error instanceof Error ? error.message : error);
    }
  }

  // Rapport
  if (issues.length === 0) {
    console.log('✅ Tous les imports MetricCard sont corrects!\n');
  } else {
    console.log(`⚠️  ${issues.length} problème(s) détecté(s):\n`);
    
    for (const issue of issues) {
      console.log(`📁 ${issue.file}:${issue.line}`);
      console.log(`   ${issue.content}`);
      console.log('');
    }

    console.log('💡 Import correct à utiliser:');
    console.log(`   ${CORRECT_IMPORT}\n`);
  }

  // Vérifier que le composant principal existe
  try {
    const mainComponent = await fs.readFile('client/src/components/admin/analytics/MetricCard.tsx', 'utf-8');
    if (mainComponent.includes('export const MetricCard')) {
      console.log('✅ Composant MetricCard principal trouvé et correct');
    } else {
      console.log('❌ Composant MetricCard principal invalide');
    }
  } catch (error) {
    console.log('❌ Composant MetricCard principal introuvable!');
  }

  // Vérifier les exports dans l'index
  try {
    const indexFile = await fs.readFile('client/src/components/admin/analytics/index.ts', 'utf-8');
    if (indexFile.includes("export { MetricCard")) {
      console.log('✅ Export MetricCard dans index.ts correct');
    } else {
      console.log('❌ Export MetricCard manquant dans index.ts');
    }
  } catch (error) {
    console.log('❌ Fichier index.ts introuvable');
  }

  console.log('\n🎯 Vérification terminée!');
}

// Exécution
if (require.main === module) {
  verifyMetricCardImports().catch(console.error);
}

export { verifyMetricCardImports };
