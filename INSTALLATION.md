# Installation Barista Café

## Installation Automatique (Recommandée)

### Étape 1 : Cloner le projet
```bash
git clone <votre-repo>
cd barista-cafe
```

### Étape 2 : Installation universelle
```bash
npm install
node setup-universal.cjs
```

### Étape 3 : Démarrage
```bash
npm run dev
```

## Installation par Environnement

### 🟢 Replit
- **Configuration automatique** ✅
- **PostgreSQL géré automatiquement** ✅
- **Prêt à l'emploi** ✅

### 🔵 VS Code / GitHub Codespaces
1. **Installation PostgreSQL :**
   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   sudo service postgresql start
   ```

2. **Création de la base de données :**
   ```bash
   sudo -u postgres createdb barista_cafe
   sudo -u postgres createuser --superuser $USER
   ```

3. **Configuration :**
   ```bash
   echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/barista_cafe" > .env
   ```

### 🟡 GitPod
1. **Installation PostgreSQL :**
   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   sudo service postgresql start
   ```

2. **Configuration similaire à Codespaces**

### 🟠 Local (macOS)
1. **Installation PostgreSQL :**
   ```bash
   brew install postgresql
   brew services start postgresql
   ```

2. **Création de la base de données :**
   ```bash
   createdb barista_cafe
   ```

### 🔴 Local (Linux)
1. **Installation PostgreSQL :**
   ```bash
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Configuration :**
   ```bash
   sudo -u postgres createdb barista_cafe
   sudo -u postgres createuser --superuser $USER
   ```

## Commandes Utiles

```bash
npm run dev          # Démarrer en développement
npm run setup        # Réexécuter la configuration
npm run db:push      # Appliquer les migrations
npm run db:studio    # Interface base de données
bash start.sh        # Démarrage avec vérifications
```

## Identifiants par Défaut

- **Directeur** : `admin` / `admin123`
- **Employé** : `employee` / `employee123`

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
