import React from 'react';
import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
}

interface Permission {
  module: string;
  actions: string[];
}

const DEFAULT_PERMISSIONS = {
  directeur: {
    dashboard: ['view'],
    reservations: ['view', 'create', 'edit', 'delete'],
    orders: ['view', 'create', 'edit', 'delete'],
    customers: ['view', 'create', 'edit', 'delete'],
    menu: ['view', 'create', 'edit', 'delete'],
    messages: ['view', 'create', 'edit', 'delete'],
    employees: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'edit'],
    statistics: ['view'],
    logs: ['view'],
    inventory: ['view', 'create', 'edit', 'delete'],
    loyalty: ['view', 'create', 'edit', 'delete'],
    permissions: ['view', 'edit'],
    accounting: ['view', 'create', 'edit', 'delete'],
    backup: ['view', 'create'],
    reports: ['view'],
    calendar: ['view', 'create', 'edit', 'delete'],
    suppliers: ['view', 'create', 'edit', 'delete'],
    maintenance: ['view', 'create', 'edit', 'delete'],
    delivery: ['view', 'edit'],
    tables: ['view', 'create', 'edit', 'delete'],
    analytics: ['view'],
    pos: ['use'],
    scheduling: ['view', 'create', 'edit', 'delete'],
    quality: ['view', 'create', 'edit'],
    feedback: ['view', 'create', 'edit', 'respond']
  },
  employe: {
    dashboard: ['view'],
    reservations: ['view', 'create', 'edit'],
    orders: ['view', 'create', 'edit'],
    customers: ['view'],
    menu: ['view', 'edit'],
    messages: ['view', 'create'],
    statistics: ['view'],
    logs: ['view'],
    inventory: ['view'],
    loyalty: ['view', 'edit'],
    delivery: ['view', 'edit'],
    tables: ['view', 'edit'],
    analytics: ['view'],
    pos: ['use'],
    quality: ['view', 'create'],
    feedback: ['view', 'create']
  }
};

export function usePermissions(user: User | null) {
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (user && user.role) {
      const userPermissions = DEFAULT_PERMISSIONS[user.role] || {};
      setPermissions(userPermissions);
    } else {
      setPermissions({});
    }
  }, [user]);

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'directeur') return true; // Directeur a tous les droits

    const modulePermissions = permissions[module] || [];
    return modulePermissions.includes(action);
  };

  const canView = (module: string): boolean => {
    return hasPermission(module, 'view');
  };

  const canCreate = (module: string): boolean => {
    return hasPermission(module, 'create');
  };

  const canEdit = (module: string): boolean => {
    return hasPermission(module, 'edit');
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete');
  };

  return {
    permissions,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete
  };
}