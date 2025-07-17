import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

async function initializeDatabase() {
  try {
    console.log('🗄️ Initialisation SQLite optimisée...');
    
    // Configuration SQLite pour performance maximale
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './barista_cafe.db';
    
    // Créer le répertoire si nécessaire
    const path = require('path');
    const fs = require('fs');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir) && dbDir !== '.') {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    sqlite = new Database(dbPath);
    
    // Optimisations SQLite pour restaurant
    sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging
    sqlite.pragma('synchronous = NORMAL'); // Performance/sécurité équilibrée
    sqlite.pragma('cache_size = 20000'); // Cache 20MB
    sqlite.pragma('foreign_keys = ON'); // Intégrité référentielle
    sqlite.pragma('temp_store = MEMORY'); // Stockage temporaire en mémoire
    sqlite.pragma('mmap_size = 268435456'); // Memory mapping 256MB
    
    // Initialiser Drizzle
    db = drizzle(sqlite, { schema });
    
    // Test de connexion
    await db.execute(sql`SELECT 1`);
    console.log('✅ SQLite connecté et optimisé');
    
    // Configuration backup automatique
    if (process.env.BACKUP_ENABLED === 'true') {
      setupAutomaticBackup();
    }
    
    return db;
  } catch (error) {
    console.error('❌ Erreur SQLite:', error);
    throw error;
  }
}

// Backup automatique pour éviter la perte de données
function setupAutomaticBackup() {
  const backupInterval = parseInt(process.env.BACKUP_INTERVAL || '3600') * 1000;
  
  setInterval(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `./backups/barista_cafe_${timestamp}.db`;
      
      // Créer le répertoire de backup
      await execAsync('mkdir -p ./backups');
      
      // Copier la base de données
      await execAsync(`cp ./barista_cafe.db "${backupPath}"`);
      
      // Nettoyer les anciens backups
      const retention = parseInt(process.env.BACKUP_RETENTION || '7');
      await execAsync(`find ./backups -name "*.db" -type f -mtime +${retention} -delete`);
      
      console.log(`✅ Backup automatique: ${backupPath}`);
    } catch (error) {
      console.error('❌ Erreur backup:', error);
    }
  }, backupInterval);
}

const dbPromise = initializeDatabase();

export const getDb = async () => {
  await dbPromise;
  return db;
};

export { db };

export async function setupDatabase() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('✅ Base de données SQLite configurée');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration SQLite:', error);
    return false;
  }
}

// Fonction de vérification de santé
export async function checkDatabaseHealth() {
  try {
    const result = await db.execute(sql`SELECT datetime('now') as timestamp`);
    return {
      healthy: true,
      timestamp: result[0]?.timestamp,
      type: 'sqlite',
      size: await getDatabaseSize()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      type: 'sqlite'
    };
  }
}

async function getDatabaseSize() {
  try {
    const { size } = await execAsync('du -h ./barista_cafe.db');
    return size.split('	')[0];
  } catch {
    return 'unknown';
  }
}

// Nettoyage gracieux
process.on('SIGINT', () => {
  if (sqlite) {
    sqlite.close();
    console.log('✅ SQLite fermé proprement');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (sqlite) {
    sqlite.close();
    console.log('✅ SQLite fermé proprement');
  }
  process.exit(0);
});