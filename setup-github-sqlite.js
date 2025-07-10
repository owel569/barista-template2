#!/usr/bin/env node

/**
 * Script de configuration SQLite pour GitHub Codespaces
 * Solution sans sudo pour les environnements où PostgreSQL n'est pas disponible
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class GitHubSQLiteSetup {
  constructor() {
    this.envFile = '.env';
    this.log('🚀 Configuration SQLite pour GitHub Codespaces', 'info');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  async execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async detectEnvironment() {
    const isCodespaces = process.env.CODESPACES === 'true';
    const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
    const isReplit = process.env.REPLIT_CLUSTER !== undefined;
    
    this.log(`Environment: ${isCodespaces ? 'GitHub Codespaces' : isGitHubActions ? 'GitHub Actions' : isReplit ? 'Replit' : 'Unknown'}`, 'info');
    return { isCodespaces, isGitHubActions, isReplit };
  }

  async setupSQLite() {
    this.log('📦 Installation de SQLite...', 'info');
    
    try {
      await this.execAsync('npm install sqlite3 better-sqlite3 --save');
      this.log('✅ SQLite installé avec succès', 'success');
    } catch (error) {
      this.log('❌ Erreur installation SQLite: ' + error.message, 'error');
      throw error;
    }
  }

  createEnvFile() {
    this.log('⚙️  Création du fichier .env...', 'info');
    
    const envContent = `# Configuration pour GitHub Codespaces avec SQLite
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}
NODE_ENV=development
PORT=5000
VITE_API_URL=http://localhost:5000

# Configuration SQLite
DB_TYPE=sqlite
DB_PATH=./database.sqlite
`;

    fs.writeFileSync(this.envFile, envContent);
    this.log('✅ Fichier .env créé', 'success');
  }

  createSQLiteConfig() {
    this.log('📝 Configuration SQLite pour Drizzle...', 'info');
    
    const drizzleConfig = `import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'sqlite:./database.sqlite',
  },
} satisfies Config;
`;

    fs.writeFileSync('drizzle.config.sqlite.ts', drizzleConfig);
    this.log('✅ Configuration SQLite créée', 'success');
  }

  createStartupScript() {
    this.log('🚀 Création du script de démarrage...', 'info');
    
    const startScript = `#!/bin/bash

echo "🚀 Démarrage Barista Café avec SQLite"

# Vérifier si SQLite est installé
if ! npm list sqlite3 > /dev/null 2>&1; then
    echo "📦 Installation de SQLite..."
    npm install sqlite3 better-sqlite3 --save
fi

# Créer la base de données SQLite si elle n'existe pas
if [ ! -f "./database.sqlite" ]; then
    echo "🗄️  Création de la base de données SQLite..."
    touch ./database.sqlite
fi

# Appliquer les migrations
echo "📋 Application des migrations..."
npx drizzle-kit push:sqlite --config=drizzle.config.sqlite.ts

# Démarrer le serveur
echo "🌟 Démarrage du serveur..."
npm run dev
`;

    fs.writeFileSync('start-github-sqlite.sh', startScript);
    
    try {
      fs.chmodSync('start-github-sqlite.sh', '755');
    } catch (error) {
      this.log('⚠️  Impossible de rendre le script exécutable', 'warning');
    }
    
    this.log('✅ Script de démarrage créé', 'success');
  }

  updatePackageJson() {
    this.log('📦 Mise à jour package.json...', 'info');
    
    try {
      const packagePath = 'package.json';
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Ajouter script pour SQLite
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['dev:sqlite'] = 'bash start-github-sqlite.sh';
      packageJson.scripts['setup:github'] = 'node setup-github-sqlite.js';
      
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      this.log('✅ package.json mis à jour', 'success');
    } catch (error) {
      this.log('⚠️  Erreur mise à jour package.json: ' + error.message, 'warning');
    }
  }

  createDocumentation() {
    this.log('📚 Création de la documentation...', 'info');
    
    const documentation = `# Configuration SQLite pour GitHub Codespaces

## Installation rapide

\`\`\`bash
# Installation et configuration automatique
npm install && node setup-github-sqlite.js

# Démarrage avec SQLite
npm run dev:sqlite
\`\`\`

## Commandes disponibles

\`\`\`bash
# Configuration initiale
npm run setup:github

# Démarrage normal
npm run dev

# Démarrage avec SQLite
npm run dev:sqlite
\`\`\`

## Variables d'environnement

Le fichier \`.env\` est créé automatiquement avec :
- \`DATABASE_URL=sqlite:./database.sqlite\`
- \`JWT_SECRET=[généré automatiquement]\`
- \`NODE_ENV=development\`

## Tests de fonctionnement

\`\`\`bash
# Tester l'authentification
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}'

# Vérifier les employés
curl -H "Authorization: Bearer YOUR_TOKEN" \\
  http://localhost:5000/api/admin/employees
\`\`\`

## Avantages SQLite

- ✅ Pas besoin de sudo
- ✅ Installation instantanée
- ✅ Base de données locale fichier
- ✅ Compatible avec toutes les fonctionnalités
- ✅ Parfait pour développement et tests
`;

    fs.writeFileSync('GITHUB_SQLITE_SETUP.md', documentation);
    this.log('✅ Documentation créée', 'success');
  }

  async run() {
    try {
      this.log('🎯 Démarrage de la configuration SQLite...', 'info');
      
      const env = await this.detectEnvironment();
      
      await this.setupSQLite();
      this.createEnvFile();
      this.createSQLiteConfig();
      this.createStartupScript();
      this.updatePackageJson();
      this.createDocumentation();
      
      this.log('🎉 Configuration SQLite terminée avec succès!', 'success');
      this.log('', 'info');
      this.log('📋 Prochaines étapes:', 'info');
      this.log('1. npm run dev:sqlite', 'info');
      this.log('2. Ouvrir http://localhost:5000', 'info');
      this.log('3. Se connecter avec admin/admin123', 'info');
      this.log('', 'info');
      
    } catch (error) {
      this.log('❌ Erreur configuration: ' + error.message, 'error');
      process.exit(1);
    }
  }
}

// Démarrage si exécuté directement
if (require.main === module) {
  const setup = new GitHubSQLiteSetup();
  setup.run();
}

module.exports = GitHubSQLiteSetup;