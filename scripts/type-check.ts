
#!/usr/bin/env tsx

import { execSync } from 'child_process';

console.log('🔍 Vérification TypeScript...\n');

try {
  // Vérification stricte
  execSync('npx tsc --noEmit --strict', { stdio: 'inherit' });
  console.log('✅ Aucune erreur TypeScript détectée');
  
  // Vérification des imports
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
  console.log('✅ Tous les imports sont valides');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erreurs TypeScript détectées');
  process.exit(1);
}
