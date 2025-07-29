#!/usr/bin/env tsx

/**
 * Script final pour corriger toutes les erreurs restantes
 */

import fs from 'fs';
import { glob } from 'glob';

// Patterns de correction finale
const FINAL_FIXES = [
  // Correction des balises JSX non fermées
  {
    pattern: /<([A-Z][a-zA-Z]*)([^>]*)\/>/g,
    replacement: (match: string, tag: string, attrs: string) => {
      // Vérifier si c'est une balise auto-fermante
      const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
      if (selfClosingTags.includes(tag.toLowerCase())) {
        return match;
      }
      // Sinon, fermer la balise
      return `<${tag}${attrs}></${tag}>`;
    }
  },
  // Correction des expressions JSX sans parent
  {
    pattern: /return\s*\(\s*([^)]*)\s*\)\s*;/g,
    replacement: (match: string, content: string) => {
      if (content.includes('<') && !content.includes('<div') && !content.includes('<Fragment')) {
        return `return (<div>${content}</div>);`;
      }
      return match;
    }
  },
  // Correction des guillemets mal échappés restants
  {
    pattern: /"([^"]*)"([^"]*)"([^"]*)"/g,
    replacement: (match: string, p1: string, p2: string, p3: string) => {
      return `"${p1}'${p2}'${p3}"`;
    }
  }
];

async function fixRemainingErrors(): Promise<void> {
  console.log('🔧 Correction finale des erreurs restantes...\n');

  const files = await glob('client/src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  let totalFixes = 0;

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8');
      const originalContent = content;
      let fileFixes = 0;

      // Appliquer les corrections finales
      for (const fix of FINAL_FIXES) {
        const matches = content.match(fix.pattern);
        if (matches) {
          content = content.replace(fix.pattern, fix.replacement);
          fileFixes += matches.length;
        }
      }

      // Écrire le fichier si des changements ont été faits
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf-8');
        console.log(`✅ ${file}: ${fileFixes} correction(s)`);
        totalFixes += fileFixes;
      }
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de ${file}:`, error);
    }
  }

  console.log(`\n📊 Total des corrections finales: ${totalFixes}`);
  console.log('🎯 Correction finale terminée!');
}

// Exécuter le script
fixRemainingErrors().catch(console.error); 