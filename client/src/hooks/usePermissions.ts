import { User } from '@/types/admin';

export function usePermissions(user: User | null) {
  const userRole = user?.role || 'employe';
  
  const canModify = (module: string): boolean => {
    if (userRole === 'directeur') return true;
    
    switch (module) {
      case 'customers':
        return false; // Employés en lecture seule
      case 'menu':
        return true; // Employés peuvent modifier le menu
      case 'reservations':
        return true; // Employés peuvent modifier les réservations
      case 'orders':
        return true; // Employés peuvent modifier les commandes
      case 'messages':
        return true; // Employés peuvent gérer les messages
      case 'employees':
        return false; // Réservé aux directeurs
      case 'settings':
        return false; // Réservé aux directeurs
      default:
        return false;
    }
  };

  const canDelete = (module: string): boolean => {
    if (userRole === 'directeur') return true;
    
    switch (module) {
      case 'menu':
        return false; // Employés ne peuvent pas supprimer du menu
      case 'customers':
        return false; // Employés ne peuvent pas supprimer des clients
      case 'reservations':
        return false; // Employés ne peuvent pas supprimer des réservations
      case 'orders':
        return false; // Employés ne peuvent pas supprimer des commandes
      default:
        return false;
    }
  };

  const canView = (module: string): boolean => {
    if (userRole === 'directeur') return true;
    
    switch (module) {
      case 'employees':
        return false; // Réservé aux directeurs
      case 'settings':
        return false; // Réservé aux directeurs
      case 'statistics':
        return false; // Réservé aux directeurs
      case 'logs':
        return false; // Réservé aux directeurs
      default:
        return true; // Employés peuvent voir les autres modules
    }
  };

  return {
    canModify,
    canDelete,
    canView,
    userRole
  };
}