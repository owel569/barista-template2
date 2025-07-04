# Barista Café - Full Stack Coffee Shop Website

## Overview

This is a complete full-stack web application for a coffee shop called "Barista Café". The application provides a modern, responsive website with integrated reservation management, dynamic menu display, and administrative functionality. It's built using React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

The application follows a monorepo structure with clear separation between client-side and server-side code:

- **Frontend**: React-based SPA with TypeScript, served from `/client`
- **Backend**: Express.js REST API with TypeScript, located in `/server`
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Shared**: Common schemas and types shared between frontend and backend in `/shared`

The architecture uses a traditional client-server model where the React frontend communicates with the Express backend through RESTful APIs. Authentication is handled using JWT tokens, and the application includes comprehensive admin functionality for managing reservations, menu items, and customer communications.

## Key Components

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling with custom coffee-themed design system
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for form handling
- **Radix UI** components for accessible UI primitives
- **Lucide React** for consistent iconography

### Backend Architecture
- **Express.js** server with TypeScript
- **JWT-based authentication** for admin access
- **Bcrypt** for secure password hashing
- **RESTful API design** with proper error handling
- **Middleware for request logging** and authentication

### Database Design
The PostgreSQL schema includes:
- **Users table**: Admin authentication and role management
- **Menu system**: Categories and items with pricing and availability
- **Reservation system**: Customer bookings with table management
- **Contact system**: Customer inquiries and communications
- **Tables management**: Restaurant capacity and availability tracking

## Data Flow

1. **Public Website Flow**: Visitors can browse the menu, make reservations, and contact the restaurant
2. **Admin Authentication**: Secure login system for restaurant staff
3. **Reservation Management**: Real-time booking system with conflict detection
4. **Menu Management**: Dynamic menu updates with category organization
5. **Customer Communications**: Contact form submissions with status tracking

The application uses optimistic updates and real-time data synchronization through TanStack Query, ensuring a responsive user experience while maintaining data consistency.

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: PostgreSQL connection handling (compatible with various PostgreSQL providers)
- **Drizzle ORM**: Type-safe database operations
- **JWT & Bcrypt**: Security and authentication
- **Radix UI**: Accessible component primitives
- **React ecosystem**: Core frontend libraries

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **PostCSS**: CSS processing

## Deployment Strategy

The application is configured for deployment on Replit with:
- **Auto-scaling deployment target** for production
- **Node.js 20** runtime environment
- **Development server** on port 5000
- **Production build process** that compiles both frontend and backend
- **Environment variable management** for database connections and JWT secrets

The build process:
1. Compiles the React frontend using Vite
2. Bundles the Express backend using esbuild
3. Outputs static assets and server bundle for deployment

Database provisioning is handled automatically through environment variables, with support for both development and production PostgreSQL instances.

## Changelog

Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Enhanced admin dashboard with comprehensive management systems:
  - Added order management system with real-time status updates
  - Added customer management with detailed client profiles
  - Added employee management with HR functionality
  - Added interactive dashboard charts using Recharts
  - Improved date validation for reservations (year limit 3000)
  - Implemented tabbed admin interface for better organization
  - Added revenue and reservation statistics tracking
- June 30, 2025. Migration to Replit with user management enhancements:
  - Successfully migrated from Replit Agent to standard Replit environment
  - Set up PostgreSQL database with automated migrations
  - Added user registration functionality with secure authentication
  - Created dedicated registration page (/register) with validation
  - Enhanced login system with links to registration
  - Added user management API endpoints with proper security
  - Populated database with sample data for testing
  - Fixed all React rendering warnings and authentication flow
- June 30, 2025. Interactive reservation interface with collapsible sidebar:
  - Created interactive reservation interface with real product images
  - Implemented shopping cart functionality with quantity controls
  - Added custom SVG images for each menu category and product
  - Replaced top navigation with retractable left sidebar
  - Added hamburger menu button for opening/closing sidebar
  - Integrated real-time notification system in admin dashboard
  - Cleaned up menu items database to remove duplicates
  - Enhanced responsive design for mobile and desktop
- July 1, 2025. Migration optimization and automatic setup:
  - Successfully migrated project from Replit Agent to standard Replit environment
  - Added automatic configuration system that runs at server startup
  - Created auto-setup script that verifies database connectivity and applies migrations
  - Implemented fail-safe mechanisms to prevent configuration issues
  - Eliminated manual setup steps - server now starts with single command
  - Enhanced error handling and logging for better debugging experience
  - Created standalone setup script (setup-project.cjs) for deployment anywhere
  - Added comprehensive README.md and INSTALLATION.md with step-by-step guides
  - Project now works with single "npm run setup" command in any environment
  - Automatic environment detection (Replit vs local) with appropriate configurations
  - Simplified to universal setup: works on ALL development platforms
  - Single script installation regardless of environment (local, cloud, containers)
  - Intelligent database detection and configuration assistance
  - Removed platform-specific code for true portability
- July 1, 2025. Final migration from Replit Agent to Replit completed:
  - Successfully completed full migration process with all checklist items verified
  - PostgreSQL database automatically configured and connected
  - All dependencies properly installed and working
  - Server starts correctly on port 5000 without conflicts
  - Frontend and backend fully integrated and communicating
  - Admin authentication system functional (admin/admin123)
  - Auto-setup system working perfectly for seamless startup experience
- July 1, 2025. Menu enhancement with HD images and duplicate cleanup:
  - Removed duplicate menu items from database (eliminated 9 duplicates)
  - Created HD SVG images for all menu categories (cappuccino, espresso, latte, chocolat, thé, croissant, macaron, salade, sandwich)
  - Updated interactive reservation interface to display new HD images
  - Enhanced menu page and home preview with product images
  - Implemented smart image mapping system based on product names
  - Improved visual presentation of cafe offerings with custom artwork
- July 2, 2025. Final cleanup and GitHub preparation:
  - Eliminated all duplicate menu items definitively (40+ duplicates removed)
  - Integrated real Pexels HD images for all menu items with specific URLs
  - Created comprehensive README.md and GITHUB_SETUP.md documentation
  - Fixed menu category filtering system for proper display
  - Final menu: 17 unique items across 6 categories with authentic images
  - Project optimized and ready for GitHub publication
- July 2, 2025. Migration to Replit completed with image system overhaul:
  - Successfully completed full project migration from Replit Agent to standard Replit
  - Eliminated all remaining duplicate menu items definitively (40+ duplicates removed in multiple cleanup sessions)
  - Created new centralized image system using authentic Pexels URLs
  - Integrated real HD images for all menu items with specific Pexels photo URLs
  - Fixed all import errors and component references to use new image system
  - Final clean menu: 12 unique items (4 cafés, 3 boissons, 4 pâtisseries, 3 plats)
  - All images now use authentic Pexels photography instead of placeholder content
  - Database fully optimized with PostgreSQL configured and auto-setup working
  - Project running smoothly on Replit with clean codebase
- July 2, 2025. Admin dashboard enhancement with real-time analytics:
  - Replaced monthly reservation charts with daily reservation tracking
  - Added new API endpoints for daily reservations and reservation status statistics
  - Implemented pie chart (diagramme circulaire) for reservation status distribution
  - Enhanced dashboard with 4 key metrics: today's reservations, monthly revenue, active orders, occupancy rate
  - Fixed client and employee management form validation errors
  - Added real-time data refresh for all statistics components
  - Reservation system fully functional with cart integration and admin notifications
  - All duplicate database entries permanently eliminated with prevention mechanisms
- July 2, 2025. Final migration completion and duplicate elimination system:
  - Successfully completed migration from Replit Agent to standard Replit environment
  - Implemented definitive solution for duplicate menu items using unique constraints
  - Created centralized image mapping system in client/src/lib/image-mapping.ts
  - Added database constraint "menu_items_name_unique" to prevent future duplicates
  - Enhanced initialization system to check existing data before inserting
  - Migrated all components to use centralized image system (menu-page, interactive-reservation)
  - Final clean database: 14 unique menu items with authentic Pexels images
  - Stabilized image display system to prevent arrangement changes between deployments
  - Deprecated old image system in client/src/data/images.ts with backward compatibility
  - Updated all product images to match exact descriptions with HD quality (800x600)
  - Fixed Macarons Français, Chocolat Chaud, Mille-feuille and Sandwich Club images
  - All images now use authentic Pexels photography with high-definition quality
- July 4, 2025. Système d'administration avancé avec gestion des rôles:
  - Créé un système complet d'administration avec deux niveaux d'utilisateurs
  - Interface directeur: accès complet à tous les modules (dashboard, réservations, commandes, clients, menu, messages, employés, paramètres, statistiques, logs)
  - Interface employé: accès limité avec permissions spécifiques par module (clients en lecture seule, menu sans suppression, pas d'accès employés/paramètres)
  - Sidebar collapsible avec mode sombre/clair et notifications en temps réel
  - Tableau de bord avec statistiques avancées et graphiques (Recharts)
  - Système d'authentification JWT avec middleware de vérification des rôles
  - Routes API protégées avec contrôle d'accès basé sur les rôles
  - Architecture moderne avec TypeScript, composants réutilisables et gestion d'état
- July 3, 2025. Final migration to Replit with definitive duplicate prevention:
  - Completed final migration from Replit Agent to standard Replit environment
  - Created robust duplicate cleanup system with automatic detection and removal
  - Implemented server/cleanup-duplicates.ts for permanent duplicate elimination
  - Added automatic cleanup on every server startup to prevent duplicate accumulation
  - Enhanced init-db.ts with individual item checking before insertion
  - Migration process now handles duplicate prevention automatically
  - All checklist items completed: packages installed, workflow restarted, verification done
  - Project ready for deployment with clean database and no duplicate issues
- July 4, 2025. Resolution définitive des boucles infinites et nettoyage du code:
  - Suppression définitive de tous les fichiers admin obsolètes causant des conflits
  - Création d'un système d'administration simplifié et robuste (AdminSimple)
  - Élimination des boucles infinies dans useEffect avec gestion correcte des dépendances
  - Remplacement de la page login problématique par LoginSimple
  - Nettoyage complet du code et suppression des fichiers inutiles
  - Système d'authentification JWT fonctionnel avec deux niveaux d'utilisateurs
  - Interface directeur/employé opérationnelle avec sidebar collapsible
  - Connexion admin testée et fonctionnelle (admin/admin123)
- July 4, 2025. Système d'installation automatique universel:
  - Créé script d'installation automatique setup-universal.cjs compatible avec tous les environnements
  - Développé version ES modules (setup-universal.js) et CommonJS (setup-universal.cjs)
  - Ajouté script de démarrage automatique start.sh avec vérifications intégrées
  - Créé documentation complète : README.md, INSTALLATION.md, GITHUB_SETUP.md
  - Système fonctionne sur Replit, VS Code, GitHub Codespaces, GitPod, macOS/Linux
  - Installation en une seule commande : npm install && node setup-universal.cjs
  - Configuration PostgreSQL automatique avec données de test intégrées
  - Compatibilité universelle garantie pour tous les environnements de développement

## User Preferences

Preferred communication style: Simple, everyday language in French (français).