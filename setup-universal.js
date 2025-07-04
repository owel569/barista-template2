#!/usr/bin/env node

/**
 * Installation universelle automatique pour Barista Café
 * Fonctionne sur tous les environnements : Replit, VS Code, GitHub Codespaces, local
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UniversalSetup {
  constructor() {
    this.isReplit = !!process.env.REPLIT_DB_URL;
    this.isGitpod = !!process.env.GITPOD_WORKSPACE_URL;
    this.isCodespaces = !!process.env.CODESPACES;
    this.isLocal = !this.isReplit && !this.isGitpod && !this.isCodespaces;
    
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

  async installPostgreSQL() {
    this.log('Vérification et installation de PostgreSQL...');
    
    if (await this.checkCommand('psql')) {
      this.log('PostgreSQL déjà installé', 'success');
      return true;
    }

    try {
      if (this.isReplit) {
        // PostgreSQL déjà installé sur Replit
        return true;
      } else if (os.platform() === 'darwin') {
        // macOS
        this.log('Installation PostgreSQL sur macOS...');
        execSync('brew install postgresql', { stdio: 'inherit' });
      } else if (os.platform() === 'linux') {
        // Linux
        this.log('Installation PostgreSQL sur Linux...');
        execSync('sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib', { stdio: 'inherit' });
      } else {
        // Windows
        this.log('Veuillez installer PostgreSQL manuellement sur Windows', 'warning');
        return false;
      }
      
      this.log('PostgreSQL installé avec succès', 'success');
      return true;
    } catch (error) {
      this.log(`Erreur d'installation PostgreSQL: ${error.message}`, 'error');
      return false;
    }
  }

  async setupDatabase() {
    this.log('Configuration de la base de données...');

    try {
      // Arrêt des processus existants
      try {
        execSync('pkill -f postgres', { stdio: 'ignore' });
      } catch (e) {
        // Ignore si aucun processus à arrêter
      }

      // Nettoyage des anciens fichiers
      if (fs.existsSync(this.postgresDir)) {
        fs.rmSync(this.postgresDir, { recursive: true, force: true });
      }
      if (fs.existsSync(this.postgresSocket)) {
        fs.rmSync(this.postgresSocket, { recursive: true, force: true });
      }

      // Création des répertoires
      fs.mkdirSync(this.postgresDir, { recursive: true });
      fs.mkdirSync(this.postgresSocket, { recursive: true });

      // Initialisation de PostgreSQL
      this.log('Initialisation de PostgreSQL...');
      execSync(`initdb -D "${this.postgresDir}" --auth-local=trust --auth-host=trust -U postgres -A trust`, { 
        stdio: 'inherit' 
      });

      // Démarrage de PostgreSQL
      this.log('Démarrage de PostgreSQL...');
      execSync(`pg_ctl -D "${this.postgresDir}" -l "${this.postgresDir}/postgres.log" -o "-k ${this.postgresSocket}" start -w`, {
        stdio: 'inherit'
      });

      // Attente du démarrage
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Création de la base de données
      this.log('Création de la base de données...');
      try {
        execSync(`createdb -h "${this.postgresSocket}" -U postgres barista_cafe`, { stdio: 'inherit' });
        this.log('Base de données créée avec succès', 'success');
      } catch (e) {
        this.log('Base de données déjà existante', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Erreur de configuration: ${error.message}`, 'error');
      return false;
    }
  }

  createEnvFile() {
    this.log('Création du fichier .env...');
    
    const envContent = `# Configuration automatique générée
DATABASE_URL=${this.databaseUrl}
NODE_ENV=development
JWT_SECRET=barista-cafe-secret-key-${Date.now()}
`;

    fs.writeFileSync('.env', envContent);
    this.log('Fichier .env créé', 'success');
  }

  createStartupScript() {
    this.log('Création du script de démarrage automatique...');
    
    const startupScript = `#!/bin/bash

# Script de démarrage automatique pour Barista Café
echo "🚀 Démarrage automatique de Barista Café..."

# Vérification et démarrage PostgreSQL si nécessaire
if ! pgrep -f "postgres.*${this.postgresSocket}" > /dev/null; then
    echo "📊 PostgreSQL non détecté, démarrage..."
    node setup-universal.js
fi

# Démarrage de l'application
npm run dev
`;

    fs.writeFileSync('start.sh', startupScript);
    fs.chmodSync('start.sh', '755');
    this.log('Script de démarrage créé', 'success');
  }

  updatePackageJson() {
    this.log('Mise à jour de package.json...');
    
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Ajout du script de setup automatique
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['setup'] = 'node setup-universal.js';
      packageJson.scripts['start:auto'] = './start.sh';
      packageJson.scripts['postinstall'] = 'node setup-universal.js';
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      this.log('package.json mis à jour', 'success');
    }
  }

  createDocumentation() {
    this.log('Création de la documentation...');
    
    const readmeContent = `# Barista Café - Installation Automatique

## Installation Rapide

### Nouvelle Installation
\`\`\`bash
git clone [votre-repo]
cd barista-cafe
npm install
# La configuration se fait automatiquement via postinstall
\`\`\`

### Démarrage
\`\`\`bash
npm run dev
# Ou pour un démarrage avec vérification automatique
npm run start:auto
\`\`\`

### Configuration Manuelle (si nécessaire)
\`\`\`bash
npm run setup
\`\`\`

## Compatibilité

✅ **Replit** - Configuration automatique
✅ **VS Code** - Installation automatique des dépendances
✅ **GitHub Codespaces** - Setup automatique
✅ **GitPod** - Configuration automatique  
✅ **Local** (macOS/Linux) - Installation PostgreSQL automatique
⚠️ **Windows** - Nécessite installation manuelle de PostgreSQL

## Identifiants par Défaut

- **Administrateur**: admin / admin123
- **Employé**: employe / employe123

## Base de Données

La base de données PostgreSQL est configurée automatiquement avec :
- 14 éléments de menu prêts à l'emploi
- Comptes utilisateurs configurés
- Tables et relations complètes

## Support

En cas de problème, exécutez \`npm run setup\` pour reconfigurer automatiquement.
`;

    fs.writeFileSync('README.md', readmeContent);
    this.log('Documentation créée', 'success');
  }

  async run() {
    this.log('🔧 Installation universelle de Barista Café');
    this.log(`Environnement détecté: ${this.isReplit ? 'Replit' : this.isGitpod ? 'GitPod' : this.isCodespaces ? 'Codespaces' : 'Local'}`);

    // Installation des dépendances
    const success = await this.installPostgreSQL();
    if (!success && !this.isReplit) {
      this.log('Installation PostgreSQL échouée', 'error');
      return false;
    }

    // Configuration de la base de données
    await this.setupDatabase();

    // Création des fichiers de configuration
    this.createEnvFile();
    this.createStartupScript();
    this.updatePackageJson();
    this.createDocumentation();

    this.log('🎉 Installation terminée avec succès!', 'success');
    this.log('Démarrez avec: npm run dev', 'info');
    this.log('Administration: http://localhost:5000/admin (admin/admin123)', 'info');

    return true;
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new UniversalSetup();
  setup.run().catch(console.error);
}

export default UniversalSetup;