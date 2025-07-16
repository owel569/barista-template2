
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Permission, UserRole } from '@/types/admin';

interface PermissionsCache {
  [key: string]: {
    permissions: Permission[];
    timestamp: number;
    ttl: number;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const permissionsCache: PermissionsCache = {};

export const usePermissions = () => {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!user || !token) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${user.id}_${user.role}`;
    const cached = permissionsCache[cacheKey];
    
    // Vérifier le cache
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      setPermissions(cached.permissions);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/permissions/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des permissions');
      }

      const data = await response.json();
      
      // Mettre en cache
      permissionsCache[cacheKey] = {
        permissions: data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      };

      setPermissions(data);
    } catch (err) {
      console.error('Erreur permissions:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'director') return true;
    
    return permissions.some(p => 
      p.resource === permission && 
      (p.action === 'all' || p.action === 'read')
    );
  }, [user, permissions]);

  const hasWritePermission = useCallback((resource: string): boolean => {
    if (!user) return false;
    if (user.role === 'director') return true;
    
    return permissions.some(p => 
      p.resource === resource && 
      (p.action === 'all' || p.action === 'write')
    );
  }, [user, permissions]);

  const canAccess = useCallback((module: string): boolean => {
    const modulePermissions = {
      'dashboard': 'dashboard',
      'orders': 'orders',
      'reservations': 'reservations',
      'menu': 'menu',
      'customers': 'customers',
      'employees': 'employees',
      'inventory': 'inventory',
      'maintenance': 'maintenance',
      'analytics': 'analytics',
      'settings': 'settings'
    };

    return hasPermission(modulePermissions[module as keyof typeof modulePermissions] || module);
  }, [hasPermission]);

  const permissionsSummary = useMemo(() => {
    return {
      total: permissions.length,
      readOnly: permissions.filter(p => p.action === 'read').length,
      writeAccess: permissions.filter(p => p.action === 'write' || p.action === 'all').length,
      fullAccess: permissions.filter(p => p.action === 'all').length
    };
  }, [permissions]);

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasWritePermission,
    canAccess,
    permissionsSummary,
    refreshPermissions: fetchPermissions
  };
};

export default usePermissions;
