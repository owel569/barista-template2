import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export class PostgresAutoManager {
  private static instance: PostgresAutoManager;
  private postgresProcess: any = null;
  private isRunning = false;
  private dataDir = '/tmp/postgres_data';
  private socketDir = '/tmp/postgres_run';
  private logFile = '/tmp/postgres.log';

  private constructor() {}

  public static getInstance(): PostgresAutoManager {
    if (!PostgresAutoManager.instance) {
      PostgresAutoManager.instance = new PostgresAutoManager();
    }
    return PostgresAutoManager.instance;
  }

  async ensurePostgresRunning(): Promise<string> {
    if (this.isRunning) {
      return this.getDatabaseUrl();
    }

    console.log('🔧 Configuration PostgreSQL automatique...');
    
    try {
      // Vérifier si PostgreSQL est déjà en cours d'exécution
      try {
        await execAsync('pg_isready -h localhost -p 5432');
        console.log('✅ PostgreSQL déjà en cours d\'exécution');
        this.isRunning = true;
        return this.getDatabaseUrl();
      } catch {
        // PostgreSQL n'est pas en cours d'exécution, on doit le démarrer
      }

      // Créer les répertoires nécessaires
      await this.createDirectories();

      // Initialiser la base de données si nécessaire
      await this.initializeDatabase();

      // Démarrer PostgreSQL
      await this.startPostgres();

      // Créer la base de données de l'application
      await this.createAppDatabase();

      console.log('✅ PostgreSQL configuré et démarré automatiquement');
      this.isRunning = true;
      return this.getDatabaseUrl();

    } catch (error) {
      console.error('❌ Erreur lors de la configuration PostgreSQL:', error);
      throw error;
    }
  }

  private async createDirectories(): Promise<void> {
    const dirs = [this.dataDir, this.socketDir, path.dirname(this.logFile)];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private async initializeDatabase(): Promise<void> {
    if (!fs.existsSync(path.join(this.dataDir, 'PG_VERSION'))) {
      console.log('🗄️  Initialisation de la base de données PostgreSQL...');
      await execAsync(`initdb -D ${this.dataDir} --auth-local=trust --auth-host=trust --username=postgres`);
    }
  }

  private async startPostgres(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🚀 Démarrage de PostgreSQL...');
      
      const postgresCmd = [
        'postgres',
        '-D', this.dataDir,
        '-k', this.socketDir,
        '-p', '5432',
        '-F', // Ne pas passer en arrière-plan
        '-c', 'log_statement=none', // Réduire les logs
        '-c', 'log_min_duration_statement=1000', // Logs seulement pour requêtes lentes
        '-c', 'shared_preload_libraries=', // Pas de libs partagées
        '-c', 'max_connections=20' // Limite les connexions
      ];

      this.postgresProcess = spawn(postgresCmd[0], postgresCmd.slice(1), {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // Rediriger les logs vers un fichier
      const logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
      this.postgresProcess.stdout.pipe(logStream);
      this.postgresProcess.stderr.pipe(logStream);

      // Attendre que PostgreSQL soit prêt
      let attempts = 0;
      const maxAttempts = 30;
      
      const checkReady = async () => {
        try {
          await execAsync('pg_isready -h localhost -p 5432');
          console.log('✅ PostgreSQL prêt');
          resolve(undefined);
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkReady, 1000);
          } else {
            reject(new Error('PostgreSQL n\'a pas démarré dans les temps'));
          }
        }
      };

      // Commencer à vérifier après 2 secondes
      setTimeout(checkReady, 2000);

      this.postgresProcess.on('error', (error: Error) => {
        console.error('❌ Erreur PostgreSQL:', error);
        reject(error);
      });
    });
  }

  private async createAppDatabase(): Promise<void> {
    try {
      console.log('📊 Création de la base de données barista_cafe...');
      await execAsync('createdb -h localhost -p 5432 -U postgres barista_cafe');
      console.log('✅ Base de données créée');
    } catch (error) {
      // La base de données existe peut-être déjà
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('ℹ️  Base de données barista_cafe existe déjà');
      } else {
        console.log('ℹ️  Base de données barista_cafe existe déjà ou erreur attendue');
      }
    }
  }

  private getDatabaseUrl(): string {
    return 'postgresql://postgres@localhost:5432/barista_cafe';
  }

  async stop(): Promise<void> {
    if (this.postgresProcess) {
      console.log('🛑 Arrêt de PostgreSQL...');
      this.postgresProcess.kill('SIGTERM');
      this.postgresProcess = null;
      this.isRunning = false;
    }
  }

  // Méthode pour nettoyer lors de l'arrêt de l'application
  setupCleanup(): void {
    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.stop();
      process.exit(0);
    });

    process.on('exit', async () => {
      if (this.postgresProcess) {
        this.postgresProcess.kill('SIGKILL');
      }
    });
  }
}

// Export de la fonction principale
export async function ensurePostgresRunning(): Promise<string> {
  const manager = PostgresAutoManager.getInstance();
  manager.setupCleanup();
  return await manager.ensurePostgresRunning();
}