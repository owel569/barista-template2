// Système de permissions pour les rôles utilisateur
export type UserRole = "directeur" | "employe" | "admin";

export type ModulePermission = {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

// Définition des permissions par rôle
export const rolePermissions: Record<UserRole, Record<string, ModulePermission>> = {
  directeur: {
    dashboard: { module: "dashboard", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    reservations: { module: "reservations", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    orders: { module: "orders", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    customers: { module: "customers", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    menu: { module: "menu", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    messages: { module: "messages", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    employees: { module: "employees", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    settings: { module: "settings", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    reports: { module: "reports", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    logs: { module: "logs", canView: true, canCreate: false, canUpdate: false, canDelete: false },
  },
  admin: {
    dashboard: { module: "dashboard", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    reservations: { module: "reservations", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    orders: { module: "orders", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    customers: { module: "customers", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    menu: { module: "menu", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    messages: { module: "messages", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    employees: { module: "employees", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    settings: { module: "settings", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    reports: { module: "reports", canView: true, canCreate: true, canUpdate: true, canDelete: true },
    logs: { module: "logs", canView: true, canCreate: false, canUpdate: false, canDelete: false },
  },
  employe: {
    dashboard: { module: "dashboard", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    reservations: { module: "reservations", canView: true, canCreate: true, canUpdate: true, canDelete: false },
    orders: { module: "orders", canView: true, canCreate: false, canUpdate: true, canDelete: false },
    customers: { module: "customers", canView: true, canCreate: false, canUpdate: false, canDelete: false },
    menu: { module: "menu", canView: true, canCreate: true, canUpdate: true, canDelete: false },
    messages: { module: "messages", canView: true, canCreate: true, canUpdate: true, canDelete: false },
    employees: { module: "employees", canView: false, canCreate: false, canUpdate: false, canDelete: false },
    settings: { module: "settings", canView: false, canCreate: false, canUpdate: false, canDelete: false },
    reports: { module: "reports", canView: false, canCreate: false, canUpdate: false, canDelete: false },
    logs: { module: "logs", canView: false, canCreate: false, canUpdate: false, canDelete: false },
  },
};

// Modules disponibles selon le rôle
export const getAccessibleModules = (role: UserRole): string[] => {
  return Object.keys(rolePermissions[role]).filter(
    module => rolePermissions[role][module].canView
  );
};

// Vérification des permissions
export const hasPermission = (
  role: UserRole, 
  module: string, 
  action: "view" | "create" | "update" | "delete"
): boolean => {
  const permissions = rolePermissions[role][module];
  if (!permissions) return false;

  switch (action) {
    case "view": return permissions.canView;
    case "create": return permissions.canCreate;
    case "update": return permissions.canUpdate;
    case "delete": return permissions.canDelete;
    default: return false;
  }
};

// Configuration des routes d'accès par rôle
export const getRoleBasedRoute = (role: UserRole): string => {
  switch (role) {
    case "directeur":
    case "admin":
      return "/admin";
    case "employe":
      return "/employe";
    default:
      return "/login";
  }
};

// Modules de navigation par rôle
export const getNavigationModules = (role: UserRole) => {
  const baseModules = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: "BarChart3",
      path: "/dashboard"
    },
    {
      id: "reservations",
      label: "Réservations",
      icon: "Calendar",
      path: "/reservations"
    },
    {
      id: "orders",
      label: "Commandes",
      icon: "ShoppingCart",
      path: "/orders"
    },
    {
      id: "customers",
      label: "Clients",
      icon: "Users",
      path: "/customers"
    },
    {
      id: "menu",
      label: "Menu",
      icon: "Coffee",
      path: "/menu"
    },
    {
      id: "messages",
      label: "Messages",
      icon: "MessageSquare",
      path: "/messages"
    }
  ];

  const directorModules = [
    {
      id: "employees",
      label: "Employés",
      icon: "UserCheck",
      path: "/employees"
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: "Settings",
      path: "/settings"
    },
    {
      id: "reports",
      label: "Rapports",
      icon: "TrendingUp",
      path: "/reports"
    },
    {
      id: "logs",
      label: "Historique",
      icon: "Clock",
      path: "/logs"
    }
  ];

  const accessibleModules = getAccessibleModules(role);
  let modules = baseModules.filter(module => accessibleModules.includes(module.id));

  if (role === "directeur" || role === "admin") {
    modules = [...modules, ...directorModules.filter(module => accessibleModules.includes(module.id))];
  }

  return modules;
};