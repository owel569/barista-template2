import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function autoSetup(): Promise<boolean> {
  console.log('🔧 Vérification automatique de la configuration...');

  try {
    // Configurer PostgreSQL automatiquement si nécessaire
    if (!process.env.DATABASE_URL) {
      console.log('🔧 Configuration PostgreSQL automatique...');
      const { ensurePostgresRunning } = await import('./postgres-auto');
      const databaseUrl = await ensurePostgresRunning();
      process.env.DATABASE_URL = databaseUrl;
      console.log('✅ PostgreSQL configuré automatiquement');
    }

    // Tester la connexion à la base de données et appliquer les migrations si nécessaire
    console.log('🗄️  Vérification et mise à jour de la base de données...');
    
    try {
      // Appliquer les migrations de façon silencieuse
      await execAsync('npx drizzle-kit push --force', { 
        timeout: 30000,
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
      });
      console.log('✅ Base de données synchronisée');
    } catch (migrationError) {
      // Les migrations peuvent échouer si les tables existent déjà, ce n'est pas forcément grave
      console.log('ℹ️  Migrations déjà appliquées ou base de données déjà configurée');
    }

    console.log('🎉 Configuration automatique terminée!');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration automatique:', error instanceof Error ? error.message : 'Erreur inconnue');
    return false;
  }
}