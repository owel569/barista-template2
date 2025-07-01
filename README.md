# Barista Café - Site Web Complet

Un site web moderne pour café avec système de réservation, gestion de menu et interface d'administration.

## 🚀 Démarrage Rapide

### Option 1: Configuration Automatique (Recommandée)
```bash
npm run setup
```

### Option 2: Configuration Manuelle
```bash
# 1. Installer les dépendances
npm install

# 2. Configurer la base de données (voir section Database)
# 3. Lancer l'application
npm run dev
```

## 📋 Prérequis

- **Node.js 18+** 
- **Base de données PostgreSQL**

## 🗄️ Configuration de la Base de Données

### Sur Replit
1. Allez dans les **Secrets** de votre projet
2. Ajoutez une nouvelle variable:
   - **Nom**: `DATABASE_URL`
   - **Valeur**: `postgresql://username:password@host:port/database`

### En Local
1. Créez un fichier `.env` à la racine du projet:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/barista_cafe
NODE_ENV=development
JWT_SECRET=votre_secret_jwt_super_securise
```

2. Remplacez les valeurs par vos vraies informations de base de données

## 🛠️ Scripts Disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run setup` - Configuration automatique du projet
- `npm run build` - Compile le projet pour la production
- `npm run start` - Lance le serveur de production
- `npm run db:push` - Applique les migrations de base de données

## 👤 Compte Administrateur

Après la première installation, un compte administrateur est créé automatiquement:

- **Nom d'utilisateur**: `admin`
- **Mot de passe**: `admin123`

⚠️ **Important**: Changez ces identifiants en production !

## 📁 Structure du Projet

```
├── client/          # Interface utilisateur (React + TypeScript)
├── server/          # API Backend (Express + TypeScript)
├── shared/          # Types et schémas partagés
├── migrations/      # Migrations de base de données
└── setup-project.js # Script de configuration automatique
```

## 🌟 Fonctionnalités

### Pour les Clients
- 🍽️ Menu interactif avec images
- 📅 Système de réservation en ligne
- 🛒 Panier pour commandes
- 📱 Interface responsive (mobile/desktop)

### Pour les Administrateurs
- 📊 Tableau de bord avec statistiques
- 📋 Gestion des réservations
- 🍕 Gestion du menu et catégories
- 👥 Gestion des clients et employés
- 📈 Rapports et analyses

## 🔧 Technologies Utilisées

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Base de données**: PostgreSQL
- **Authentification**: JWT + Bcrypt
- **Build**: Vite + esbuild

## 🚨 Dépannage

### Erreur "DATABASE_URL must be set"
- Vérifiez que la variable `DATABASE_URL` est configurée
- Lancez `npm run setup` pour une configuration automatique

### Erreur "relation does not exist"
- Lancez `npm run db:push` pour créer les tables
- Ou utilisez `npm run setup` pour tout configurer

### Le serveur ne démarre pas
1. Vérifiez que toutes les dépendances sont installées: `npm install`
2. Vérifiez la configuration de la base de données
3. Relancez la configuration: `npm run setup`

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez la section **Dépannage** ci-dessus
2. Assurez-vous que tous les prérequis sont installés
3. Lancez `npm run setup` pour reconfigurer automatiquement

## 🔄 Mise à Jour

Pour mettre à jour le projet vers une nouvelle version:
```bash
git pull origin main
npm install
npm run setup
```