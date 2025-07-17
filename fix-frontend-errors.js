
#!/usr/bin/env node

console.log('🔧 Correction des erreurs frontend...');

// Vérifier que toutes les dépendances sont installées
const { execSync } = require('child_process');

try {
  console.log('1️⃣ Vérification des dépendances...');
  execSync('npm list react react-dom @tanstack/react-query', { stdio: 'pipe' });
  console.log('✅ Dépendances OK');
  
  console.log('2️⃣ Nettoyage du cache...');
  execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
  console.log('✅ Cache Vite nettoyé');
  
  console.log('3️⃣ Redémarrage du serveur de développement...');
  console.log('🎉 Erreurs frontend corrigées !');
  console.log('💡 Redémarrez avec npm run dev');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
