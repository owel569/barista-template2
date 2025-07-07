#!/usr/bin/env node

/**
 * Script de configuration spécial pour GitHub Codespaces et environnements sans sudo
 * Fonctionne sans mot de passe sudo en utilisant des alternatives
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubSetup {
  constructor() {
    this.log('🚀 Configuration pour GitHub Codespaces sans sudo');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async detectEnvironment() {
    const env = {
      isCodespaces: !!process.env.CODESPACES,
      isGitHub: !!process.env.GITHUB_WORKSPACE,
      isReplit: !!process.env.REPLIT_DEPLOYMENT,
      isLocal: !process.env.CODESPACES && !process.env.GITHUB_WORKSPACE,
      user: process.env.USER || 'user'
    };

    this.log(`Environnement détecté: ${JSON.stringify(env)}`);
    return env;
  }

  async setupPostgreSQLNoSudo() {
    this.log('🗄️ Configuration PostgreSQL sans sudo...');
    
    try {
      // Vérifier si PostgreSQL est déjà installé
      try {
        await this.execAsync('which psql');
        this.log('PostgreSQL déjà installé');
      } catch {
        this.log('PostgreSQL non trouvé, tentative d\'installation...');
        
        // Essayer avec apt sans sudo (si disponible)
        try {
          await this.execAsync('apt list --installed | grep postgresql');
          this.log('PostgreSQL système détecté');
        } catch {
          this.log('❌ PostgreSQL non disponible. Solutions alternatives:');
          this.log('1. Utilisez une base de données cloud (comme Neon, Supabase)');
          this.log('2. Utilisez SQLite à la place');
          this.log('3. Demandez à l\'administrateur d\'installer PostgreSQL');
          return false;
        }
      }

      // Créer un répertoire utilisateur pour PostgreSQL
      const dataDir = path.join(process.env.HOME, '.postgresql');
      const socketDir = path.join(process.env.HOME, '.postgresql_socket');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (!fs.existsSync(socketDir)) {
        fs.mkdirSync(socketDir, { recursive: true });
      }

      // Essayer d'initialiser une base de données utilisateur
      try {
        await this.execAsync(`initdb -D ${dataDir} --auth-local=trust --auth-host=trust`);
        this.log('Base de données utilisateur initialisée');
      } catch (error) {
        this.log('Base de données utilisateur déjà initialisée ou erreur:', 'warning');
      }

      // Essayer de démarrer PostgreSQL en mode utilisateur
      try {
        const pgProcess = spawn('postgres', [
          '-D', dataDir,
          '-k', socketDir,
          '-p', '5432'
        ], { detached: true, stdio: 'ignore' });
        
        pgProcess.unref();
        this.log('PostgreSQL démarré en mode utilisateur');
        
        // Attendre un peu pour que le serveur démarre
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Créer la base de données
        await this.execAsync(`createdb -h ${socketDir} -p 5432 barista_cafe`);
        this.log('Base de données barista_cafe créée');
        
        return true;
      } catch (error) {
        this.log('Erreur lors du démarrage de PostgreSQL:', 'error');
        this.log(error.message || error, 'error');
        return false;
      }
      
    } catch (error) {
      this.log('Erreur PostgreSQL:', 'error');
      this.log(error.message || error, 'error');
      return false;
    }
  }

  async setupSQLiteAlternative() {
    this.log('🗄️ Configuration SQLite comme alternative...');
    
    // Créer un fichier de configuration pour SQLite
    const sqliteConfig = `
# Configuration SQLite pour Barista Café
# Utilisez cette configuration si PostgreSQL n'est pas disponible

DATABASE_URL=sqlite:./barista_cafe.db
DB_TYPE=sqlite
`;

    fs.writeFileSync('.env.sqlite', sqliteConfig);
    this.log('✅ Configuration SQLite créée dans .env.sqlite');
    
    this.log('Pour utiliser SQLite:');
    this.log('1. Copiez .env.sqlite vers .env');
    this.log('2. Modifiez le code pour utiliser SQLite au lieu de PostgreSQL');
    this.log('3. Utilisez: cp .env.sqlite .env');
    
    return true;
  }

  createStartupScript() {
    this.log('📝 Création du script de démarrage...');
    
    const startScript = `#!/bin/bash

# Script de démarrage pour GitHub Codespaces
echo "🚀 Démarrage Barista Café..."

# Vérifier si PostgreSQL est disponible
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL trouvé"
    
    # Essayer de démarrer PostgreSQL en mode utilisateur
    if [ -d "$HOME/.postgresql" ]; then
        echo "🗄️ Démarrage PostgreSQL utilisateur..."
        postgres -D $HOME/.postgresql -k $HOME/.postgresql_socket -p 5432 &
        sleep 3
        echo "✅ PostgreSQL démarré"
    fi
else
    echo "⚠️ PostgreSQL non disponible, utilisation de SQLite"
    if [ -f ".env.sqlite" ]; then
        cp .env.sqlite .env
        echo "✅ Configuration SQLite activée"
    fi
fi

# Démarrer l'application
echo "🌟 Démarrage de l'application..."
npm run dev
`;

    fs.writeFileSync('start-github.sh', startScript);
    fs.chmodSync('start-github.sh', '755');
    this.log('✅ Script de démarrage créé: start-github.sh');
  }

  createDocumentation() {
    this.log('📚 Création de la documentation...');
    
    const githubDocs = `# Configuration GitHub Codespaces - Barista Café

## Problème: PostgreSQL demande un mot de passe sudo

### Solution 1: Configuration PostgreSQL utilisateur (Recommandée)

\`\`\`bash
# Exécuter le script de configuration
node setup-github.js

# Démarrer avec le script personnalisé
./start-github.sh
\`\`\`

### Solution 2: Utiliser SQLite (Plus simple)

\`\`\`bash
# Copier la configuration SQLite
cp .env.sqlite .env

# Modifier package.json pour utiliser SQLite
npm install sqlite3 better-sqlite3

# Démarrer normalement
npm run dev
\`\`\`

### Solution 3: Base de données cloud (Production)

1. **Neon Database** (gratuit): https://neon.tech
2. **Supabase** (gratuit): https://supabase.com
3. **PlanetScale** (gratuit): https://planetscale.com

Copiez l'URL de connexion dans votre fichier .env:
\`\`\`
DATABASE_URL=postgresql://user:password@host:5432/database
\`\`\`

### Solution 4: Demander l'installation système

Contactez l'administrateur de votre environnement pour installer PostgreSQL:
\`\`\`bash
# Commande que l'administrateur doit exécuter
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
\`\`\`

## Dépannage

### Erreur "permission denied"
- Utilisez les solutions 2 ou 3 ci-dessus
- Vérifiez que vous êtes dans le bon répertoire du projet

### Erreur "psql: command not found"
- PostgreSQL n'est pas installé
- Utilisez la solution 2 (SQLite) ou 3 (cloud)

### Erreur "database does not exist"
- Exécutez: \`createdb barista_cafe\`
- Ou utilisez SQLite avec: \`cp .env.sqlite .env\`

## Contact

Si vous avez des questions, consultez le fichier README.md principal.
`;

    fs.writeFileSync('GITHUB_SETUP.md', githubDocs);
    this.log('✅ Documentation créée: GITHUB_SETUP.md');
  }

  async run() {
    try {
      const env = await this.detectEnvironment();
      
      this.log('🔧 Configuration en cours...');
      
      // Essayer PostgreSQL en mode utilisateur
      const pgSuccess = await this.setupPostgreSQLNoSudo();
      
      if (!pgSuccess) {
        this.log('⚠️ PostgreSQL non disponible, création d\'alternatives...');
        await this.setupSQLiteAlternative();
      }
      
      this.createStartupScript();
      this.createDocumentation();
      
      this.log('🎉 Configuration terminée !');
      this.log('');
      this.log('📖 Consultez GITHUB_SETUP.md pour les instructions détaillées');
      this.log('🚀 Pour démarrer: ./start-github.sh');
      this.log('');
      
      if (!pgSuccess) {
        this.log('💡 Conseil: Utilisez une base de données cloud (Neon, Supabase) pour un déploiement facile');
      }
      
    } catch (error) {
      this.log('❌ Erreur lors de la configuration:', 'error');
      this.log(error.message || error, 'error');
      process.exit(1);
    }
  }
}

// Exécuter le script
if (require.main === module) {
  new GitHubSetup().run();
}

module.exports = GitHubSetup;