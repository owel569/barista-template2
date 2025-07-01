# 🚀 Installation Rapide - Barista Café

## ⚡ Installation en 2 étapes

### 1️⃣ Télécharger et installer
```bash
# Cloner ou télécharger le projet
# Puis dans le dossier du projet:
npm run setup
```

### 2️⃣ Lancer le projet
```bash
npm run dev
```

## 🗄️ Configuration Base de Données

### Sur Replit (Automatique)
✅ La base de données se configure automatiquement

### Sur d'autres plateformes
Créez une variable d'environnement `DATABASE_URL`:
```
DATABASE_URL=postgresql://username:password@host:port/database
```

## 🎯 C'est tout !

Le script `npm run setup` fait tout automatiquement:
- ✅ Installe les dépendances
- ✅ Configure la base de données 
- ✅ Crée les tables nécessaires
- ✅ Initialise les données de test
- ✅ Crée le compte admin

## 👤 Connexion Admin

- **URL**: `/login`
- **Nom d'utilisateur**: `admin`
- **Mot de passe**: `admin123`

---

**⚠️ Problème?** Consultez le `README.md` complet pour plus de détails.