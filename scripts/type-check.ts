#!/usr/bin/env tsx

import { execSync } from 'child_process';

console.log('🔍 Vérification du projet TypeScript...\n');

try {
  console.log('⏳ Vérification TypeScript avec --strict...');
  execSync('npx tsc --noEmit --strict', { stdio: 'inherit' });
  console.log('✅ TypeScript compilé sans erreur avec --strict\n');

  console.log('⏳ Vérification des imports avec --skipLibCheck...');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
  console.log('✅ Vérification des imports terminée\n');

  console.log('🎉 Tout est bon. Aucun problème détecté.');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erreurs détectées lors de la vérification TypeScript');
  process.exit(1);
}
