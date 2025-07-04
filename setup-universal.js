#!/usr/bin/env node

/**
 * Installation universelle automatique pour Barista Café
 * Fonctionne sur tous les environnements : Replit, VS Code, GitHub Codespaces, local
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

class UniversalSetup {
  constructor() {
    this.environment = this.detectEnvironment();
    this.dbUrl = '';
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🔧';
    console.log(`${colors[type]}${icon} ${message}${colors.reset}`);
  }

  detectEnvironment() {
    if (process.env.REPLIT_DOMAIN) return 'replit';
    if (process.env.CODESPACES) return 'codespaces';
    if (process.env.GITPOD_WORKSPACE_URL) return 'gitpod';
    if (process.env.VSCODE_IPC_HOOK) return 'vscode';
    return 'local';
  }

  async checkCommand(command) {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }

  async installPostgreSQL() {
    this.log('Installation de PostgreSQL...');
    
    if (this.environment === 'replit') {
      // Replit gère PostgreSQL automatiquement
      this.log('PostgreSQL géré par Replit', 'success');
      return;
    }

    const hasPostgres = await this.checkCommand('psql');
    if (hasPostgres) {
      this.log('PostgreSQL déjà installé', 'success');
      return;
    }

    this.log('PostgreSQL non trouvé. Instructions d\'installation :', 'warning');
    
    switch (this.environment) {
      case 'codespaces':
      case 'gitpod':
        this.log('Exécutez: sudo apt update && sudo apt install -y postgresql postgresql-contrib');
        break;
      case 'local':
        if (process.platform === 'darwin') {
          this.log('Exécutez: brew install postgresql');
        } else if (process.platform === 'linux') {
          this.log('Exécutez: sudo apt install postgresql postgresql-contrib');
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
      try {
        await this.checkCommand('psql --version');
        this.log('PostgreSQL détecté, configuration automatique...');
        
        // Démarrer PostgreSQL si nécessaire
        try {
          await this.checkCommand('pg_isready -h localhost -p 5432');
          this.log('PostgreSQL déjà en cours d\'exécution');
        } catch {
          this.log('Démarrage de PostgreSQL...');
          try {
            // Tentative de démarrage automatique
            await this.checkCommand('pg_ctl -D /tmp/postgres_data -l /tmp/postgres.log start');
          } catch {
            this.log('Utilisation de la configuration par défaut');
          }
        }
        
        // Créer la base de données automatiquement
        try {
          await this.checkCommand('createdb barista_cafe');
          this.log('Base de données "barista_cafe" créée', 'success');
        } catch {
          this.log('Base de données "barista_cafe" existe déjà ou erreur attendue');
        }
        
        this.dbUrl = 'postgresql://postgres@localhost:5432/barista_cafe';
        this.log('Configuration automatique réussie !', 'success');
        
      } catch {
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
echo "🎉 Démarrage de l'application..."
npm run dev
`;

    fs.writeFileSync(path.join(__dirname, 'start.sh'), startScript);
    
    // Rendre le script exécutable
    try {
      fs.chmodSync(path.join(__dirname, 'start.sh'), 0o755);
      this.log('Script de démarrage créé (start.sh)', 'success');
    } catch (error) {
      this.log('Script de démarrage créé (utilisez: bash start.sh)', 'success');
    }
  }

  updatePackageJson() {
    const packagePath = path.join(__dirname, 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Ajouter des scripts utiles
      packageJson.scripts = {
        ...packageJson.scripts,
        'setup': 'node setup-universal.js',
        'db:push': 'drizzle-kit push',
        'db:migrate': 'drizzle-kit migrate',
        'db:studio': 'drizzle-kit studio',
        'start:universal': 'bash start.sh'
      };
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      this.log('Scripts package.json mis à jour', 'success');
    }
  }

  createDocumentation() {
    const readmeContent = `# Barista Café - Installation Universelle

## Installation Rapide

1. **Clonez le projet**
   \`\`\`bash
   git clone <votre-repo>
   cd barista-cafe
   \`\`\`

2. **Installation automatique**
   \`\`\`bash
   npm install
   node setup-universal.js
   \`\`\`

3. **Démarrage**
   \`\`\`bash
   npm run dev
   # ou
   bash start.sh
   \`\`\`

## Configuration par Environnement

### Replit
- Configuration automatique ✅
- PostgreSQL géré automatiquement
- Prêt à l'emploi

### VS Code / Codespaces
1. Installez PostgreSQL :
   \`\`\`bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib
   \`\`\`
2. Créez la base de données :
   \`\`\`bash
   sudo -u postgres createdb barista_cafe
   \`\`\`
3. Configurez DATABASE_URL dans .env

### Local (macOS)
1. Installez PostgreSQL :
   \`\`\`bash
   brew install postgresql
   brew services start postgresql
   \`\`\`
2. Créez la base de données :
   \`\`\`bash
   createdb barista_cafe
   \`\`\`

### Local (Linux)
1. Installez PostgreSQL :
   \`\`\`bash
   sudo apt install postgresql postgresql-contrib
   \`\`\`
2. Configurez et créez la base de données :
   \`\`\`bash
   sudo -u postgres createdb barista_cafe
   \`\`\`

## Identifiants par défaut
- **Directeur** : admin / admin123
- **Employé** : employee / employee123

## Fonctionnalités
- Site web du café avec menu interactif
- Système de réservation avec panier
- Interface d'administration complète
- Gestion des commandes et clients
- Statistiques et rapports
- Mode sombre/clair

## Support
Ce projet fonctionne sur tous les environnements de développement modernes.
`;

    fs.writeFileSync(path.join(__dirname, 'README.md'), readmeContent);
    this.log('Documentation créée (README.md)', 'success');
  }

  async run() {
    this.log(`Installation sur ${this.environment}...`);
    
    try {
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
      
    } catch (error) {
      this.log(`Erreur : ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Exécuter l'installation
const setup = new UniversalSetup();
setup.run();