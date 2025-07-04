#!/usr/bin/env node

/**
 * Installation universelle automatique pour Barista Café (CommonJS)
 * Fonctionne sur tous les environnements : Replit, VS Code, GitHub Codespaces, local
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

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

    if (this.environment === 'replit') {
      // Utiliser les variables d'environnement Replit
      this.dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe';
    } else {
      // Configuration pour autres environnements
      this.dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/barista_cafe';
      
      this.log('Configuration manuelle requise :', 'warning');
      this.log('1. Créez une base de données PostgreSQL nommée "barista_cafe"');
      this.log('2. Configurez DATABASE_URL dans votre fichier .env');
      this.log(`   Exemple: DATABASE_URL=${this.dbUrl}`);
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
        'setup': 'node setup-universal.cjs',
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
    const installationContent = `# Installation Barista Café

## Installation Automatique (Recommandée)

### Étape 1 : Cloner le projet
\`\`\`bash
git clone <votre-repo>
cd barista-cafe
\`\`\`

### Étape 2 : Installation universelle
\`\`\`bash
npm install
node setup-universal.cjs
\`\`\`

### Étape 3 : Démarrage
\`\`\`bash
npm run dev
\`\`\`

## Installation par Environnement

### 🟢 Replit
- **Configuration automatique** ✅
- **PostgreSQL géré automatiquement** ✅
- **Prêt à l'emploi** ✅

### 🔵 VS Code / GitHub Codespaces
1. **Installation PostgreSQL :**
   \`\`\`bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   sudo service postgresql start
   \`\`\`

2. **Création de la base de données :**
   \`\`\`bash
   sudo -u postgres createdb barista_cafe
   sudo -u postgres createuser --superuser $USER
   \`\`\`

3. **Configuration :**
   \`\`\`bash
   echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/barista_cafe" > .env
   \`\`\`

### 🟡 GitPod
1. **Installation PostgreSQL :**
   \`\`\`bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   sudo service postgresql start
   \`\`\`

2. **Configuration similaire à Codespaces**

### 🟠 Local (macOS)
1. **Installation PostgreSQL :**
   \`\`\`bash
   brew install postgresql
   brew services start postgresql
   \`\`\`

2. **Création de la base de données :**
   \`\`\`bash
   createdb barista_cafe
   \`\`\`

### 🔴 Local (Linux)
1. **Installation PostgreSQL :**
   \`\`\`bash
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   \`\`\`

2. **Configuration :**
   \`\`\`bash
   sudo -u postgres createdb barista_cafe
   sudo -u postgres createuser --superuser $USER
   \`\`\`

## Commandes Utiles

\`\`\`bash
npm run dev          # Démarrer en développement
npm run setup        # Réexécuter la configuration
npm run db:push      # Appliquer les migrations
npm run db:studio    # Interface base de données
bash start.sh        # Démarrage avec vérifications
\`\`\`

## Identifiants par Défaut

- **Directeur** : \`admin\` / \`admin123\`
- **Employé** : \`employee\` / \`employee123\`

## Résolution des Problèmes

### Erreur de connexion PostgreSQL
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez la variable DATABASE_URL dans .env
3. Créez la base de données si nécessaire

### Erreur de permissions
1. Assurez-vous que l'utilisateur PostgreSQL existe
2. Vérifiez les permissions sur la base de données

### Port déjà utilisé
1. Changez le port dans .env (PORT=5001)
2. Ou arrêtez le processus utilisant le port 5000

## Support

Ce projet fonctionne sur tous les environnements de développement modernes.
Pour plus d'aide, consultez la documentation ou créez une issue.
`;

    fs.writeFileSync(path.join(__dirname, 'INSTALLATION.md'), installationContent);
    this.log('Documentation créée (INSTALLATION.md)', 'success');
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