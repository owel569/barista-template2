# Barista Café - Système de Gestion de Café

Un système complet de gestion de café avec interface de réservation, menu interactif et tableau de bord administrateur.

## ✨ Fonctionnalités

- **Site Web Public** : Présentation élégante du café avec menu interactif
- **Système de Réservation** : Réservation de tables avec sélection d'articles
- **Menu Dynamique** : Affichage du menu par catégories avec vraies images HD
- **Tableau de Bord Admin** : Gestion des réservations, clients et employés
- **Authentification Sécurisée** : Système de connexion administrateur
- **Base de Données PostgreSQL** : Stockage persistant des données

## 🛠️ Technologies

### Frontend
- **React 18** avec TypeScript
- **Tailwind CSS** pour le design responsive
- **Wouter** pour la navigation
- **TanStack Query** pour la gestion d'état
- **React Hook Form** + Zod pour les formulaires
- **Radix UI** pour les composants accessibles

### Backend  
- **Express.js** avec TypeScript
- **PostgreSQL** avec Drizzle ORM
- **JWT** pour l'authentification
- **Bcrypt** pour le hashage des mots de passe

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 20+
- PostgreSQL
- npm ou yarn

### Configuration rapide

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd barista-cafe
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
```bash
# Créer un fichier .env avec vos paramètres PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/barista_cafe"
```

4. **Démarrer l'application**
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5000`

## 📱 Utilisation

### Accès Public
- **Accueil** : Présentation du café avec aperçu du menu
- **Menu** : Menu complet avec filtrage par catégories  
- **Réservations** : Interface de réservation avec sélection d'articles
- **Contact** : Formulaire de contact

### Accès Administrateur
- **URL** : `/admin`
- **Identifiants par défaut** : admin / admin123
- **Fonctionnalités** :
  - Gestion des réservations
  - Gestion des clients et employés
  - Statistiques et graphiques
  - Gestion du menu

## 🎨 Design

Le design utilise une palette de couleurs café avec :
- **Couleurs principales** : Ambre, orange, marron
- **Interface responsive** : Optimisée mobile et desktop
- **Images HD** : Vraies photos Pexels pour tous les produits
- **Animations fluides** : Transitions CSS et Framer Motion

## 📊 Structure de la Base de Données

- **users** : Comptes administrateurs
- **menu_categories** : Catégories du menu (Cafés, Boissons, etc.)
- **menu_items** : Articles du menu avec images et prix
- **tables** : Tables du restaurant
- **reservations** : Réservations clients
- **customers** : Base de données clients
- **employees** : Gestion du personnel

## 🔧 Scripts Disponibles

```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build pour production
npm run db:push      # Synchronisation de la base de données
npm run setup        # Configuration automatique initiale
```

## 📈 Fonctionnalités Avancées

- **Auto-setup** : Configuration automatique au démarrage
- **Gestion d'images** : Système intelligent de fallback pour les images
- **Validation** : Validation complète des formulaires avec Zod
- **Responsive** : Interface adaptative sur tous les appareils
- **Performance** : Optimisations avec mise en cache

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

Pour toute question ou support, contactez-nous à travers le système de contact du site web.

---

**Développé avec ❤️ pour les amateurs de café**