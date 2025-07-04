#!/usr/bin/env node

/**
 * Installation universelle automatique pour Barista Café (CommonJS)
 * Fonctionne sur tous les environnements : Replit, VS Code, GitHub Codespaces, local
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class UniversalSetup {
  constructor() {
    this.isReplit = !!process.env.REPLIT_DB_URL;
    this.postgresDir = path.join(os.tmpdir(), 'postgres_data');
    this.postgresSocket = path.join(os.tmpdir(), 'postgres_run');
    this.databaseUrl = `postgresql://postgres@/barista_cafe?host=${this.postgresSocket}`;
  }

  log(message, type = 'info') {
    const prefix = {
      info: '🔧',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${prefix[type]} ${message}`);
  }

  async checkCommand(command) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async setupDatabase() {
    this.log('Configuration de la base de données...');

    try {
      // Arrêt des processus existants
      try {
        execSync('pkill -f postgres', { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        // Ignore si aucun processus
      }

      // Nettoyage
      if (fs.existsSync(this.postgresDir)) {
        fs.rmSync(this.postgresDir, { recursive: true, force: true });
      }
      if (fs.existsSync(this.postgresSocket)) {
        fs.rmSync(this.postgresSocket, { recursive: true, force: true });
      }

      // Création des répertoires
      fs.mkdirSync(this.postgresDir, { recursive: true });
      fs.mkdirSync(this.postgresSocket, { recursive: true });

      // Initialisation
      this.log('Initialisation de PostgreSQL...');
      execSync(`initdb -D "${this.postgresDir}" --auth-local=trust --auth-host=trust -U postgres -A trust`, { 
        stdio: 'inherit' 
      });

      // Démarrage
      this.log('Démarrage de PostgreSQL...');
      execSync(`pg_ctl -D "${this.postgresDir}" -l "${this.postgresDir}/postgres.log" -o "-k ${this.postgresSocket}" start -w`, {
        stdio: 'inherit'
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Création DB
      this.log('Création de la base de données...');
      try {
        execSync(`createdb -h "${this.postgresSocket}" -U postgres barista_cafe`, { stdio: 'inherit' });
        this.log('Base de données créée', 'success');
      } catch (e) {
        this.log('Base de données existante', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Erreur: ${error.message}`, 'error');
      return false;
    }
  }

  createEnvFile() {
    this.log('Création du fichier .env...');
    
    const envContent = `# Configuration automatique PostgreSQL
DATABASE_URL=${this.databaseUrl}
NODE_ENV=development
JWT_SECRET=barista-cafe-secret-${Date.now()}
`;

    fs.writeFileSync('.env', envContent);
    this.log('Fichier .env créé', 'success');
  }

  createDocumentation() {
    this.log('Mise à jour de la documentation...');
    
    const readmeContent = `# Barista Café - Configuration Automatique

## Installation Rapide

\`\`\`bash
# Cloner le projet
git clone [votre-repo]
cd barista-cafe

# Installation automatique
npm install
node setup-universal.cjs

# Démarrage
npm run dev
\`\`\`

## Identifiants

- **Admin**: admin / admin123
- **Employé**: employe / employe123

## Accès

- Site: http://localhost:5000
- Admin: http://localhost:5000/admin

## Résolution de Problèmes

\`\`\`bash
node setup-universal.cjs
\`\`\`
`;

    fs.writeFileSync('README-SETUP.md', readmeContent);
    this.log('Documentation créée', 'success');
  }

  async run() {
    this.log('Installation universelle de Barista Café');
    this.log(`Environnement: ${this.isReplit ? 'Replit' : 'Local'}`);

    await this.setupDatabase();
    this.createEnvFile();
    this.createDocumentation();

    this.log('Installation terminée avec succès!', 'success');
    this.log('Démarrage: npm run dev', 'info');
    this.log('Admin: http://localhost:5000/admin', 'info');

    return true;
  }
}

// Exécution directe
if (require.main === module) {
  const setup = new UniversalSetup();
  setup.run().catch(console.error);
}

module.exports = UniversalSetup;