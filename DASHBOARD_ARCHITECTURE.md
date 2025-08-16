
# Architecture des Dashboards - Barista Café

## 🎯 Vue d'ensemble
Votre application contient plusieurs dashboards avec des rôles spécifiques :

## 📊 Dashboards Principaux

### 1. Dashboard Admin Principal
**Fichier :** `client/src/components/admin/dashboard.tsx`
**Rôle :** Interface principale d'administration
**Utilisation :** Point d'entrée pour toutes les fonctions admin

### 2. Dashboard Général
**Fichier :** `client/src/components/dashboard/dashboard-main.tsx`
**Rôle :** Dashboard public/utilisateur
**Utilisation :** Vue d'ensemble pour les utilisateurs non-admin

### 3. Modules Spécialisés
**Fichiers :**
- `client/src/components/admin/modules/Dashboard.tsx` - Module IA
- `client/src/components/admin/modules/AnalyticsDashboard.tsx` - Module Analytics
- `client/src/components/admin/analytics-dashboard.tsx` - Analytics admin

## 🔄 Flux de Navigation Recommandé

```
AdminFinal.tsx 
    ↓
admin/dashboard.tsx (Hub principal)
    ↓
Modules spécialisés (selon le besoin)
```

## 🚨 Problèmes Identifiés
1. **Duplication :** Plusieurs fichiers analytics
2. **Confusion :** Noms similaires
3. **Import chaos :** Chemins d'accès multiples

## ✅ Solution Recommandée
Consolidation en 3 dashboards clairs :
1. **Main Dashboard** - Vue d'ensemble
2. **Admin Dashboard** - Gestion système
3. **Analytics Dashboard** - Données et rapports
