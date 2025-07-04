# Installation Automatique - Barista Café

## 🚀 Installation Rapide (Universel)

### Nouvelle Installation
```bash
git clone [votre-repo]
cd barista-cafe
npm install
node setup-universal.js  # Configuration automatique
npm run dev
```

### Démarrage Automatique
```bash
./start.sh
# Ou simplement
npm run dev
```

## 🔧 Configuration Automatique

Le projet se configure automatiquement sur tous les environnements :

- **✅ Replit** - Configuration instantanée
- **✅ VS Code** - Setup automatique
- **✅ GitHub Codespaces** - Installation automatique
- **✅ GitPod** - Configuration automatique  
- **✅ Local** (macOS/Linux) - Installation PostgreSQL automatique
- **⚠️ Windows** - Nécessite installation manuelle de PostgreSQL

## 📊 Base de Données

PostgreSQL se configure automatiquement avec :
- 14 éléments de menu pré-configurés
- Comptes utilisateurs (admin/employe)
- Tables et relations complètes
- Images HD des produits

## 🔑 Identifiants par Défaut

**Administrateur (Directeur)**
- Nom d'utilisateur: `admin`
- Mot de passe: `admin123`
- Accès: Administration complète

**Employé**
- Nom d'utilisateur: `employe`
- Mot de passe: `employe123`
- Accès: Limité selon les permissions

## 🌐 Accès

Une fois démarré, accédez à :
- **Site public**: http://localhost:5000
- **Administration**: http://localhost:5000/admin
- **Interface employé**: http://localhost:5000/employe

## 🔄 Résolution des Problèmes

Si des problèmes surviennent, reconfigurez automatiquement :

```bash
node setup-universal.js
```

## 📁 Structure du Projet

```
barista-cafe/
├── client/          # Interface utilisateur React
├── server/          # API Express.js
├── shared/          # Schémas partagés
├── setup-universal.js  # Installation automatique
├── start.sh         # Démarrage automatique
└── .env             # Configuration générée automatiquement
```

## 🛠️ Développement

Pour développer sur le projet :

1. **Première fois** : `node setup-universal.js`
2. **Démarrage** : `npm run dev` ou `./start.sh`
3. **Base de données** : Automatiquement gérée

## 📱 Fonctionnalités

- **Site vitrine** avec menu interactif
- **Système de réservation** avec panier
- **Administration complète** pour directeurs
- **Interface employé** avec permissions limitées
- **Gestion des commandes** en temps réel
- **Statistiques** et tableaux de bord
- **Images HD** des produits café

## 🔒 Sécurité

- Authentification JWT
- Mots de passe hashés (bcrypt)
- Séparation des rôles utilisateur
- Protection des routes administratives

---

**Note**: Ce système d'installation automatique garantit que votre projet fonctionne immédiatement, quel que soit l'environnement de développement utilisé.