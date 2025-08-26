
import { useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import { usePermissions } from './usePermissions';

/**
 * Hook pour synchroniser les permissions en temps réel
 * Écoute les changements de permissions et met à jour automatiquement
 */
export function usePermissionsSync() : void {
  const { user } = useContext(AuthContext);
  const { refreshPermissions, isDirector } = usePermissions(user);

  useEffect(() => {
    // Ne pas écouter les changements pour le directeur (il a tous les droits)
    if (isDirector || !user) return;

    const handlePermissionsUpdate = (event: CustomEvent) => {
      const { userId } = event.detail;
      
      // Si c'est notre utilisateur, rafraîchir les permissions
      if (userId === user.id) {
        refreshPermissions();
        
        // Notification visuelle optionnelle
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Permissions mises à jour', {
            body: 'Vos permissions ont été modifiées par un administrateur',
            icon: '/favicon.ico'
          });
        }
      }
    };

    // Écouter les événements de mise à jour des permissions
    window.addEventListener('permissions-updated', handlePermissionsUpdate as EventListener);

    // Écouter les messages WebSocket si disponible
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'permission-update' && data.userId === user.id) {
          refreshPermissions();
        }
      } catch (error) {
        logger.error('Erreur WebSocket permissions:', { error: error instanceof Error ? error.message : 'Erreur inconnue' )});
      }
    };

    return () => {
      window.removeEventListener('permissions-updated', handlePermissionsUpdate as EventListener);
      ws.close();
    };
  }, [user, isDirector, refreshPermissions]);

  return { isDirector };
}
