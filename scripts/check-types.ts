#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

console.log(`${colors.cyan}🔍 Vérification TypeScript complète...${colors.reset}\n`);

try {
  // Vérification TypeScript avec configuration stricte
  const result = execSync('npx tsc --noEmit --strict --skipLibCheck', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log(`${colors.green}✅ Aucune erreur TypeScript détectée !${colors.reset}`);
  console.log(`${colors.green}🎉 Code TypeScript parfaitement typé.${colors.reset}\n`);
  process.exit(0);
  
} catch (error: any) {
  const output = error.stdout || error.stderr || '';
  const lines = output.split('\n').filter((line: string) => line.trim());
  
  if (lines.length === 0) {
    console.log(`${colors.green}✅ Aucune erreur TypeScript détectée !${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`${colors.red}❌ Erreurs TypeScript détectées:${colors.reset}\n`);
  
  const errorsByCategory: Record<string, string[]> = {
    'Property missing': [],
    'Type mismatch': [],
    'Parameter issues': [],
    'Import/Export': [],
    'Other': []
  };
  
  lines.forEach((line: string) => {
    if (line.includes('Property') && line.includes('missing')) {
      errorsByCategory['Property missing'].push(line);
    } else if (line.includes('Type') && (line.includes('not assignable') || line.includes('mismatch'))) {
      errorsByCategory['Type mismatch'].push(line);
    } else if (line.includes('Parameter') || line.includes('Argument')) {
      errorsByCategory['Parameter issues'].push(line);
    } else if (line.includes('Cannot find module') || line.includes('import')) {
      errorsByCategory['Import/Export'].push(line);
    } else if (line.includes('error TS')) {
      errorsByCategory['Other'].push(line);
    }
  });
  
  Object.entries(errorsByCategory).forEach(([category, errors]) => {
    if (errors.length > 0) {
      console.log(`${colors.yellow}📂 ${category} (${errors.length} erreurs):${colors.reset}`);
      errors.forEach(error => {
        console.log(`  ${colors.red}•${colors.reset} ${error}`);
      });
      console.log();
    }
  });
  
  console.log(`${colors.magenta}💡 Suggestions de correction:${colors.reset}`);
  console.log(`${colors.white}1. Utilisez les types globaux Express définis dans server/types/express.d.ts${colors.reset}`);
  console.log(`${colors.white}2. Ajoutez des types explicites aux paramètres 'any'${colors.reset}`);
  console.log(`${colors.white}3. Vérifiez les objets potentiellement undefined${colors.reset}`);
  console.log(`${colors.white}4. Importez les types manquants depuis @shared/schema${colors.reset}\n`);
  
  process.exit(1);
}