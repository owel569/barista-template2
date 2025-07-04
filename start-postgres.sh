#!/bin/bash

# Script de démarrage PostgreSQL pour Replit
set -e

POSTGRES_DIR="/tmp/postgres_data"
POSTGRES_SOCK="/tmp/postgres_run"
POSTGRES_USER="postgres"
POSTGRES_DB="barista_cafe"

echo "🔧 Configuration PostgreSQL pour Replit..."

# Arrêt des processus existants
pkill -f postgres || true

# Nettoyage des anciens fichiers
rm -rf "$POSTGRES_DIR" "$POSTGRES_SOCK"

# Création des répertoires
mkdir -p "$POSTGRES_DIR" "$POSTGRES_SOCK"

# Initialisation de PostgreSQL
echo "🗄️  Initialisation de PostgreSQL..."
initdb -D "$POSTGRES_DIR" --auth-local=trust --auth-host=trust -U "$POSTGRES_USER" -A trust

# Démarrage de PostgreSQL
echo "🚀 Démarrage de PostgreSQL..."
pg_ctl -D "$POSTGRES_DIR" -l "$POSTGRES_DIR/postgres.log" -o "-k $POSTGRES_SOCK" start -w

# Attente du démarrage
sleep 2

# Création de la base de données
echo "📊 Création de la base de données..."
createdb -h "$POSTGRES_SOCK" -U "$POSTGRES_USER" "$POSTGRES_DB" || echo "Base de données déjà existante"

# Configuration de la variable d'environnement
export DATABASE_URL="postgresql://$POSTGRES_USER@/$POSTGRES_DB?host=$POSTGRES_SOCK"

echo "✅ PostgreSQL configuré avec succès!"
echo "   Base de données : $POSTGRES_DB"
echo "   Socket : $POSTGRES_SOCK"
echo "   DATABASE_URL : $DATABASE_URL"

# Gardez le processus en vie
tail -f "$POSTGRES_DIR/postgres.log"