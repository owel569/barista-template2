
# Barista Café - Site Web Complet

Site web de café moderne avec système de réservation intégré, basé sur le template Barista Cafe.

## 🚀 Fonctionnalités

- **Frontend React** avec design responsive
- **Backend Express.js** avec API REST
- **Base de données PostgreSQL** avec Drizzle ORM
- **Système d'authentification** JWT sécurisé
- **Gestion des réservations** en temps réel
- **Interface d'administration** complète
- **Menu dynamique** géré via base de données
- **Formulaire de contact** fonctionnel

## 🛠️ Technologies Utilisées

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Wouter (routing)
- TanStack Query
- React Hook Form
- Zod (validation)
- Lucide React (icônes)

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- JWT (authentification)
- Bcrypt (hachage mots de passe)

## 📦 Installation

### Prérequis
- Node.js 20+
- PostgreSQL
- npm ou yarn

### Configuration
1. Clonez le dépôt :
```bash
git clone https://github.com/votre-username/barista-cafe-website.git
cd barista-cafe-website
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez la base de données :
```bash
# Créez une base PostgreSQL et configurez DATABASE_URL
export DATABASE_URL="postgresql://username:password@localhost:5432/barista_cafe"
```

4. Initialisez la base de données :
```bash
npm run db:push
```

5. Démarrez le serveur de développement :
```bash
npm run dev
```

Le site sera accessible sur `http://localhost:5000`

## 🔐 Accès Administration

- **URL** : `/login`
- **Username** : `admin`
- **Password** : `admin123`

## 📁 Structure du Projet

```
barista-cafe-website/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/         # Pages principales
│   │   ├── lib/           # Utilitaires et configuration
│   │   └── hooks/         # Hooks personnalisés
├── server/                # Backend Express
│   ├── routes.ts          # Routes API
│   ├── storage.ts         # Couche d'accès aux données
│   ├── db.ts             # Configuration base de données
│   └── init-db.ts        # Initialisation données
├── shared/               # Code partagé
│   └── schema.ts         # Schémas Drizzle et validation
└── README.md
```

## 🎨 Design

Le design s'inspire du template Barista Cafe avec :
- Palette de couleurs café/orange chaleureuse
- Typography moderne avec Playfair Display
- Interface responsive mobile-first
- Animations fluides et transitions

## 📊 Fonctionnalités Admin

- Gestion des réservations (CRUD)
- Statistiques en temps réel
- Gestion du menu et des catégories
- Suivi des messages de contact
- Export de données

## 🔧 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run db:push      # Mise à jour schéma DB
npm run db:studio    # Interface graphique DB
```

## 🚀 Déploiement

Le projet est prêt pour le déploiement sur :
- Vercel / Netlify (frontend)
- Railway / Heroku (backend)
- Supabase / Neon (PostgreSQL)

## 📝 License

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

Développé avec ❤️ pour la communauté des cafés indépendants
>>>>>>> d0b72e0c7ccfdf434725123a7fcdf5c6423c49dc
