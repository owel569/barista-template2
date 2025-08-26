
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { useWebSocket } from './useWebSocket';

interface PermissionUpdateEvent {
  type: 'permission-update';
  userId: string | number;
  permissions: any[];
  timestamp: number;
}

/**
 * Hook pour synchroniser les permissions en temps réel
 * Écoute les changements de permissions et met à jour automatiquement
 */
export function usePermissionsSync() {
  const { user, isAuthenticated } = useAuth();
  const { refreshPermissions, isAdmin } = usePermissions();
  const { lastMessage, isConnected } = useWebSocket();
  const lastUpdateRef = useRef<number>(0);

  // Handler pour les événements de mise à jour des permissions
  const handlePermissionsUpdate = useCallback((event: CustomEvent<PermissionUpdateEvent>) => {
    const { userId, timestamp } = event.detail;
    
    // Éviter les doubles mises à jour
    if (timestamp <= lastUpdateRef.current) return;
    lastUpdateRef.current = timestamp;
    
    // Si c'est notre utilisateur, rafraîchir les permissions
    if (user && String(userId) === String(user.id)) {
      refreshPermissions();
      
      // Notification visuelle optionnelle
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Permissions mises à jour', {
          body: 'Vos permissions ont été modifiées par un administrateur',
          icon: '/favicon.ico',
          tag: 'permission-update'
        });
      }
    }
  }, [user, refreshPermissions]);

  // Écouter les messages WebSocket
  useEffect(() => {
    if (!lastMessage || !isConnected || !user) return;

    try {
      if (lastMessage.type === 'permission-update') {
        const data = lastMessage.data as any;
        if (data && String(data.userId) === String(user.id)) {
          const now = Date.now();
          if (now > lastUpdateRef.current + 1000) { // Éviter les updates trop fréquentes
            lastUpdateRef.current = now;
            refreshPermissions();
          }
        }
      }
    } catch (error) {
      console.error('Erreur WebSocket permissions:', error);
    }
  }, [lastMessage, isConnected, user, refreshPermissions]);

  // Écouter les événements custom du DOM
  useEffect(() => {
    if (!isAuthenticated || !user || isAdmin) return;

    const handleCustomEvent = (event: Event) => {
      handlePermissionsUpdate(event as CustomEvent<PermissionUpdateEvent>);
    };

    window.addEventListener('permissions-updated', handleCustomEvent);

    return () => {
      window.removeEventListener('permissions-updated', handleCustomEvent);
    };
  }, [isAuthenticated, user, isAdmin, handlePermissionsUpdate]);

  // Synchronisation périodique pour les utilisateurs non-admin
  useEffect(() => {
    if (!isAuthenticated || !user || isAdmin) return;

    const syncInterval = setInterval(() => {
      refreshPermissions();
    }, 5 * 60 * 1000); // Sync toutes les 5 minutes

    return () => clearInterval(syncInterval);
  }, [isAuthenticated, user, isAdmin, refreshPermissions]);

  return {
    isConnected,
    lastUpdate: lastUpdateRef.current,
    forceSync: refreshPermissions
  };
}

// Hook pour émettre des mises à jour de permissions (pour les admins)
export function usePermissionsEmitter() {
  const { isAdmin } = usePermissions();
  const { sendMessage } = useWebSocket();

  const emitPermissionUpdate = useCallback((userId: string | number, permissions?: any[]) => {
    if (!isAdmin) return false;

    const event = new CustomEvent('permissions-updated', {
      detail: {
        type: 'permission-update',
        userId,
        permissions,
        timestamp: Date.now()
      }
    });

    // Émettre l'événement local
    window.dispatchEvent(event);

    // Envoyer via WebSocket si connecté
    const sent = sendMessage({
      type: 'permission-update',
      data: {
        userId,
        permissions,
        timestamp: Date.now()
      }
    });

    return sent;
  }, [isAdmin, sendMessage]);

  return {
    emitPermissionUpdate,
    canEmit: isAdmin
  };
}
