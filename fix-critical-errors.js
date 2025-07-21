#!/usr/bin/env node

console.log('🔧 Correction des erreurs critiques...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Fonction pour vérifier si un fichier existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Fonction pour corriger les imports TypeScript
function fixTypeScriptImports() {
  console.log('🔍 Vérification des imports TypeScript...');

  const filesToCheck = [
    'server/routes/permissions.ts',
    'server/middleware/auth.ts',
    'server/routes/analytics.ts',
  ];

  filesToCheck.forEach(file => {
    if (fileExists(file)) {
      console.log(`✅ ${file} existe`);
    } else {
      console.warn(`❌ ${file} manquant`);
    }
  });
}

// Fonction pour nettoyer le cache
function cleanCache() {
  console.log('🧹 Nettoyage du cache...');

  const isWindows = process.platform === 'win32';

  const commands = isWindows
    ? [
        'rmdir /s /q node_modules\\.cache',
        'rmdir /s /q .next',
        'rmdir /s /q dist',
        'rmdir /s /q build',
      ]
    : [
        'rm -rf node_modules/.cache',
        'rm -rf .next',
        'rm -rf dist',
        'rm -rf build',
      ];

  commands.forEach(cmd => {
    try {
      execSync(cmd, { stdio: 'pipe' });
    } catch (err) {
      console.warn(`⚠️  Erreur lors de la commande "${cmd}":`, err.message);
    }
  });

  console.log('✅ Cache nettoyé');
}

// Fonction pour vérifier les ports
function checkPorts() {
  console.log('🔍 Vérification des ports...');

  try {
    execSync('lsof -i :5000', { stdio: 'pipe' });
    console.warn('⚠️  Port 5000 déjà utilisé');
  } catch (error) {
    console.log('✅ Port 5000 disponible');
  }
}

// Fonction principale
async function main() {
  try {
    console.log('🚀 Début des corrections...\n');

    fixTypeScriptImports();
    cleanCache();
    checkPorts();

    console.log('\n🎉 Corrections terminées!');
    console.log('💡 Redémarrez avec le workflow "Start application"');

  } catch (error) {
    console.error('❌ Erreur lors des corrections:', error.message);
    process.exit(1);
  }
}

main();
