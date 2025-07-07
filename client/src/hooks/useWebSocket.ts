import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface WebSocketMessage {
  type: 'notification' | 'update' | 'refresh';
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔗 Connexion WebSocket établie');
        // Réinitialiser le timeout de reconnexion
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔗 Connexion WebSocket fermée, tentative de reconnexion...');
        // Tentative de reconnexion après 3 secondes
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        // Éviter les reconnexions trop fréquentes
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
    }
  }, []);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'notification':
        handleNotification(message.data);
        break;
      case 'update':
        handleDataUpdate(message.data);
        break;
      case 'refresh':
        handleRefresh(message.data);
        break;
    }
  }, []);

  const handleNotification = useCallback((data: any) => {
    const { type, title, message } = data;
    
    // Afficher une notification toast
    toast({
      title,
      description: message,
      duration: 5000,
    });

    // Invalider les caches appropriés
    switch (type) {
      case 'new_reservation':
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/pending-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/today-reservations'] });
        break;
      case 'new_order':
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/pending-orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/active-orders'] });
        break;
      case 'new_message':
        queryClient.invalidateQueries({ queryKey: ['/api/contact-messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/new-messages'] });
        break;
    }
  }, [toast, queryClient]);

  const handleDataUpdate = useCallback((data: any) => {
    const { type } = data;
    
    // Invalider les caches en fonction du type de mise à jour
    switch (type) {
      case 'reservations':
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        break;
      case 'orders':
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        break;
      case 'customers':
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
        break;
      case 'menu':
        queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
        break;
      case 'employees':
        queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
        break;
    }
  }, [queryClient]);

  const handleRefresh = useCallback((data: any) => {
    const { type } = data;
    
    if (type === 'stats') {
      // Rafraîchir toutes les statistiques
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/'] });
    }
  }, [queryClient]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Éviter les reconnexions multiples
    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    const connectTimeout = setTimeout(() => {
      connect();
    }, 100);
    
    return () => {
      clearTimeout(connectTimeout);
      disconnect();
    };
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    disconnect
  };
}