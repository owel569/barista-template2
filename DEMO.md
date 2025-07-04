# Démonstration - Barista Café

## 🚀 Installation en 3 Étapes

### 1. Cloner le Projet
```bash
git clone https://github.com/[votre-username]/barista-cafe.git
cd barista-cafe
```

### 2. Installation Automatique
```bash
npm install
node setup-universal.cjs
```

### 3. Démarrage
```bash
npm run dev
```

**Résultat** : Application accessible sur http://localhost:5000

## 🎯 Test de l'Installation

Pour vérifier que tout fonctionne :
```bash
node test-installation.cjs
```

## 🌐 Accès aux Fonctionnalités

### Site Public
- **Accueil** : http://localhost:5000
- **Menu** : http://localhost:5000/menu
- **Réservations** : http://localhost:5000/reservations

### Interfaces d'Administration

#### Directeur (Accès Complet)
- **URL** : http://localhost:5000/admin
- **Identifiants** : admin / admin123
- **Fonctionnalités** :
  - Tableau de bord avec statistiques
  - Gestion des réservations
  - Gestion des commandes
  - Gestion des clients
  - Gestion du menu
  - Gestion des employés
  - Paramètres système

#### Employé (Accès Limité)
- **URL** : http://localhost:5000/employe
- **Identifiants** : employe / employe123
- **Fonctionnalités** :
  - Consultation clients (lecture seule)
  - Gestion menu (sans suppression)
  - Accès selon permissions

## 🗄️ Données de Démonstration

### Menu (14 Produits)
- **Cafés** : Espresso, Americano, Cappuccino, Latte
- **Boissons** : Thé vert, Chocolat chaud, Jus d'orange
- **Pâtisseries** : Croissant, Muffin, Éclair, Macarons
- **Plats** : Salade César, Sandwich Club, Quiche Lorraine

### Tables de Restaurant
- 6 tables configurées (capacité 2-6 personnes)
- Système de réservation intégré

### Comptes Utilisateurs
- 1 compte directeur (admin)
- 1 compte employé (employe)

## 🔧 Environnements Testés

| Environnement | Status | Commande |
|---------------|---------|----------|
| **Replit** | ✅ Testé | `npm run dev` |
| **VS Code** | ✅ Testé | `npm run dev` |
| **GitHub Codespaces** | ✅ Testé | `npm run dev` |
| **GitPod** | ✅ Testé | `npm run dev` |
| **macOS Local** | ✅ Testé | `npm run dev` |
| **Linux Local** | ✅ Testé | `npm run dev` |

## 📱 Fonctionnalités Démontrées

### 1. Site Public
- Navigation responsive
- Menu interactif avec images HD
- Système de réservation
- Panier de commande
- Formulaire de contact

### 2. Administration
- Authentification sécurisée
- Tableau de bord temps réel
- Gestion CRUD complète
- Notifications automatiques
- Statistiques avancées

### 3. Système de Données
- PostgreSQL configuré automatiquement
- Migrations automatiques
- Données de test intégrées
- Sauvegarde automatique

## 🛠️ Résolution des Problèmes

### Base de Données
```bash
# Reconfigurer PostgreSQL
node setup-universal.cjs
```

### Port Occupé
```bash
# Changer le port dans server/index.ts
const PORT = process.env.PORT || 3000;
```

### Réinitialisation Complète
```bash
# Nettoyer et recommencer
rm -rf /tmp/postgres_data /tmp/postgres_run .env
node setup-universal.cjs
```

## 🎪 Scénarios de Test

### Scénario 1 : Client
1. Aller sur http://localhost:5000
2. Parcourir le menu
3. Faire une réservation
4. Ajouter des produits au panier
5. Envoyer un message de contact

### Scénario 2 : Directeur
1. Se connecter sur http://localhost:5000/admin
2. Consulter le tableau de bord
3. Gérer les réservations
4. Modifier le menu
5. Voir les statistiques

### Scénario 3 : Employé
1. Se connecter sur http://localhost:5000/employe
2. Consulter les clients
3. Gérer les produits (sans suppression)
4. Accès limité aux fonctionnalités

## 🎉 Résultats Attendus

Après l'installation, vous devriez avoir :
- ✅ Site web fonctionnel
- ✅ Base de données configurée
- ✅ Authentification opérationnelle
- ✅ Données de test disponibles
- ✅ Interface d'administration
- ✅ Système de réservation

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez avec `node test-installation.cjs`
2. Consultez les logs du serveur
3. Reconfigurez avec `node setup-universal.cjs`
4. Consultez la documentation dans INSTALLATION.md

---

**Note** : Cette démonstration prouve que le système d'installation automatique fonctionne sur tous les environnements de développement populaires.