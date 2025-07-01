# 🌍 Installation Universelle - Barista Café

## ⚡ Installation en 2 étapes (sur toute plateforme)

### 1️⃣ Configuration automatique
```bash
node setup-project.cjs
```

### 2️⃣ Démarrage
```bash
npm run dev
```

## 🗄️ Base de données (une seule fois)

Le script vous guide automatiquement. Choisissez une option :

### Option 1: Cloud (Recommandé)
- **Neon.tech** - Gratuit, simple
- **Supabase.com** - Gratuit, complet  
- **Railway.app** - Gratuit, GitHub intégré

### Option 2: Local
- PostgreSQL installé localement
- Base `barista_cafe` créée

### Option 3: Docker
```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

## 📋 Plateformes testées

✅ **Replit** - Variables environnement  
✅ **GitHub Codespaces** - Secrets repository  
✅ **Gitpod** - Variables environnement  
✅ **VS Code Local** - Fichier .env  
✅ **WebStorm** - Fichier .env  
✅ **CodeSandbox** - Variables environnement  
✅ **Stackblitz** - Variables environnement  
✅ **Linux/Mac/Windows** - Fichier .env  

## 🔧 Fonctionnement

Le script `setup-project.cjs`:
1. Détecte automatiquement votre plateforme
2. Installe les dépendances NPM
3. Configure la base de données
4. Crée les tables nécessaires  
5. Initialise les données

## 🚨 En cas de problème

### Script ne marche pas
```bash
npm install
node setup-project.cjs
```

### Problème de base de données
1. Vérifiez que PostgreSQL est accessible
2. Testez votre URL de connexion
3. Relancez le script

### Erreur de permissions
```bash
chmod +x setup-project.cjs
```

## 📤 Partage du projet

Pour partager avec votre équipe :
1. Poussez sur Git (GitHub, GitLab, etc.)
2. Chaque développeur clone
3. Lance `node setup-project.cjs`
4. Configure sa propre base de données
5. C'est prêt !

## 🎯 Résultat

Après installation, votre projet Barista Café fonctionne identiquement sur toute plateforme de développement avec les mêmes fonctionnalités complètes.