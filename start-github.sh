#!/bin/bash

# Script de démarrage pour GitHub Codespaces
echo "🚀 Démarrage Barista Café..."

# Vérifier si PostgreSQL est disponible
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL trouvé"
    
    # Essayer de démarrer PostgreSQL en mode utilisateur
    if [ -d "$HOME/.postgresql" ]; then
        echo "🗄️ Démarrage PostgreSQL utilisateur..."
        postgres -D $HOME/.postgresql -k $HOME/.postgresql_socket -p 5432 &
        sleep 3
        echo "✅ PostgreSQL démarré"
    fi
else
    echo "⚠️ PostgreSQL non disponible, utilisation de SQLite"
    if [ -f ".env.sqlite" ]; then
        cp .env.sqlite .env
        echo "✅ Configuration SQLite activée"
    fi
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Démarrer l'application
echo "🌟 Démarrage de l'application..."
npm run dev