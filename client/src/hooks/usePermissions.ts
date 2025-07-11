export function usePermissions(userRole: 'directeur' | 'employe') {
  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    // Le directeur a tous les droits
    if (userRole === 'directeur') {
      return true;
    }
    
    // Les employés ont des permissions limitées
    if (userRole === 'employe') {
      switch (module) {
        case 'customers':
          return action === 'view'; // Employés peuvent seulement voir les clients
        case 'employees':
        case 'settings':
        case 'permissions':
        case 'accounting':
          return false; // Employés n'ont pas accès à ces modules
        case 'menu':
          return action !== 'delete'; // Employés peuvent tout sauf supprimer
        case 'reservations':
        case 'orders':
        case 'messages':
        case 'inventory':
        case 'loyalty':
        case 'statistics':
        case 'reports':
        case 'notifications':
          return true; // Employés ont accès complet à ces modules
        default:
          return false;
      }
    }
    
    return false;
  };

  return { hasPermission };
}