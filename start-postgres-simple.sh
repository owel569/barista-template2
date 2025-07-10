#!/bin/bash

# Script pour démarrer PostgreSQL de manière simple
echo "🔧 Configuration PostgreSQL automatique..."

# Nettoyer les anciens fichiers
rm -rf /tmp/postgres_data /tmp/postgres_run /tmp/postgres.log

# Créer les répertoires
mkdir -p /tmp/postgres_data /tmp/postgres_run

# Initialiser PostgreSQL
initdb -D /tmp/postgres_data --auth-local=trust --auth-host=trust --username=postgres --encoding=UTF8 --locale=C

# Démarrer PostgreSQL en arrière-plan
postgres -D /tmp/postgres_data -p 5432 -k /tmp/postgres_run > /tmp/postgres.log 2>&1 &

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
sleep 5

# Tester la connexion
for i in {1..10}; do
  if pg_isready -h localhost -p 5432; then
    echo "✅ PostgreSQL prêt"
    break
  fi
  echo "⏳ Tentative $i/10..."
  sleep 2
done

# Créer la base de données
createdb -h localhost -p 5432 -U postgres barista_cafe 2>/dev/null || echo "Base de données existante"

echo "✅ PostgreSQL configuré sur postgresql://postgres@localhost:5432/barista_cafe"