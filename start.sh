#!/bin/bash
# Script de démarrage universel pour Barista Café

echo "🚀 Démarrage de Barista Café..."

# Vérifier si PostgreSQL est disponible
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL n'est pas installé"
    echo "Consultez le README.md pour les instructions d'installation"
    exit 1
fi

# Exécuter les migrations si nécessaire
if [ ! -f ".migrations-done" ]; then
    echo "🗄️  Exécution des migrations..."
    npm run db:push
    touch .migrations-done
fi

# Démarrer l'application
echo "🎉 Démarrage de l'application..."
npm run dev
