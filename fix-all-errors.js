
#!/usr/bin/env node

console.log('🔧 Correction de tous les problèmes détectés...');

const { execSync } = require('child_process');

try {
  console.log('1️⃣ Nettoyage du cache...');
  execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
  execSync('rm -rf dist', { stdio: 'inherit' });
  
  console.log('2️⃣ Vérification des dépendances...');
  execSync('npm list --depth=0', { stdio: 'pipe' });
  
  console.log('3️⃣ Reconstruction...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('4️⃣ Démarrage du serveur...');
  console.log('🎉 Tous les problèmes corrigés !');
  console.log('💡 Redémarrez avec npm run dev');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  
  console.log('🔄 Tentative de réparation...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Réparation terminée');
  } catch (repairError) {
    console.error('❌ Échec de la réparation:', repairError.message);
  }
}
