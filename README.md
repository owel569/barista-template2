# Barista Café - Système de Gestion de Café

## 🚀 Installation Automatique (Une seule commande)

```bash
# Cloner le projet
git clone https://github.com/[votre-username]/barista-cafe.git
cd barista-cafe

# Installation complète automatique
npm install
node setup-universal.cjs

# Démarrage
npm run dev
```

**C'est tout !** Le système se configure automatiquement sur tous les environnements.

## 📋 Compatibilité Universelle

| Environnement | Status | Installation |
|---------------|---------|-------------|
| **Replit** | ✅ | Automatique |
| **VS Code** | ✅ | Automatique |
| **GitHub Codespaces** | ✅ | Automatique |
| **GitPod** | ✅ | Automatique |
| **Local macOS/Linux** | ✅ | Automatique |
| **Windows** | ⚠️ | PostgreSQL manuel |

## 🌐 Accès Rapide

Une fois démarré (port 5000) :
- **Site public** : http://localhost:5000
- **Administration** : http://localhost:5000/admin
- **Interface employé** : http://localhost:5000/employe

## 🔑 Identifiants par Défaut

### Administrateur (Directeur)
- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`
- **Accès** : Complet (toutes les fonctionnalités)

### Employé  
- **Nom d'utilisateur** : `employe`
- **Mot de passe** : `employe123`
- **Accès** : Limité (selon permissions)

## 🎯 Fonctionnalités Principales

### Site Public
- **Menu interactif** avec images HD des produits
- **Système de réservation** avec sélection de tables
- **Panier de commande** avec calcul automatique
- **Formulaire de contact** pour les clients

### Administration (Directeur)
- **Tableau de bord** avec statistiques temps réel
- **Gestion des réservations** et notifications
- **Gestion des commandes** et suivi des statuts
- **Gestion des clients** et base de données
- **Gestion du menu** (ajout/modification/suppression)
- **Gestion des employés** et permissions
- **Statistiques avancées** avec graphiques

### Interface Employé
- **Consultation des clients** (lecture seule)
- **Gestion du menu** (sans suppression)
- **Accès limité** selon les permissions définies

## 🗄️ Base de Données

PostgreSQL se configure automatiquement avec :
- **14 produits** pré-configurés (cafés, boissons, pâtisseries, plats)
- **6 tables** de restaurant pour les réservations
- **Comptes utilisateurs** avec rôles différenciés
- **Images HD** authentiques des produits (Pexels)

### Catégories de Menu
- **Cafés** : Espresso, Americano, Cappuccino, Latte
- **Boissons** : Thé vert, Chocolat chaud, Jus d'orange
- **Pâtisseries** : Croissant, Muffin, Éclair, Macarons
- **Plats** : Salade César, Sandwich Club, Quiche Lorraine

## 🛠️ Résolution des Problèmes

### Base de données non accessible
```bash
node setup-universal.cjs
```

### Port 5000 occupé
```bash
# Modifier le port dans server/index.ts
const PORT = process.env.PORT || 3000;
```

### Réinitialisation complète
```bash
rm -rf /tmp/postgres_data /tmp/postgres_run .env
node setup-universal.cjs
```

## 📁 Architecture du Projet

```
barista-cafe/
├── client/              # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   └── lib/         # Utilitaires et configuration
├── server/              # Backend Express.js + TypeScript
│   ├── routes.ts        # API REST endpoints
│   ├── storage.ts       # Couche d'accès aux données
│   └── index.ts         # Serveur principal
├── shared/              # Schémas partagés
│   └── schema.ts        # Modèles de données (Drizzle ORM)
├── setup-universal.cjs  # Installation automatique
├── start.sh            # Script de démarrage
└── .env                # Configuration (générée automatiquement)
```

## 🔧 Technologies Utilisées

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** pour le styling
- **Wouter** pour le routage
- **TanStack Query** pour la gestion des données
- **Radix UI** pour les composants accessibles

### Backend
- **Express.js** avec TypeScript
- **PostgreSQL** avec Drizzle ORM
- **JWT** pour l'authentification
- **Bcrypt** pour le hachage des mots de passe

### Base de Données
- **PostgreSQL** avec configuration automatique
- **Drizzle ORM** pour les requêtes type-safe
- **Migrations** automatiques

## 🚀 Déploiement

### Replit (Recommandé)
1. Forkez le projet sur Replit
2. Cliquez sur "Run"
3. L'application se configure automatiquement

### Autres Plateformes
```bash
# Cloner et configurer
git clone [votre-repo]
cd barista-cafe
npm install
node setup-universal.cjs

# Production
npm run build
npm start
```

## 📱 Interface Utilisateur

### Design
- **Responsive** : s'adapte à tous les écrans
- **Mode sombre/clair** : basculement automatique
- **Sidebar rétractable** : navigation optimisée
- **Notifications temps réel** : alertes automatiques

### Expérience Utilisateur
- **Chargement rapide** : optimisations Vite
- **Feedback immédiat** : états de chargement
- **Validation formulaires** : contrôle en temps réel
- **Images HD** : qualité professionnelle

## 🔒 Sécurité

- **Authentification JWT** avec expiration
- **Mots de passe hashés** avec bcrypt
- **Séparation des rôles** directeur/employé
- **Protection des routes** API sécurisées
- **Validation des données** côté serveur

## 📖 Documentation

- **[INSTALLATION.md](INSTALLATION.md)** : Guide d'installation détaillé
- **[GITHUB_SETUP.md](GITHUB_SETUP.md)** : Configuration GitHub
- **[DEVELOPMENT.md](DEVELOPMENT.md)** : Guide de développement
- **[replit.md](replit.md)** : Architecture et historique

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commitez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Note** : Ce système d'installation automatique garantit que votre projet fonctionne immédiatement sur tous les environnements de développement populaires, sans configuration manuelle.