# 🛠️ Guide de Développement - Barista Café

## 🚀 Configuration pour le Développement Local

### 1️⃣ Cloner le projet depuis GitHub
```bash
git clone <votre-repo-url>
cd barista-cafe
```

### 2️⃣ Configuration rapide
```bash
# Installation automatique
node setup-project.cjs
```

### 3️⃣ Configuration manuelle (si préféré)
```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier de configuration
cp .env.example .env

# 3. Modifier .env avec vos informations de base de données
# 4. Créer les tables
npm run db:push

# 5. Lancer le projet
npm run dev
```

## 🗄️ Configuration Base de Données Locale

### PostgreSQL Local
1. Installez PostgreSQL sur votre machine
2. Créez une base de données `barista_cafe`
3. Modifiez le fichier `.env`:
```env
DATABASE_URL=postgresql://votre_user:votre_password@localhost:5432/barista_cafe
```

### Alternatives pour tests rapides
- **Neon Database** (gratuit): https://neon.tech
- **Supabase** (gratuit): https://supabase.com
- **Railway** (gratuit): https://railway.app

## 📁 Structure pour GitHub

```
votre-repo/
├── .env.example          # Template de configuration
├── .gitignore           # Fichiers à ignorer
├── setup-project.cjs    # Script d'installation
├── INSTALLATION.md      # Guide utilisateur simple
├── DEVELOPMENT.md       # Ce fichier (guide dev)
├── README.md           # Documentation complète
├── client/             # Frontend React
├── server/             # Backend Express
└── shared/            # Types partagés
```

## 🔄 Workflow de Développement

### Première fois
```bash
git clone <repo>
cd barista-cafe
node setup-project.cjs
npm run dev
```

### Développement quotidien
```bash
npm run dev              # Démarre le serveur de dev
```

### Avant de commit
```bash
npm run check           # Vérification TypeScript
npm run build          # Test de compilation
```

## 🌐 Variables d'Environnement

Le projet s'adapte automatiquement :
- **Local** : Utilise `.env`
- **GitHub Codespaces** : Détection automatique
- **Replit** : Utilise les secrets Replit
- **Production** : Variables d'environnement du serveur

## 🛠️ Scripts NPM

- `npm run dev` - Serveur de développement
- `npm run build` - Compilation production  
- `npm run start` - Serveur production
- `npm run check` - Vérification TypeScript
- `npm run db:push` - Mise à jour base de données

## 🐛 Dépannage Développement

### Erreur de base de données
```bash
# Recréer les tables
npm run db:push
```

### Problème de dépendances
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Problème de configuration
```bash
# Reconfigurer complètement
node setup-project.cjs
```

## 📤 Déploiement GitHub

1. **GitHub Pages** : Uniquement frontend statique
2. **Vercel/Netlify** : Frontend + API serverless
3. **Railway/Render** : Application complète
4. **Replit** : Développement et prototypage

Pour chaque plateforme, le script `setup-project.cjs` s'adapte automatiquement.