#!/usr/bin/env node

/**
 * Script de test pour vérifier l'installation automatique
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Test de l\'installation automatique...');

// Vérifier que les fichiers essentiels existent
const requiredFiles = [
  'setup-universal.cjs',
  'setup-universal.js',
  'start.sh',
  'README.md',
  'INSTALLATION.md',
  'GITHUB_SETUP.md',
  'package.json',
  'server/index.ts'
];

console.log('📁 Vérification des fichiers...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} MANQUANT`);
  }
}

// Vérifier que le fichier .env existe
console.log('\n🔧 Vérification de la configuration...');
if (fs.existsSync('.env')) {
  console.log('✅ Fichier .env configuré');
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('DATABASE_URL')) {
    console.log('✅ DATABASE_URL configuré');
  } else {
    console.log('❌ DATABASE_URL manquant dans .env');
  }
} else {
  console.log('⚠️  Fichier .env pas encore créé (normal lors du premier test)');
}

// Vérifier que PostgreSQL est accessible
console.log('\n🗄️  Vérification de PostgreSQL...');
try {
  execSync('which psql', { stdio: 'ignore' });
  console.log('✅ PostgreSQL installé');
} catch (error) {
  console.log('❌ PostgreSQL non accessible');
}

// Vérifier que les dépendances npm sont installées
console.log('\n📦 Vérification des dépendances...');
if (fs.existsSync('node_modules')) {
  console.log('✅ Node modules installés');
} else {
  console.log('❌ Node modules manquants - exécuter: npm install');
}

console.log('\n🎉 Test terminé!');
console.log('\nCommandes d\'installation:');
console.log('1. npm install');
console.log('2. node setup-universal.cjs');
console.log('3. npm run dev');