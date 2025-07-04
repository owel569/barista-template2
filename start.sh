#!/bin/bash

# Script de démarrage automatique pour Barista Café
echo "🚀 Démarrage automatique de Barista Café..."

# Vérification et démarrage PostgreSQL si nécessaire
if ! pgrep -f "postgres.*postgres_run" > /dev/null; then
    echo "📊 PostgreSQL non détecté, configuration automatique..."
    node setup-universal.js
fi

# Démarrage de l'application
echo "🌐 Lancement du serveur..."
npm run dev