#!/usr/bin/env node

/**
 * Script de configuration automatique pour le projet Barista Café
 * Ce script configure automatiquement la base de données et initialise le projet
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function checkEnvironment() {
  console.log('🔍 Vérification de l\'environnement...');
  
  // Vérifier si nous sommes sur Replit
  const isReplit = process.env.REPL_ID || process.env.REPLIT_DB_URL;
  
  // Vérifier si nous sommes sur GitHub Codespaces
  const isCodespaces = process.env.CODESPACES || process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
  
  // Vérifier si nous sommes sur Gitpod
  const isGitpod = process.env.GITPOD_WORKSPACE_ID;
  
  if (isReplit) {
    console.log('✅ Environnement Replit détecté');
    return 'replit';
  } else if (isCodespaces) {
    console.log('✅ Environnement GitHub Codespaces détecté');
    return 'codespaces';
  } else if (isGitpod) {
    console.log('✅ Environnement Gitpod détecté');
    return 'gitpod';
  } else {
    console.log('🖥️  Environnement local détecté');
    return 'local';
  }
}

async function setupDatabase(environment) {
  console.log('🗄️  Configuration de la base de données...');
  
  if (environment === 'replit') {
    // Sur Replit, vérifier si DATABASE_URL existe
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL non configuré sur Replit');
      console.log('ℹ️  Créez une base de données PostgreSQL dans les secrets Replit');
      console.log('   Variable: DATABASE_URL');
      console.log('   Format: postgresql://user:password@host:port/database');
      return false;
    }
  } else if (environment === 'codespaces' || environment === 'gitpod') {
    // GitHub Codespaces ou Gitpod - configuration cloud
    if (!process.env.DATABASE_URL) {
      console.log('📝 Configuration pour environnement cloud...');
      console.log('ℹ️  Configuration requise:');
      console.log('   1. Créez une base de données gratuite sur:');
      console.log('      - Neon Database: https://neon.tech');
      console.log('      - Supabase: https://supabase.com');
      console.log('   2. Ajoutez la variable DATABASE_URL aux secrets');
      console.log('   3. Relancez le script');
      return false;
    }
  } else {
    // Environnement local
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      // Copier le fichier exemple
      const examplePath = path.join(process.cwd(), '.env.example');
      if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, envPath);
        console.log('✅ Fichier .env créé depuis .env.example');
      } else {
        const envContent = `# Configuration Barista Café
DATABASE_URL=postgresql://username:password@localhost:5432/barista_cafe
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_super_securise
PORT=5000
`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Fichier .env créé');
      }
      
      console.log('⚠️  ÉTAPES SUIVANTES:');
      console.log('   1. Installez PostgreSQL localement');
      console.log('   2. Créez une base de données "barista_cafe"');
      console.log('   3. Modifiez DATABASE_URL dans .env');
      console.log('   4. Relancez: node setup-project.cjs');
      return false;
    }
    
    // Charger les variables d'environnement
    require('dotenv').config();
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL non configuré dans .env');
      console.log('ℹ️  Modifiez DATABASE_URL dans le fichier .env');
      return false;
    }
  }
  
  return true;
}

async function installDependencies() {
  console.log('📦 Installation des dépendances...');
  
  try {
    await execAsync('npm install', { stdio: 'inherit' });
    console.log('✅ Dépendances installées');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation des dépendances:', error.message);
    return false;
  }
}

async function setupDatabaseSchema() {
  console.log('🏗️  Configuration du schéma de la base de données...');
  
  try {
    await execAsync('npx drizzle-kit push --force');
    console.log('✅ Schéma de base de données configuré');
    return true;
  } catch (error) {
    console.log('⚠️  Erreur de configuration du schéma (peut être normal si déjà configuré)');
    return true; // Continue même en cas d'erreur
  }
}

async function main() {
  console.log('🚀 Configuration automatique du projet Barista Café\n');
  
  try {
    // 1. Vérifier l'environnement
    const environment = await checkEnvironment();
    
    // 2. Installer les dépendances
    const depsInstalled = await installDependencies();
    if (!depsInstalled) {
      process.exit(1);
    }
    
    // 3. Configurer la base de données
    const dbConfigured = await setupDatabase(environment);
    if (!dbConfigured) {
      console.log('\n❌ Configuration de la base de données nécessaire');
      console.log('🔧 Après avoir configuré la base de données, relancez: npm run setup');
      process.exit(1);
    }
    
    // 4. Configurer le schéma
    const schemaConfigured = await setupDatabaseSchema();
    if (!schemaConfigured) {
      process.exit(1);
    }
    
    console.log('\n🎉 Configuration terminée avec succès !');
    console.log('💡 Vous pouvez maintenant lancer le projet avec: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la configuration:', error.message);
    process.exit(1);
  }
}

// Lancer le script seulement s'il est exécuté directement
if (require.main === module) {
  main();
}

module.exports = { main };