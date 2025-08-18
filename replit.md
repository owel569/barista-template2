# Barista Café - Système de Gestion de Restaurant

## Overview
Barista Café is a comprehensive restaurant management system built with React, Node.js, Express, and PostgreSQL. It features both a public interface for customers to browse the menu and make reservations, and a robust administration interface for complete restaurant management. The system aims to streamline operations, enhance customer experience, and provide real-time insights for efficient business management, with ambitions for future extensibility into advanced modules like inventory and promotions.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
- **18 Aug 2025**: Migration terminée vers architecture unifiée Express + Vite
- Configuration serveur unique sur port 3000 résolvant les conflits de ports
- Intégration Vite middleware pour hot-reloading optimal sur Replit

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: React Query (TanStack Query) for server data management
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom café-themed design
- **Build Tool**: Vite with TypeScript support

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with custom middleware
- **Database ORM**: Drizzle ORM integrated with PostgreSQL
- **Authentication**: JWT with bcrypt for password hashing
- **WebSocket**: Real-time support for notifications
- **API**: RESTful API with Zod validation for robust data handling

### Key Features and Design Decisions
- **Public Interface**: Includes Home, Menu display with categories and items, interactive Reservation System, Contact form, and Image Gallery.
- **Admin Interface**: Provides a Dashboard with real-time statistics, User Management (roles: director/employee), comprehensive Menu Management (CRUD), Reservation Management with status tracking, Customer Management (with loyalty program), Order Management, and Analytics with Recharts.
- **Authentication & Authorization**: Utilizes JWT for secure tokens, role-based access control (director/employee), and protected routes.
- **Database Schema**: Structured to manage Users, Customers, Menu Categories & Items, Tables, Reservations, Orders, Activity Logs, and Permissions.
- **API Structure**: Divided into Public APIs and secure Admin APIs, with real-time capabilities via WebSocket for notifications and dedicated APIs for statistics.
- **UI/UX**: Focuses on a responsive design that adapts to mobile and desktop, a cafe-themed color scheme, and accessible UI components.
- **Technical Implementations**: Emphasizes type safety with TypeScript, client/server-side validation with Zod, and performance optimizations using React Query and lazy loading.
- **Deployment Strategy**: Designed for easy setup with auto-configuration for PostgreSQL, automated migrations, and environment-specific configurations for development and production.
- **Quality Assurance**: Implements strict TypeScript typing, API testing, and comprehensive form validation.

## External Dependencies

- **React Ecosystem**: React, React DOM, React Query
- **UI Libraries**: Radix UI, Shadcn/ui, Tailwind CSS, Lucide Icons
- **Backend Core**: Express, PostgreSQL, Drizzle ORM
- **Authentication**: JWT, bcrypt
- **Validation**: Zod
- **Charting**: Recharts
- **Development Tools**: TypeScript, Vite, ESLint, Prettier