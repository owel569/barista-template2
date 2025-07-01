# Barista Café - Site Web Complet

Un site web moderne pour café avec système de réservation, gestion de menu et interface d'administration.

## ⚡ Installation Universelle

### Sur toute plateforme de développement :
```bash
# 1. Installation automatique
node setup-project.cjs

# 2. Démarrage
npm run dev
```

C'est tout ! Le script configure automatiquement votre environnement.

## 📋 Prérequis

- **Node.js 18+** 
- **Base de données PostgreSQL**

## 🗄️ Base de Données

Le script vous guide automatiquement. Options disponibles :

- **Cloud (Gratuit)**: Neon.tech, Supabase.com, Railway.app
- **Local**: PostgreSQL installé sur votre machine  
- **Docker**: Container PostgreSQL

Le script détecte votre environnement et configure automatiquement.

## 🛠️ Scripts Disponibles

- `node setup-project.cjs` - Configuration automatique (première fois)
- `npm run dev` - Serveur de développement
- `npm run build` - Compilation production
- `npm run start` - Serveur production

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