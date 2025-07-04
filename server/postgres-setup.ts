import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const POSTGRES_DIR = '/tmp/postgres_data';
const POSTGRES_SOCK = '/tmp/postgres_run';
const POSTGRES_USER = 'postgres';
const POSTGRES_DB = 'barista_cafe';

let postgresProcess: any = null;

export async function setupPostgres(): Promise<string> {
  try {
    console.log('🔧 Configuration PostgreSQL pour Replit...');
    
    // Arrêt des processus existants
    try {
      execSync('pkill -f postgres', { stdio: 'ignore' });
    } catch (e) {
      // Ignore si aucun processus à arrêter
    }
    
    // Nettoyage des anciens fichiers
    execSync(`rm -rf ${POSTGRES_DIR} ${POSTGRES_SOCK}`, { stdio: 'ignore' });
    
    // Création des répertoires
    mkdirSync(POSTGRES_DIR, { recursive: true });
    mkdirSync(POSTGRES_SOCK, { recursive: true });
    
    // Initialisation de PostgreSQL
    console.log('🗄️  Initialisation de PostgreSQL...');
    execSync(`initdb -D ${POSTGRES_DIR} --auth-local=trust --auth-host=trust -U ${POSTGRES_USER} -A trust`, { stdio: 'ignore' });
    
    // Démarrage de PostgreSQL
    console.log('🚀 Démarrage de PostgreSQL...');
    const postgresCmd = `pg_ctl -D ${POSTGRES_DIR} -l ${POSTGRES_DIR}/postgres.log -o "-k ${POSTGRES_SOCK}" start -w`;
    execSync(postgresCmd, { stdio: 'ignore' });
    
    // Attente du démarrage
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Création de la base de données
    console.log('📊 Création de la base de données...');
    try {
      execSync(`createdb -h ${POSTGRES_SOCK} -U ${POSTGRES_USER} ${POSTGRES_DB}`, { stdio: 'ignore' });
      console.log('✅ Base de données créée avec succès!');
    } catch (e) {
      console.log('ℹ️  Base de données déjà existante');
    }
    
    const databaseUrl = `postgresql://${POSTGRES_USER}@/${POSTGRES_DB}?host=${POSTGRES_SOCK}`;
    console.log(`✅ PostgreSQL configuré avec succès!`);
    console.log(`   Base de données : ${POSTGRES_DB}`);
    console.log(`   Socket : ${POSTGRES_SOCK}`);
    
    return databaseUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration PostgreSQL:', error);
    throw error;
  }
}

export async function ensurePostgresRunning(): Promise<boolean> {
  try {
    // Vérifier si PostgreSQL est en cours d'exécution
    const result = execSync('ps aux | grep postgres | grep -v grep', { encoding: 'utf8' });
    return result.trim().length > 0;
  } catch (e) {
    return false;
  }
}

// Fonction pour nettoyer à la fermeture
export function cleanupPostgres() {
  if (postgresProcess) {
    postgresProcess.kill();
  }
  try {
    execSync('pkill -f postgres', { stdio: 'ignore' });
  } catch (e) {
    // Ignore
  }
}

// Gérer la fermeture propre
process.on('exit', cleanupPostgres);
process.on('SIGINT', cleanupPostgres);
process.on('SIGTERM', cleanupPostgres);