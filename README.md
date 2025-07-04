# Barista Café - Installation Universelle

## Installation Rapide

1. **Clonez le projet**
   ```bash
   git clone <votre-repo>
   cd barista-cafe
   ```

2. **Installation automatique**
   ```bash
   npm install
   node setup-universal.js
   ```

3. **Démarrage**
   ```bash
   npm run dev
   # ou
   bash start.sh
   ```

## Configuration par Environnement

### Replit
- Configuration automatique ✅
- PostgreSQL géré automatiquement
- Prêt à l'emploi

### VS Code / Codespaces
1. Installez PostgreSQL :
   ```bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib
   ```
2. Créez la base de données :
   ```bash
   sudo -u postgres createdb barista_cafe
   ```
3. Configurez DATABASE_URL dans .env

### Local (macOS)
1. Installez PostgreSQL :
   ```bash
   brew install postgresql
   brew services start postgresql
   ```
2. Créez la base de données :
   ```bash
   createdb barista_cafe
   ```

### Local (Linux)
1. Installez PostgreSQL :
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```
2. Configurez et créez la base de données :
   ```bash
   sudo -u postgres createdb barista_cafe
   ```

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
