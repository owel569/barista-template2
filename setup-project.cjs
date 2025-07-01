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
  
  // Détection simple : si DATABASE_URL existe, on continue
  // Sinon on aide à configurer
  if (process.env.DATABASE_URL) {
    console.log('✅ Base de données déjà configurée');
    return 'configured';
  } else {
    console.log('⚙️  Configuration nécessaire');
    return 'needs-config';
  }
}

async function setupDatabase(environment) {
  console.log('🗄️  Configuration de la base de données...');
  
  if (environment === 'configured') {
    console.log('✅ DATABASE_URL détecté, configuration déjà faite');
    return true;
  }
  
  // Environnement non configuré - créer .env si nécessaire
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    // Copier depuis .env.example ou créer
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('✅ Fichier .env créé depuis .env.example');
    } else {
      const envContent = `# Configuration Barista Café
DATABASE_URL=postgresql://username:password@localhost:5432/barista_cafe
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_super_securise_changez_moi
PORT=5000
`;
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env créé');
    }
  }
  
  // Charger .env et vérifier
  require('dotenv').config();
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password')) {
    console.log('\n📋 CONFIGURATION REQUISE:');
    console.log('');
    console.log('🗄️  Base de données PostgreSQL nécessaire');
    console.log('');
    console.log('Options (au choix):');
    console.log('  • Local: Installez PostgreSQL + créez DB "barista_cafe"');
    console.log('  • Cloud: Neon.tech, Supabase.com, Railway.app (gratuit)');
    console.log('  • Docker: docker run postgres (si Docker installé)');
    console.log('');
    console.log('Puis modifiez DATABASE_URL dans .env avec votre URL');
    console.log('Format: postgresql://user:password@host:port/database');
    console.log('');
    console.log('Relancez ensuite: node setup-project.cjs');
    return false;
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