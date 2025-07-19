#!/usr/bin/env tsx

import { execSync } from 'child_process';

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

console.log(`${colors.cyan}🔍 Vérification TypeScript stricte...${colors.reset}\n`);

try {
  const result = execSync('npx tsc --noEmit --strict --skipLibCheck', {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log(`${colors.green}✅ Aucune erreur TypeScript détectée !${colors.reset}`);
  console.log(`${colors.green}🎉 Tout est parfaitement typé.${colors.reset}\n`);
  process.exit(0);

} catch (error: any) {
  const output = error.stdout || error.stderr || '';
  const lines = output.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    console.log(`${colors.green}✅ Aucune erreur TypeScript détectée !${colors.reset}`);
    process.exit(0);
  }

  console.log(`${colors.red}❌ Erreurs TypeScript détectées :${colors.reset}\n`);

  const errorsByCategory: Record<string, string[]> = {
    'Property missing': [],
    'Type mismatch': [],
    'Parameter issues': [],
    'Import/Export': [],
    'Other': []
  };

  lines.forEach(line => {
    if (line.includes('Property') && line.includes('missing')) {
      errorsByCategory['Property missing']?.push(line);
    } else if (line.includes('not assignable') || line.includes('mismatch')) {
      errorsByCategory['Type mismatch']?.push(line);
    } else if (line.includes('Parameter') || line.includes('Argument')) {
      errorsByCategory['Parameter issues']?.push(line);
    } else if (line.includes('Cannot find module') || line.includes('import')) {
      errorsByCategory['Import/Export']?.push(line);
    } else if (line.includes('error TS')) {
      errorsByCategory['Other']?.push(line);
    }
  });

  Object.entries(errorsByCategory).forEach(([category, errors]) => {
    if (errors.length > 0) {
      console.log(`${colors.yellow}📂 ${category} (${errors.length} erreur${errors.length > 1 ? 's' : ''}) :${colors.reset}`);
      errors.forEach(error => console.log(`  ${colors.red}•${colors.reset} ${error}`));
      console.log();
    }
  });

  console.log(`${colors.magenta}💡 Suggestions :${colors.reset}`);
  console.log(`${colors.white}1. Vérifiez les types des objets complexes.${colors.reset}`);
  console.log(`${colors.white}2. Utilisez des types explicites au lieu de 'any'.${colors.reset}`);
  console.log(`${colors.white}3. Vérifiez que tous les modules et types sont bien importés.${colors.reset}`);
  console.log(`${colors.white}4. Activez l'autocomplétion dans votre IDE pour détecter les erreurs tôt.${colors.reset}\n`);

  process.exit(1);
}
