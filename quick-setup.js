#!/usr/bin/env node

// Configuration SQLite simple pour Barista Café
import { writeFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupSQLite() {
  console.log('🚀 Configuration rapide SQLite pour Barista Café');
  
  // Créer le fichier .env optimisé
  const envConfig = `# Configuration SQLite Production - Barista Café
DATABASE_URL=file:./barista_cafe.db
DB_TYPE=sqlite

# Configuration Application
NODE_ENV=production
JWT_SECRET=barista_cafe_production_jwt_secret_2025_ultra_secure
PORT=5000

# Configuration Performance
CACHE_TTL_MENU=600
CACHE_TTL_CATEGORIES=1800
CACHE_TTL_TABLES=300
`;

  writeFileSync('.env', envConfig);
  console.log('✅ Configuration .env créée');
  
  // Appliquer les migrations
  try {
    console.log('🔄 Application des migrations...');
    await execAsync('npx drizzle-kit push');
    console.log('✅ Migrations appliquées');
  } catch (error) {
    console.log('⚠️ Migrations échouées, continuons...');
  }
  
  // Initialiser les données
  try {
    console.log('📊 Initialisation des données...');
    await execAsync('npx tsx scripts/init-database.ts');
    console.log('✅ Données initialisées');
  } catch (error) {
    console.log('⚠️ Initialisation données échouée, continuons...');
  }
  
  console.log('🎉 Configuration terminée!');
  console.log('');
  console.log('🔐 Compte admin: admin / admin123');
  console.log('🌐 URL: http://localhost:5000');
  console.log('');
  console.log('▶️ Démarrer avec: npm run dev');
}

setupSQLite().catch(console.error);