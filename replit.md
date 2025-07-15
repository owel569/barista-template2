# Barista Café - Système de Gestion de Restaurant

## Overview

Barista Café est un système de gestion de restaurant complet développé avec React, Node.js, Express, et PostgreSQL. Il propose une interface publique pour les clients et une interface d'administration complète pour la gestion du restaurant.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 avec TypeScript
- **Routing**: Wouter pour la navigation côté client
- **State Management**: React Query (TanStack Query) pour la gestion des données serveur
- **UI Components**: Shadcn/ui avec Radix UI primitives
- **Styling**: Tailwind CSS avec thème personnalisé café
- **Build Tool**: Vite avec support TypeScript

### Backend Architecture
- **Runtime**: Node.js avec TypeScript
- **Framework**: Express.js avec middleware personnalisé
- **Database ORM**: Drizzle ORM avec PostgreSQL
- **Authentication**: JWT avec bcrypt pour le hachage des mots de passe
- **WebSocket**: Support temps réel pour les notifications
- **API**: RESTful avec validation Zod

## Key Components

### Public Interface
- **Home Page**: Page d'accueil avec hero section et aperçu du menu
- **Menu**: Affichage des catégories et articles avec images
- **Reservation System**: Système de réservation interactif avec sélection de tables
- **Contact**: Formulaire de contact avec validation
- **Gallery**: Galerie d'images du restaurant

### Admin Interface
- **Dashboard**: Tableau de bord avec statistiques en temps réel
- **User Management**: Gestion des utilisateurs avec rôles (directeur/employé)
- **Menu Management**: CRUD complet pour les catégories et articles
- **Reservation Management**: Gestion des réservations avec statuts
- **Customer Management**: Gestion de la clientèle avec programme de fidélité
- **Order Management**: Suivi des commandes et livraisons
- **Analytics**: Graphiques et rapports avec Recharts

### Authentication & Authorization
- **JWT Authentication**: Tokens sécurisés pour l'authentification
- **Role-based Access**: Permissions différenciées directeur/employé
- **Protected Routes**: Middleware de protection des routes admin
- **Session Management**: Gestion automatique des sessions

## Data Flow

### Database Schema
- **Users**: Authentification admin avec rôles
- **Customers**: Gestion de la clientèle
- **Menu Categories & Items**: Structure hiérarchique du menu
- **Tables**: Gestion des tables avec capacité et statut
- **Reservations**: Système de réservation avec items
- **Orders**: Commandes avec suivi de statut
- **Activity Logs**: Traçabilité des actions
- **Permissions**: Contrôle d'accès granulaire

### API Structure
- **Public APIs**: `/api/menu`, `/api/contact`, `/api/reservations`
- **Admin APIs**: `/api/admin/*` avec authentification requise
- **Real-time**: WebSocket pour notifications en temps réel
- **Statistics**: APIs dédiées pour les métriques et graphiques

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Query
- **UI Libraries**: Radix UI, Tailwind CSS, Lucide Icons
- **Backend**: Express, PostgreSQL, Drizzle ORM
- **Authentication**: JWT, bcrypt
- **Validation**: Zod pour validation côté client et serveur
- **Charts**: Recharts pour les graphiques d'analyse

### Development Tools
- **TypeScript**: Typage statique complet
- **Vite**: Build tool avec HMR
- **ESLint**: Linting du code
- **Prettier**: Formatage automatique

## Deployment Strategy

### Database Configuration
- **PostgreSQL**: Base de données principale avec auto-configuration
- **Migrations**: Système de migration Drizzle automatique
- **Seed Data**: Données d'exemple pour les tests

### Environment Setup
- **Development**: Configuration automatique avec Replit
- **Production**: Variables d'environnement pour la configuration
- **Build Process**: Compilation TypeScript + bundling Vite

### Key Features
- **Auto-Setup**: Configuration automatique PostgreSQL
- **Real-time Updates**: WebSocket pour notifications
- **Responsive Design**: Interface adaptative mobile/desktop
- **Multilingual Support**: Système i18n intégré
- **Image Management**: Gestion d'images avec fallbacks
- **Error Handling**: Gestion globale des erreurs

### Testing & Quality
- **Type Safety**: TypeScript strict mode
- **API Testing**: Tests intégrés pour les endpoints
- **Form Validation**: Validation client/serveur avec Zod
- **Performance**: Optimisations React Query et lazy loading

Le système est conçu pour être facilement extensible avec des modules additionnels comme la gestion des stocks, les promotions, et l'analyse avancée.

## Recent Changes: Latest modifications with dates

### 2025-07-15: Migration vers Replit
✓ Migration complète de Replit Agent vers Replit environnement
✓ Configuration PostgreSQL automatique avec variables d'environnement
✓ Génération et application des migrations de base de données
✓ Résolution des problèmes d'images - système IMAGE_MAPPING intégré
✓ Correction des noms d'éléments de menu pour correspondre au mapping existant
✓ Ajout de la propriété category dans l'API pour améliorer l'affichage des images
✓ Création des données de test initiales (admin, menu, tables, catégories)
✓ Vérification du fonctionnement complet des API endpoints
✓ Application fonctionnelle sur port 5000 avec système d'images opérationnel

### 2025-07-15: Système de gestion d'images scalable
✓ Création table menu_item_images pour gestion dynamique des images
✓ Développement ImageManager avec API complète (CRUD)
✓ Migration automatique de toutes les images IMAGE_MAPPING vers base de données
✓ Composant admin ImageManagement pour interface utilisateur
✓ Résolution des erreurs TypeScript avec types compatibles
✓ Support multi-images par élément avec image principale
✓ Système d'upload par URL, fichier ou génération automatique
✓ 20 images Pexels migrées avec succès en base de données
✓ Élimination de la dépendance externe à Pexels
✓ Interface backoffice pour gestion sans modification de code

### 2025-07-15: Migration complète vers Replit (après-midi)
✓ Configuration PostgreSQL native avec système de fallback
✓ Résolution des problèmes de connexion base de données
✓ Application fonctionnelle sur port 5000 avec données de test
✓ Système de stockage hybride avec fallback pour robustesse
✓ Configuration automatique .env avec variables d'environnement
✓ Migration réussie de Replit Agent vers environnement Replit
✓ Toutes les fonctionnalités du café (menu, réservations, admin) opérationnelles
✓ Base de données PostgreSQL configurée et connectée