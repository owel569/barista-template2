#!/bin/bash

# Script de démarrage automatique pour Barista Café
# Ce script assure que PostgreSQL fonctionne toujours automatiquement

echo "🎯 Démarrage automatique de Barista Café..."

# Démarrer PostgreSQL automatiquement
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "🔧 Démarrage de PostgreSQL..."
    bash scripts/start-postgres.sh
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors du démarrage de PostgreSQL"
        exit 1
    fi
else
    echo "✅ PostgreSQL déjà en cours d'exécution"
fi

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
NODE_ENV=development tsx server/index.ts