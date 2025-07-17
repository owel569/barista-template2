#!/bin/bash
# Script de démarrage automatique Barista Café

echo "🚀 Démarrage Barista Café - Mode Production"
echo "🗄️ Base de données: sqlite"

# Créer le répertoire de backup si nécessaire
mkdir -p ./backups

# Démarrer l'application
npm run dev
