# Configuration GitHub Codespaces - Barista Café

## Problème: PostgreSQL demande un mot de passe sudo

### Solution 1: Configuration PostgreSQL utilisateur (Recommandée)

```bash
# Exécuter le script de configuration
node setup-github.js

# Démarrer avec le script personnalisé
./start-github.sh
```

### Solution 2: Utiliser SQLite (Plus simple) ⭐

```bash
# Copier la configuration SQLite
cp .env.sqlite .env

# Démarrer normalement
npm run dev
```

### Solution 3: Base de données cloud (Production)

1. **Neon Database** (gratuit): https://neon.tech
2. **Supabase** (gratuit): https://supabase.com
3. **PlanetScale** (gratuit): https://planetscale.com

Copiez l'URL de connexion dans votre fichier .env:
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Solution 4: Demander l'installation système

Contactez l'administrateur de votre environnement pour installer PostgreSQL:
```bash
# Commande que l'administrateur doit exécuter
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

## Démarrage rapide

### Option A: SQLite (recommandé pour le développement)
```bash
cp .env.sqlite .env
npm install
npm run dev
```

### Option B: Script automatique
```bash
./start-github.sh
```

## Dépannage

### Erreur "permission denied"
- Utilisez les solutions 2 ou 3 ci-dessus
- Vérifiez que vous êtes dans le bon répertoire du projet

### Erreur "psql: command not found"
- PostgreSQL n'est pas installé
- Utilisez la solution 2 (SQLite) ou 3 (cloud)

### Erreur "database does not exist"
- Exécutez: `createdb barista_cafe`
- Ou utilisez SQLite avec: `cp .env.sqlite .env`

### Erreur "tsx: not found"
- Installez les dépendances: `npm install`
- Ou utilisez: `npx tsx server/index.ts`

## Fonctionnalités de l'application

Une fois l'application démarrée, vous pouvez:

1. **Accéder au site public**: http://localhost:5000
2. **Accéder à l'administration**: http://localhost:5000/admin
   - Identifiants: admin / admin123
3. **Tester les réservations**: Interface interactive avec panier
4. **Gérer le menu**: Ajout/modification des produits
5. **Suivre les commandes**: Système de notifications en temps réel

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Base de données**: PostgreSQL (ou SQLite en développement)
- **Authentification**: JWT + bcrypt
- **Temps réel**: WebSocket pour les notifications

## Contact

Si vous avez des questions, consultez le fichier README.md principal ou créez une issue sur GitHub.