
#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { glob } from 'fast-glob';

async function fixImports() {
  console.log('🔧 Correction des imports...\n');

  const files = await glob([
    'client/src/**/*.{ts,tsx}',
    'server/**/*.{ts,tsx}',
    'scripts/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}'
  ], {
    ignore: ['**/node_modules/**', '**/dist/**']
  });

  let totalFixes = 0;

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanges = false;

    // Corrections communes
    const fixes = [
      // Import sql manquant pour Drizzle
      {
        pattern: /await db\.execute\(sql`/g,
        replacement: 'await db.execute(sql`',
        addImport: "import { sql } from 'drizzle-orm';"
      },
      // Import React manquant
      {
        pattern: /export.*React\./g,
        replacement: null,
        addImport: "import React from 'react';"
      },
      // Correction des imports relatifs
      {
        pattern: /from ['"]@\/components\/ui\/([^'"]+)['"]/g,
        replacement: "from '@/components/ui/$1'"
      },
      // Import logger manquant
      {
        pattern: /logger\./g,
        replacement: null,
        addImport: "import { logger } from '../server/logger';"
      }
    ];

    for (const fix of fixes) {
      if (fix.pattern.test(content)) {
        if (fix.addImport && !content.includes(fix.addImport.split(' ')[1])) {
          // Ajouter l'import au début du fichier
          const lines = content.split('\n');
          const firstImportIndex = lines.findIndex(line => line.startsWith('import'));
          if (firstImportIndex !== -1) {
            lines.splice(firstImportIndex, 0, fix.addImport);
            content = lines.join('\n');
            hasChanges = true;
            totalFixes++;
          }
        }
        if (fix.replacement) {
          content = content.replace(fix.pattern, fix.replacement);
          hasChanges = true;
          totalFixes++;
        }
      }
    }

    // Corrections spécifiques par type de fichier
    if (filePath.includes('admin/') && filePath.endsWith('.tsx')) {
      // Imports manquants pour les composants admin
      if (content.includes('useToast') && !content.includes("import { useToast }")) {
        content = "import { useToast } from '@/hooks/use-toast';\n" + content;
        hasChanges = true;
        totalFixes++;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Corrigé: ${filePath}`);
    }
  }

  console.log(`\n🎯 Total: ${totalFixes} corrections appliquées`);
}

fixImports().catch(console.error);
