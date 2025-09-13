# 🔐 Guide de Connexion - Barista Café

## Les 3 Rôles Staff Disponibles

Votre système Barista Café utilise 3 niveaux de rôles pour le personnel :

### 🎯 **DIRECTEUR** - Accès Complet
- **Niveau** : Le plus élevé
- **Permissions** : Accès total à toutes les fonctionnalités
- **Peut gérer** : Utilisateurs, menu, réservations, statistiques, configuration système

### 👨‍💼 **GÉRANT** - Gestion Intermédiaire  
- **Niveau** : Intermédiaire
- **Permissions** : Gestion opérationnelle
- **Peut gérer** : Menu, réservations, clients, commandes, statistiques de base

### 👩‍💻 **EMPLOYÉ** - Accès de Base
- **Niveau** : Standard
- **Permissions** : Opérations quotidiennes
- **Peut gérer** : Réservations, commandes, consultation du menu

---

## 🚀 Comment Se Connecter

### 1. Accéder à la Page de Connexion
- Ouvrez votre navigateur sur : `http://localhost:5000/login`
- Vous verrez la page de connexion avec les rôles affichés

### 2. Saisir Vos Identifiants
```
Email : votre-email@example.com
Mot de passe : (minimum 8 caractères avec complexité)
```

**Règles de mot de passe :**
- Au moins 8 caractères
- Une majuscule et une minuscule
- Un chiffre
- Un caractère spécial

### 3. Messages de Bienvenue Personnalisés

Après connexion réussie, vous verrez :
- **Directeur** : "Bienvenue Directeur ! Accès complet activé."
- **Gérant** : "Bienvenue Gérant ! Accès de gestion activé."
- **Employé** : "Bienvenue ! Accès employé activé."

---

## 👤 Création de Comptes

### Pour créer un nouveau compte utilisateur :

1. **Via l'interface Admin** (si vous êtes directeur/gérant)
   - Connectez-vous avec un compte directeur ou gérant
   - Allez dans "Gestion Utilisateurs"
   - Cliquez "Ajouter un utilisateur"
   - Choisissez le rôle approprié

2. **Via l'API** (développement)
   ```javascript
   POST /api/auth/register
   {
     "email": "nouvel-employe@cafe.com",
     "password": "MotDePasse123!",
     "role": "employe"  // ou "gerant" ou "directeur"
   }
   ```

---

## 🔒 Hiérarchie des Permissions

```
DIRECTEUR (accès total)
    ↓
GÉRANT (gestion opérationnelle)
    ↓
EMPLOYÉ (opérations de base)
    ↓
CUSTOMER (public)
```

**Règle importante :** Un rôle supérieur peut toujours accéder aux fonctionnalités des rôles inférieurs.

---

## 🛠️ Dépannage

### Si vous ne pouvez pas vous connecter :

1. **Vérifiez vos identifiants**
   - Email correct et complet
   - Mot de passe respectant les règles de complexité

2. **Problème de mot de passe**
   - Le champ se vide automatiquement en cas d'erreur
   - Assurez-vous d'utiliser un mot de passe fort

3. **Compte inexistant**
   - Demandez à un directeur de créer votre compte
   - Vérifiez que le rôle est bien attribué

4. **Problème technique**
   - Vérifiez que le serveur fonctionne (`http://localhost:5000`)
   - Consultez les logs pour plus d'informations

---

## 📞 Support

En cas de problème persistant :
- Contactez votre administrateur système
- Vérifiez les logs serveur pour plus de détails
- Le serveur doit être accessible sur port 5000

---

**Note :** Ce système est sécurisé et toutes les actions sont tracées selon votre rôle.