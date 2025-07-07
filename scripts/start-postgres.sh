#!/bin/bash

# Script de démarrage automatique PostgreSQL pour Replit
# Ce script assure que PostgreSQL fonctionne toujours, même après redémarrage

echo "🔧 Démarrage automatique PostgreSQL..."

# Variables de configuration
POSTGRES_DATA_DIR="/tmp/postgres_data"
POSTGRES_SOCKET_DIR="/tmp/postgres_run"
POSTGRES_LOG_FILE="/tmp/postgres.log"
POSTGRES_PORT="5432"
DATABASE_NAME="barista_cafe"

# Fonction pour créer les répertoires nécessaires
create_directories() {
    mkdir -p "$POSTGRES_DATA_DIR"
    mkdir -p "$POSTGRES_SOCKET_DIR"
    mkdir -p "$(dirname "$POSTGRES_LOG_FILE")"
}

# Fonction pour initialiser PostgreSQL
initialize_postgres() {
    if [ ! -f "$POSTGRES_DATA_DIR/PG_VERSION" ]; then
        echo "🗄️  Initialisation de PostgreSQL..."
        initdb -D "$POSTGRES_DATA_DIR" --auth-local=trust --auth-host=trust --username=runner
        if [ $? -eq 0 ]; then
            echo "✅ PostgreSQL initialisé"
        else
            echo "❌ Erreur lors de l'initialisation de PostgreSQL"
            exit 1
        fi
    fi
}

# Fonction pour démarrer PostgreSQL
start_postgres() {
    # Vérifier si PostgreSQL fonctionne déjà
    if pg_isready -h localhost -p $POSTGRES_PORT > /dev/null 2>&1; then
        echo "✅ PostgreSQL déjà en cours d'exécution"
        return 0
    fi

    echo "🚀 Démarrage de PostgreSQL..."
    
    # Démarrer PostgreSQL en arrière-plan
    postgres -D "$POSTGRES_DATA_DIR" \
             -k "$POSTGRES_SOCKET_DIR" \
             -p "$POSTGRES_PORT" \
             -F \
             -c log_statement=none \
             -c log_min_duration_statement=1000 \
             -c max_connections=20 \
             >> "$POSTGRES_LOG_FILE" 2>&1 &

    # Attendre que PostgreSQL soit prêt
    echo "⏳ Attente de PostgreSQL..."
    for i in {1..30}; do
        if pg_isready -h localhost -p $POSTGRES_PORT > /dev/null 2>&1; then
            echo "✅ PostgreSQL prêt"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ PostgreSQL n'a pas démarré dans les temps"
    return 1
}

# Fonction pour créer la base de données
create_database() {
    echo "📊 Création de la base de données $DATABASE_NAME..."
    
    # Vérifier si la base de données existe
    if psql -h localhost -p $POSTGRES_PORT -U runner -lqt | cut -d \| -f 1 | grep -qw "$DATABASE_NAME"; then
        echo "ℹ️  Base de données $DATABASE_NAME existe déjà"
    else
        createdb -h localhost -p $POSTGRES_PORT -U runner "$DATABASE_NAME"
        if [ $? -eq 0 ]; then
            echo "✅ Base de données $DATABASE_NAME créée"
        else
            echo "❌ Erreur lors de la création de la base de données"
            return 1
        fi
    fi
}

# Fonction principale
main() {
    create_directories
    initialize_postgres
    start_postgres
    
    if [ $? -eq 0 ]; then
        create_database
        echo "🎉 PostgreSQL configuré et prêt!"
        echo "📋 Configuration:"
        echo "   - Port: $POSTGRES_PORT"
        echo "   - Base de données: $DATABASE_NAME"
        echo "   - Utilisateur: runner"
        echo "   - Socket: $POSTGRES_SOCKET_DIR"
        echo "   - Logs: $POSTGRES_LOG_FILE"
        return 0
    else
        echo "❌ Erreur lors du démarrage de PostgreSQL"
        return 1
    fi
}

# Exécuter le script
main "$@"