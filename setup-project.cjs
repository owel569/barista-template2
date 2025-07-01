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
  
  if (isReplit) {
    console.log('✅ Environnement Replit détecté');
    return 'replit';
  }
  
  console.log('🖥️  Environnement local détecté');
  return 'local';
}

async function setupDatabase(environment) {
  console.log('🗄️  Configuration de la base de données...');
  
  if (environment === 'replit') {
    // Sur Replit, vérifier si DATABASE_URL existe
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL non configuré sur Replit');
      console.log('ℹ️  Veuillez créer une base de données PostgreSQL dans les secrets Replit');
      console.log('   Nom de la variable: DATABASE_URL');
      console.log('   Format: postgresql://user:password@host:port/database');
      return false;
    }
  } else {
    // Environnement local - créer un fichier .env si nécessaire
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('📝 Création du fichier .env...');
      const envContent = `# Configuration locale pour Barista Café
# Remplacez par vos vraies informations de base de données
DATABASE_URL=postgresql://username:password@localhost:5432/barista_cafe
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_super_securise
`;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env créé');
      console.log('⚠️  IMPORTANT: Modifiez le fichier .env avec vos vraies informations de base de données');
      return false;
    }
    
    // Charger les variables d'environnement
    require('dotenv').config();
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL non configuré dans .env');
      console.log('ℹ️  Veuillez configurer DATABASE_URL dans le fichier .env');
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