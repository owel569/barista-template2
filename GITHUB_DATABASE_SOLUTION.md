# Solution Database GitHub sans sudo

## Problème
Sur GitHub Codespaces, le système demande un mot de passe sudo que vous n'avez pas pour configurer PostgreSQL.

## Solution 1 : SQLite (Recommandée pour GitHub)

### Installation automatique :
```bash
# Exécuter ce script directement dans le terminal GitHub
npm install sqlite3 better-sqlite3
```

### Configuration automatique :
```bash
# Copier ce script dans setup-github-sqlite.js
node setup-github-sqlite.js
```

## Solution 2 : PostgreSQL sans sudo

### Alternative 1 : Utiliser un service cloud gratuit
1. **Créer un compte Supabase gratuit** : https://supabase.com
2. **Récupérer la DATABASE_URL** de votre projet
3. **Ajouter à vos variables d'environnement GitHub**

### Alternative 2 : PostgreSQL local sans sudo
```bash
# Installation dans l'espace utilisateur (sans sudo)
mkdir -p $HOME/postgres
cd $HOME/postgres
wget https://ftp.postgresql.org/pub/source/v15.3/postgresql-15.3.tar.gz
tar -xzf postgresql-15.3.tar.gz
cd postgresql-15.3
./configure --prefix=$HOME/postgres --without-readline
make && make install
```

## Solution 3 : Configuration automatique universelle

Le projet inclut déjà un script `setup-universal.js` qui détecte automatiquement l'environnement :

```bash
# Cette commande fonctionne sur GitHub Codespaces
npm install && node setup-universal.js
```

## Commandes de test
```bash
# Vérifier l'installation
npm run dev

# Tester la base de données
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Variables d'environnement nécessaires
```bash
# Créer un fichier .env avec :
DATABASE_URL=your_database_url_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```