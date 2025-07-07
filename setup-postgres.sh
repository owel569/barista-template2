#!/bin/bash

# Configuration PostgreSQL pour migration Replit
POSTGRES_DIR="/tmp/postgres_data"
POSTGRES_PORT="5432"
POSTGRES_USER="postgres"
POSTGRES_DB="barista_cafe"

# Création du répertoire des données
mkdir -p "$POSTGRES_DIR"

# Initialisation si nécessaire
if [ ! -f "$POSTGRES_DIR/PG_VERSION" ]; then
    echo "Initialisation de PostgreSQL..."
    initdb -D "$POSTGRES_DIR" --auth-local=trust --auth-host=trust
fi

# Configuration PostgreSQL
echo "port = $POSTGRES_PORT" >> "$POSTGRES_DIR/postgresql.conf"
echo "listen_addresses = '*'" >> "$POSTGRES_DIR/postgresql.conf"
echo "unix_socket_directories = '/tmp'" >> "$POSTGRES_DIR/postgresql.conf"

# Démarrage du serveur
echo "Démarrage PostgreSQL..."
pg_ctl -D "$POSTGRES_DIR" -l "$POSTGRES_DIR/postgres.log" start -w -o "-p $POSTGRES_PORT"

# Attente du démarrage
sleep 3

# Création de la base de données
echo "Création de la base de données..."
createdb -h localhost -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB"

# Export des variables d'environnement
export DATABASE_URL="postgresql://$POSTGRES_USER@localhost:$POSTGRES_PORT/$POSTGRES_DB"

echo "PostgreSQL configuré avec succès!"
echo "DATABASE_URL=$DATABASE_URL"