/**
 * Script de correction automatique des erreurs de syntaxe
 * Logique métier professionnelle et optimisée
 */

import * as fs from 'fs';
import * as path from 'path';

// Patterns d'erreurs courantes à corriger
const syntaxFixes = [
  // Correction des parenthèses mal fermées dans les schémas Zod
  {
    pattern: /z\.string\(\)\}\)\./g,
    replacement: 'z.string().'
  },
  {
    pattern: /z\.number\(\)\}\)\./g,
    replacement: 'z.number().'
  },
  {
    pattern: /z\.coerce\.number\(\)\}\)\./g,
    replacement: 'z.coerce.number().'
  },
  {
    pattern: /z\.enum\(\[.*?\]\)\}\)\./g,
    replacement: (match: string) => match.replace(/}\)\.$/, ').')
  },
  {
    pattern: /z\.boolean\(\)\}\)\./g,
    replacement: 'z.boolean().'
  },
  
  // Correction des parenthèses mal fermées dans les appels de fonction
  {
    pattern: /new Date\(}\)\./g,
    replacement: 'new Date().'
  },
  {
    pattern: /new Date\(.*?}\)\./g,
    replacement: (match: string) => match.replace(/}\)\.$/, ').')
  },
  
  // Correction des parenthèses mal fermées dans les objets
  {
    pattern: /queryKey: \['.*?'\] \)\}\)/g,
    replacement: (match: string) => match.replace(/ \)\}\)$/, ' }')
  },
  
  // Correction des parenthèses mal fermées dans les paramètres
  {
    pattern: /\(\{.*?\}\)\}\)/g,
    replacement: (match: string) => match.replace(/}\)\)$/, '})')
  },
  
  // Correction des parenthèses mal fermées dans les templates
  {
    pattern: /\$\{.*?\}\)/g,
    replacement: (match: string) => match.replace(/}\)$/, '}')
  },
  
  // Correction des parenthèses mal fermées dans les tableaux
  {
    pattern: /\[.*?\]\)/g,
    replacement: (match: string) => match.replace(/\]\)$/, ']')
  },
  
  // Correction des parenthèses mal fermées dans les chaînes
  {
    pattern: /'.*?'\)/g,
    replacement: (match: string) => match.replace(/\)$/, '')
  },
  
  // Correction des parenthèses mal fermées dans les nombres
  {
    pattern: /\d+\)/g,
    replacement: (match: string) => match.replace(/\)$/, '')
  },
  
  // Correction des parenthèses mal fermées dans les variables
  {
    pattern: /\w+\)/g,
    replacement: (match: string) => match.replace(/\)$/, '')
  }
];

// Fonction pour corriger un fichier
function fixFile(filePath: string): void {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Appliquer toutes les corrections
    for (const fix of syntaxFixes) {
      if (typeof fix.replacement === 'string') {
        content = content.replace(fix.pattern, fix.replacement);
      } else {
        content = content.replace(fix.pattern, fix.replacement);
      }
    }
    
    // Si le contenu a changé, écrire le fichier
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la correction de ${filePath}:`, error);
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir: string, fileExtensions: string[] = ['.ts', '.tsx']): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...walkDir(fullPath, fileExtensions));
    } else if (stat.isFile() && fileExtensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fonction principale
function main(): void {
  console.log('🔧 Début de la correction automatique des erreurs de syntaxe...');
  
  const clientDir = path.join(process.cwd(), 'client', 'src');
  const serverDir = path.join(process.cwd(), 'server');
  
  const clientFiles = walkDir(clientDir, ['.ts', '.tsx']);
  const serverFiles = walkDir(serverDir, ['.ts']);
  
  const allFiles = [...clientFiles, ...serverFiles];
  
  console.log(`📁 ${allFiles.length} fichiers trouvés`);
  
  let correctedCount = 0;
  
  for (const file of allFiles) {
    try {
      const originalContent = fs.readFileSync(file, 'utf8');
      fixFile(file);
      
      const newContent = fs.readFileSync(file, 'utf8');
      if (originalContent !== newContent) {
        correctedCount++;
      }
    } catch (error) {
      console.error(`❌ Erreur avec ${file}:`, error);
    }
  }
  
  console.log(`✅ Correction terminée. ${correctedCount} fichiers modifiés.`);
}

// Exécuter le script
if (require.main === module) {
  main();
}

export { fixFile, walkDir, main }; 