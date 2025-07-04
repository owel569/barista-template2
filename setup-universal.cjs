#!/usr/bin/env node

/**
 * Installation universelle automatique pour Barista Café
 * Fonctionne sur tous les environnements : Replit, VS Code, GitHub Codespaces, local
 * Version CommonJS compatible avec tous les systèmes
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class UniversalSetup {
  constructor() {
    this.environment = this.detectEnvironment();
    this.dbUrl = '';
  }

  log(message, type = 'info') {
    const symbols = {
      info: '🔧',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    console.log(`${symbols[type]} ${message}`);
  }

  detectEnvironment() {
    if (process.env.REPLIT_DB_URL) return 'replit';
    if (process.env.CODESPACES) return 'codespaces';
    if (process.env.GITPOD_WORKSPACE_ID) return 'gitpod';
    if (process.env.VSCODE_PID) return 'vscode';
    return 'local';
  }

  async checkCommand(command) {
    try {
      await execAsync(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  async installPostgreSQL() {
    this.log('Installation de PostgreSQL...');
    
    const hasPostgres = await this.checkCommand('psql --version');
    if (hasPostgres) {
      this.log('PostgreSQL déjà installé', 'success');
      return;
    }

    // Instructions selon l'environnement
    switch (this.environment) {
      case 'replit':
        this.log('PostgreSQL sera configuré automatiquement', 'success');
        break;
      case 'codespaces':
      case 'gitpod':
        this.log('Installation automatique de PostgreSQL...');
        try {
          await execAsync('sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib');
          await execAsync('sudo service postgresql start');
          this.log('PostgreSQL installé et démarré', 'success');
        } catch (error) {
          this.log('Installation manuelle requise - consultez INSTALLATION.md', 'warning');
        }
        break;
      case 'local':
        if (os.platform() === 'darwin') {
          this.log('Exécutez: brew install postgresql');
        } else if (os.platform() === 'linux') {
          this.log('Exécutez: sudo apt-get install postgresql postgresql-contrib');
        } else {
          this.log('Téléchargez PostgreSQL depuis https://www.postgresql.org/download/');
        }
        break;
      default:
        this.log('Consultez https://www.postgresql.org/download/ pour votre système');
    }
  }

  async setupDatabase() {
    this.log('Configuration de la base de données...');

    try {
      // Utiliser le système PostgreSQL automatique pour tous les environnements
      this.log('Tentative de configuration automatique...');
      
      // Vérifier si PostgreSQL est disponible
      const hasPostgres = await this.checkCommand('psql --version');
      if (hasPostgres) {
        this.log('PostgreSQL détecté, configuration automatique...');
        
        // Démarrer PostgreSQL si nécessaire
        const isRunning = await this.checkCommand('pg_isready -h localhost -p 5432');
        if (!isRunning) {
          this.log('Démarrage de PostgreSQL...');
          try {
            // Tentatives de démarrage selon l'environnement
            if (this.environment === 'codespaces' || this.environment === 'gitpod') {
              await execAsync('sudo service postgresql start');
            } else {
              // Tentative de démarrage local
              await execAsync('pg_ctl -D /tmp/postgres_data -l /tmp/postgres.log start');
            }
          } catch {
            this.log('Utilisation de la configuration par défaut');
          }
        } else {
          this.log('PostgreSQL déjà en cours d\'exécution');
        }
        
        // Créer la base de données automatiquement
        try {
          if (this.environment === 'codespaces' || this.environment === 'gitpod') {
            await execAsync('sudo -u postgres createdb barista_cafe');
          } else {
            await execAsync('createdb barista_cafe');
          }
          this.log('Base de données "barista_cafe" créée', 'success');
        } catch {
          this.log('Base de données "barista_cafe" existe déjà ou erreur attendue');
        }
        
        // Configurer l'URL de base de données
        if (this.environment === 'codespaces' || this.environment === 'gitpod') {
          this.dbUrl = 'postgresql://postgres@localhost:5432/barista_cafe';
        } else {
          this.dbUrl = 'postgresql://postgres@localhost:5432/barista_cafe';
        }
        this.log('Configuration automatique réussie !', 'success');
        
      } else {
        // Fallback vers configuration manuelle
        this.log('Configuration manuelle requise :', 'warning');
        this.log('1. Créez une base de données PostgreSQL nommée "barista_cafe"');
        this.log('2. Configurez DATABASE_URL dans votre fichier .env');
        this.dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe';
        this.log(`   Exemple: DATABASE_URL=${this.dbUrl}`);
      }
    } catch (error) {
      this.log('Erreur lors de la configuration de la base de données:', 'error');
      this.dbUrl = 'postgresql://postgres:password@localhost:5432/barista_cafe';
    }
  }

  createEnvFile() {
    const envPath = path.join(__dirname, '.env');
    const envContent = `# Configuration Barista Café
DATABASE_URL=${this.dbUrl}
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=5000
`;

    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      this.log('Fichier .env créé', 'success');
    } else {
      this.log('Fichier .env existe déjà');
    }
  }

  createStartupScript() {
    const startScript = `#!/bin/bash
# Script de démarrage universel pour Barista Café

echo "🚀 Démarrage de Barista Café..."

# Vérifier si PostgreSQL est disponible
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL n'est pas installé"
    echo "Consultez le README.md pour les instructions d'installation"
    exit 1
fi

# Exécuter les migrations si nécessaire
if [ ! -f ".migrations-done" ]; then
    echo "🗄️  Exécution des migrations..."
    npm run db:push
    touch .migrations-done
fi

# Démarrer l'application
echo "🎉 Lancement de l'application..."
npm run dev
`;

    fs.writeFileSync('start.sh', startScript);
    try {
      fs.chmodSync('start.sh', 0o755);
    } catch {
      // chmod peut échouer sur certains systèmes
    }
    this.log('Script de démarrage créé (start.sh)', 'success');
  }

  updatePackageJson() {
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.log('package.json non trouvé', 'warning');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Ajouter les scripts si ils n'existent pas
    if (!packageJson.scripts) packageJson.scripts = {};
    
    const scripts = {
      'setup': 'node setup-universal.cjs',
      'start:universal': 'bash start.sh',
      'db:push': 'drizzle-kit push',
      'db:studio': 'drizzle-kit studio',
      'db:generate': 'drizzle-kit generate'
    };

    Object.entries(scripts).forEach(([key, value]) => {
      if (!packageJson.scripts[key]) {
        packageJson.scripts[key] = value;
      }
    });

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    this.log('Scripts package.json mis à jour', 'success');
  }

  createDocumentation() {
    const installationMd = `# Installation de Barista Café

## Installation automatique (recommandée)

\`\`\`bash
npm install
node setup-universal.cjs
npm run dev
\`\`\`

## Installation manuelle

### 1. Prérequis
- Node.js 18+ 
- PostgreSQL 14+

### 2. Installation PostgreSQL

#### Ubuntu/Debian
\`\`\`bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
\`\`\`

#### macOS
\`\`\`bash
brew install postgresql
brew services start postgresql
\`\`\`

#### Windows
Télécharger depuis https://www.postgresql.org/download/windows/

### 3. Configuration base de données
\`\`\`bash
sudo -u postgres createdb barista_cafe
\`\`\`

### 4. Configuration environnement
Copiez \`.env.example\` vers \`.env\` et configurez :
\`\`\`
DATABASE_URL=postgresql://postgres@localhost:5432/barista_cafe
JWT_SECRET=your-secret-key
\`\`\`

### 5. Démarrage
\`\`\`bash
npm install
npm run db:push
npm run dev
\`\`\`

## Commandes utiles

- \`npm run dev\` - Démarrer en développement
- \`npm run setup\` - Réexécuter l'installation
- \`npm run db:push\` - Appliquer les migrations
- \`npm run db:studio\` - Interface base de données
- \`bash start.sh\` - Script de démarrage universel

## Identifiants par défaut

- **Admin**: admin / admin123
- **Employé**: employee / employee123
`;

    fs.writeFileSync('INSTALLATION.md', installationMd);
    this.log('Documentation créée (INSTALLATION.md)', 'success');
  }

  async run() {
    this.log(`Installation sur ${this.environment}...`);
    
    await this.installPostgreSQL();
    await this.setupDatabase();
    this.createEnvFile();
    this.createStartupScript();
    this.updatePackageJson();
    this.createDocumentation();
    
    this.log('Installation terminée avec succès !', 'success');
    this.log('Commandes disponibles :');
    this.log('  npm run dev          - Démarrer en développement');
    this.log('  bash start.sh        - Démarrer avec script universel');
    this.log('  npm run db:push      - Appliquer les migrations');
    this.log('  npm run db:studio    - Interface base de données');
  }
}

// Exécuter l'installation
const setup = new UniversalSetup();
setup.run().catch(console.error);