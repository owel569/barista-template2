#!/usr/bin/env tsx

/**
 * Script pour corriger les erreurs de guillemets mal échappés
 */

import fs from 'fs';
import { glob } from 'glob';

// Patterns pour corriger les guillemets mal échappés
const QUOTE_FIXES = [
  // Correction des guillemets dans les chaînes de caractères
  {
    pattern: /message:\s*"([^"]*)"([^"]*)"([^"]*)"/g,
    replacement: (match: string, p1: string, p2: string, p3: string) => {
      return `message: "${p1}'${p2}'${p3}"`;
    }
  },
  {
    pattern: /title:\s*"([^"]*)"([^"]*)"([^"]*)"/g,
    replacement: (match: string, p1: string, p2: string, p3: string) => {
      return `title: "${p1}'${p2}'${p3}"`;
    }
  },
  // Correction des guillemets dans les chaînes simples
  {
    pattern: /"([^"]*)"([^"]*)"([^"]*)"/g,
    replacement: (match: string, p1: string, p2: string, p3: string) => {
      return `"${p1}'${p2}'${p3}"`;
    }
  }
];

async function fixQuotesInFile(filePath: string): Promise<number> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let fixes = 0;

    // Appliquer les corrections de guillemets
    for (const fix of QUOTE_FIXES) {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern, fix.replacement);
        fixes += matches.length;
      }
    }

    // Écrire le fichier si des changements ont été faits
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${filePath}: ${fixes} correction(s) de guillemets`);
    }

    return fixes;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}:`, error);
    return 0;
  }
}

async function fixAllQuoteErrors(): Promise<void> {
  console.log('🔧 Correction des erreurs de guillemets...\n');

  const files = await glob('client/src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  let totalFixes = 0;

  for (const file of files) {
    const fixes = await fixQuotesInFile(file);
    totalFixes += fixes;
  }

  console.log(`\n📊 Total des corrections de guillemets: ${totalFixes}`);
}

// Exécuter le script
fixAllQuoteErrors().catch(console.error); 