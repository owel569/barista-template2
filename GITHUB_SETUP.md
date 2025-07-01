# 📱 Configuration GitHub - Barista Café

## 🔥 Installation Ultra-Rapide

### Sur GitHub Codespaces
```bash
# Une seule commande dans le terminal
node setup-project.cjs
```

### En Local depuis GitHub
```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/barista-cafe.git
cd barista-cafe

# 2. Configuration automatique
node setup-project.cjs
```

## 🗄️ Base de Données (Options Gratuites)

### Option 1: Neon Database (Recommandée)
1. Allez sur https://neon.tech
2. Créez un compte gratuit
3. Créez une nouvelle base de données
4. Copiez l'URL de connexion

### Option 2: Supabase
1. Allez sur https://supabase.com
2. Créez un projet gratuit
3. Obtenez l'URL PostgreSQL

### Option 3: Railway (Alternative)
1. Allez sur https://railway.app
2. Connectez avec GitHub
3. Créez une base PostgreSQL

## ⚙️ Configuration Variables

### GitHub Codespaces
1. Allez dans **Settings > Codespaces**
2. Ajoutez le secret `DATABASE_URL`
3. Valeur: `postgresql://user:pass@host:port/db`

### Local (.env)
```bash
# Le script crée automatiquement le fichier .env
# Modifiez juste DATABASE_URL avec votre vraie URL
```

## 🚀 Première Utilisation

Après configuration:
```bash
npm run dev
```

Votre site sera accessible sur:
- **Local**: http://localhost:5000
- **Codespaces**: Port forwarding automatique

## 👤 Connexion Admin

- URL: `/login`
- Username: `admin`
- Password: `admin123`

## 📁 Structure du Repository

```
votre-repo/
├── .env.example         # Template à copier
├── .gitignore          # Fichiers ignorés par Git
├── setup-project.cjs   # Script d'installation
├── GITHUB_SETUP.md     # Ce guide
├── package.json        # Dépendances NPM
└── [reste du code...]
```

## 🔄 Workflow GitHub

### Premier clone
```bash
git clone <repo-url>
cd <repo-name>
node setup-project.cjs    # Configuration auto
npm run dev              # Démarrage
```

### Développement quotidien
```bash
git pull                 # Récupérer les changements
npm run dev             # Développer
git add .               # Préparer changements
git commit -m "message" # Committer
git push                # Envoyer sur GitHub
```

### Partage avec équipe
1. Partagez le repository GitHub
2. Chaque développeur lance: `node setup-project.cjs`
3. Configuration automatique pour tous

## 🆘 Dépannage

### "DATABASE_URL must be set"
```bash
# Vérifiez la configuration
node setup-project.cjs
```

### Problème de permissions
```bash
chmod +x setup-project.cjs
node setup-project.cjs
```

### Erreur npm
```bash
rm -rf node_modules package-lock.json
npm install
node setup-project.cjs
```

## ✅ Résultat Final

Une fois configuré, votre projet:
- ✅ Fonctionne sur n'importe quelle machine
- ✅ Se configure automatiquement  
- ✅ Marche sur GitHub Codespaces
- ✅ Installation en 1 commande
- ✅ Prêt pour le développement collaboratif