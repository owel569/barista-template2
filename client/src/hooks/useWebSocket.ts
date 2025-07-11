import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('WebSocket connecté');
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Message WebSocket reçu:', data);
            
            // Invalider les caches appropriés selon le type de données
            switch (data.type) {
              case 'new_reservation':
              case 'reservation_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/today-reservations'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/reservation-status'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/count'] });
                break;
              case 'new_order':
              case 'order_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/active-orders'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/orders-by-status'] });
                break;
              case 'customer_created':
              case 'customer_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty/customers'] });
                break;
              case 'employee_created':
              case 'employee_updated':
                queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
                break;
              case 'message_received':
                queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
                queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/count'] });
                break;
              default:
                // Rafraîchir toutes les données en cas de doute
                queryClient.invalidateQueries();
            }
          } catch (error) {
            console.error('Erreur parsing message WebSocket:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('WebSocket déconnecté');
          setIsConnected(false);
          
          // Tentative de reconnexion automatique
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            console.log(`Tentative de reconnexion ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            setTimeout(() => connect(), 3000 * reconnectAttempts.current);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('Erreur WebSocket:', error);
        };
      } catch (error) {
        console.error('Erreur connexion WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient]);

  return { isConnected };
}