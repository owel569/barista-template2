#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import glob from 'fast-glob';

interface FixRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const fixRules: FixRule[] = [
  // Erreurs de syntaxe communes
  {
    pattern: /\[,\]/g,
    replacement: '[]',
    description: 'Corriger les tableaux avec virgules orphelines'
  },
  {
    pattern: /\{\s*,\s*\}/g,
    replacement: '{}',
    description: 'Corriger les objets avec virgules orphelines'
  },
  {
    pattern: /\)\}\}/g,
    replacement: ')}}',
    description: 'Corriger les parenthèses mal fermées dans JSX'
  },
  {
    pattern: /queryKey:\s*\[[^\]]*,\s*\]\s*\)\s*\}\s*\}/g,
    replacement: (match: string) => match.replace(/,\s*\]/, ']'),
    description: 'Corriger les virgules trailing dans queryKey'
  },
  {
    pattern: /=\s*\[\s*,\s*\]/g,
    replacement: '= []',
    description: 'Corriger les assignations de tableaux vides'
  },
  {
    pattern: /error\s+instanceof\s+Error\s+\?\s+error\.message\s+:\s+['"']Erreur inconnue['"]\s*\)\s*\}\s*\}/g,
    replacement: (match: string) => match.replace(/\)\s*\}\s*\}/, ' })'),
    description: 'Corriger les parenthèses dans les error handlers'
  },
  {
    pattern: /\$\{[^}]*\)\}/g,
    replacement: (match: string) => match.replace(/\)\}/, '}'),
    description: 'Corriger les template literals avec parenthèses extra'
  },
  {
    pattern: /\{\s*([^}]*)\s*\)\s*\}/g,
    replacement: '{ $1 }',
    description: 'Corriger les objets avec parenthèses mal fermées'
  }
];

async function fixTypeScriptErrors() {
  console.log('🔧 Début de la correction automatique des erreurs TypeScript...\n');

  // Trouver tous les fichiers TypeScript et TSX
  const files = await glob([
    'client/src/**/*.{ts,tsx}',
    'server/**/*.ts',
    'scripts/**/*.ts'
  ], {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  console.log(`📂 ${files.length} fichiers trouvés\n`);

  let totalFixes = 0;

  for (const file of files) {
    try {
      let content = readFileSync(file, 'utf-8');
      let fileFixes = 0;
      let hasChanges = false;

      for (const rule of fixRules) {
        const matches = content.match(rule.pattern);
        if (matches) {
          const beforeLength = content.length;
          if (typeof rule.replacement === 'string') {
            content = content.replace(rule.pattern, rule.replacement);
          } else {
            content = content.replace(rule.pattern, rule.replacement);
          }
          
          if (content.length !== beforeLength || content !== readFileSync(file, 'utf-8')) {
            fileFixes += matches.length;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        writeFileSync(file, content, 'utf-8');
        console.log(`✅ ${file}: ${fileFixes} corrections appliquées`);
        totalFixes += fileFixes;
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${file}:`, error);
    }
  }

  console.log(`\n🎉 Correction terminée! ${totalFixes} erreurs corrigées au total.\n`);
}

// Corrections spécifiques par fichier
const specificFixes: Record<string, Array<{ from: string; to: string }>> = {
  'client/src/components/delivery-tracking.tsx': [
    {
      from: 'const { data: deliveries = [,], isLoading }',
      to: 'const { data: deliveries = [], isLoading }'
    },
    {
      from: 'queryKey: ["/api/deliveries",]',
      to: 'queryKey: ["/api/deliveries"]'
    }
  ],
  'client/src/components/menu.tsx': [
    {
      from: 'onClick={() => addToCart({item})}',
      to: 'onClick={() => addToCart(item)}'
    }
  ],
  'client/src/components/interactive-reservation.tsx': [
    {
      from: '<div className="space-y-4">',
      to: '<div className="space-y-4">'
    }
  ]
};

async function applySpecificFixes() {
  console.log('🎯 Application des corrections spécifiques...\n');

  for (const [filePath, fixes] of Object.entries(specificFixes)) {
    try {
      let content = readFileSync(filePath, 'utf-8');
      let applied = 0;

      for (const fix of fixes) {
        if (content.includes(fix.from)) {
          content = content.replace(fix.from, fix.to);
          applied++;
        }
      }

      if (applied > 0) {
        writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${filePath}: ${applied} corrections spécifiques appliquées`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${filePath}:`, error);
    }
  }
}

async function main() {
  await fixTypeScriptErrors();
  await applySpecificFixes();
  
  console.log('🚀 Toutes les corrections automatiques sont terminées!');
  console.log('💡 Lancer `npm run type-check` pour vérifier les corrections.');
}

if (require.main === module) {
  main().catch(console.error);
}

export { fixTypeScriptErrors, applySpecificFixes };