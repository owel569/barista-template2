# Architecture de Sécurité - Barista Café

## Vue d'ensemble de la sécurité implémentée

### 1. Authentification et Autorisation
- **JWT avec expiration (24h)** pour l'authentification
- **Hiérarchie des rôles** : client < employee < manager < admin < superadmin
- **Middleware d'authentification** obligatoire pour toutes les routes protégées
- **Validation des tokens** avec gestion des erreurs appropriée

### 2. Contrôle d'accès par rôle (RBAC)
```
Routes publiques :
- GET /api/menu/* (consultation du menu)
- POST /api/auth/login (connexion)  
- POST /api/auth/register (inscription)
- GET /api/health (status de l'API)

Routes Employee+ :
- GET /api/orders/* (voir les commandes)
- PATCH /api/orders/:id/status (modifier statut commande)
- GET /api/dashboard/* (tableau de bord)
- GET /api/tables/* (gestion des tables)
- GET /api/delivery/* (livraisons)

Routes Manager+ :
- GET /api/admin/settings (voir paramètres)
- POST /api/menu/* (ajouter articles menu)
- PUT /api/menu/* (modifier articles menu)
- GET /api/analytics/* (statistiques)
- GET /api/events/* (événements)

Routes Admin+ :
- PUT /api/admin/settings (modifier paramètres)
- POST /api/admin/users (créer utilisateurs)
- DELETE /api/menu/* (supprimer articles menu)
- Toutes les routes /api/admin/*
```

### 3. Validation et Sécurisation des données
- **Validation Zod** pour tous les inputs utilisateur
- **Sanitization** automatique des données d'entrée (suppression HTML/XSS)
- **Rate Limiting** :
  - Login: 5 tentatives par 15 minutes
  - Register: 3 tentatives par heure
- **Validation des Content-Types**
- **Limitation de la taille des payloads** (1MB max)

### 4. Schémas de validation stricts
```typescript
LoginSchema: username (3-50 chars), password (6-100 chars)
RegisterSchema: username (3-50), email valide, password (8-100)  
OrderSchema: customerName, items validés, quantités limitées (1-10)
MenuItemSchema: name, description, prix positif, catégorie
SettingsSchema: validation téléphone français, email, horaires
```

### 5. Middleware de sécurité appliqués globalement
- **validateSecurity**: Validation Content-Type et taille payload
- **sanitizeInput**: Nettoyage automatique des entrées utilisateur
- **authenticateUser**: Vérification des tokens JWT
- **requireRoleHierarchy**: Contrôle d'accès hiérarchique

### 6. Gestion des erreurs sécurisée
- Messages d'erreur standardisés (pas de leak d'information)
- Logging des tentatives d'accès non autorisées
- Codes de statut HTTP appropriés (401, 403, 429)

### 7. Protection contre les attaques communes
- **Brute Force**: Rate limiting sur login
- **XSS**: Sanitization des inputs
- **Injection**: Validation stricte des données
- **CSRF**: Validation Content-Type JSON obligatoire
- **DoS**: Limitation taille payload et rate limiting

## Routes sécurisées par niveau d'accès

### Public (aucune authentification)
- `GET /api/menu/*` - Menu consultation
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription

### Employee (authentification requise)
- `GET /api/orders/*` - Consultation commandes
- `PATCH /api/orders/:id/status` - Modification statut
- `GET /api/dashboard/*` - Tableau de bord

### Manager (employee + privilèges étendus)
- `GET /api/admin/settings` - Consultation paramètres
- `POST /api/menu/*` - Ajout articles
- `PUT /api/menu/*` - Modification articles
- `GET /api/analytics/*` - Statistiques

### Admin (manager + contrôle total)
- `PUT /api/admin/settings` - Modification paramètres
- `POST /api/admin/users` - Création utilisateurs
- `DELETE /api/menu/*` - Suppression articles
- Toutes les routes admin

## Recommandations de sécurité

### Immédiat
- [x] Authentification JWT implémentée
- [x] Hiérarchie des rôles configurée
- [x] Validation des données stricte
- [x] Rate limiting sur les routes sensibles
- [x] Sanitization des inputs

### Prochaines étapes (base de données)
- [ ] Hashage des mots de passe avec bcrypt
- [ ] Stockage sécurisé des utilisateurs
- [ ] Sessions avec expiration
- [ ] Logs d'audit des actions

### Production
- [ ] HTTPS obligatoire
- [ ] Variables d'environnement sécurisées  
- [ ] Monitoring des tentatives d'intrusion
- [ ] Sauvegarde chiffrée des données