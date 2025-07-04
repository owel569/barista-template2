# Configuration GitHub - Barista Café

## 🚀 Installation Automatique depuis GitHub

### Étape 1: Cloner le projet
```bash
git clone https://github.com/[votre-username]/barista-cafe.git
cd barista-cafe
```

### Étape 2: Installation automatique
```bash
npm install
node setup-universal.cjs
```

### Étape 3: Démarrage
```bash
npm run dev
```

## 📋 Compatibilité Environnements

| Environnement | Installation | Démarrage |
|---------------|-------------|-----------|
| **Replit** | ✅ Automatique | `npm run dev` |
| **VS Code** | ✅ Automatique | `npm run dev` |
| **GitHub Codespaces** | ✅ Automatique | `npm run dev` |
| **GitPod** | ✅ Automatique | `npm run dev` |
| **Local macOS** | ✅ Automatique | `npm run dev` |
| **Local Linux** | ✅ Automatique | `npm run dev` |
| **Local Windows** | ⚠️ PostgreSQL manuel | `npm run dev` |

## 🔧 Configuration Windows

Si vous utilisez Windows, installez PostgreSQL manuellement :

1. Téléchargez PostgreSQL depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Créez une base de données `barista_cafe`
3. Configurez `.env` avec votre DATABASE_URL
4. Lancez `npm run dev`

## 🗄️ Base de Données

PostgreSQL se configure automatiquement avec :
- **14 produits** pré-configurés (cafés, boissons, pâtisseries, plats)
- **Comptes utilisateurs** admin et employé
- **Tables complètes** pour réservations, commandes, clients
- **Images HD** des produits

## 🔑 Identifiants par Défaut

### Administrateur (Accès complet)
- URL: `http://localhost:5000/admin`
- Nom d'utilisateur: `admin`
- Mot de passe: `admin123`

### Employé (Accès limité)
- URL: `http://localhost:5000/employe`
- Nom d'utilisateur: `employe`
- Mot de passe: `employe123`

## 🌐 URLs d'Accès

- **Site public**: http://localhost:5000
- **Menu interactif**: http://localhost:5000/menu
- **Réservations**: http://localhost:5000/reservations
- **Administration**: http://localhost:5000/admin
- **Interface employé**: http://localhost:5000/employe

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

### Permissions PostgreSQL
```bash
# Nettoyer et reconfigurer
rm -rf /tmp/postgres_data /tmp/postgres_run
node setup-universal.cjs
```

## 📁 Structure du Projet

```
barista-cafe/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   └── lib/         # Utilitaires
├── server/              # Express.js backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Couche de données
│   └── index.ts         # Point d'entrée
├── shared/              # Schémas partagés
│   └── schema.ts        # Modèles de données
├── setup-universal.cjs  # Installation automatique
├── start.sh            # Script de démarrage
└── .env                # Configuration (générée automatiquement)
```

## 🔄 Développement

### Commandes principales
```bash
# Première installation
npm install && node setup-universal.cjs

# Démarrage du serveur
npm run dev

# Démarrage automatique avec vérifications
./start.sh

# Synchronisation base de données
npm run db:push
```

### Données de test
Le système génère automatiquement :
- 14 produits avec images HD
- Comptes admin et employé
- 6 tables de restaurant
- Données de démonstration

## 🚀 Déploiement

### Replit
1. Forkez sur Replit
2. Cliquez sur "Run" 
3. L'application se configure automatiquement

### Vercel/Netlify
1. Connectez votre repo GitHub
2. Configurez les variables d'environnement
3. Déployez avec `npm run build`

### Serveur VPS
```bash
git clone [votre-repo]
cd barista-cafe
npm install
node setup-universal.cjs
npm run build
npm start
```

## 📱 Fonctionnalités Principales

- **Site vitrine** responsive avec menu interactif
- **Système de réservation** avec sélection de tables
- **Panier de commande** avec calcul automatique
- **Administration complète** pour directeurs
- **Interface employé** avec permissions
- **Statistiques** et tableaux de bord
- **Gestion des messages** clients
- **Images HD** des produits

## 🔒 Sécurité

- Authentification JWT avec expiration
- Mots de passe hashés avec bcrypt
- Séparation des rôles utilisateur
- Protection CSRF
- Validation des données côté serveur

---

**Note**: Ce système garantit une installation en une seule commande sur tous les environnements de développement populaires.