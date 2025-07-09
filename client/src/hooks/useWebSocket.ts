import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface WebSocketMessage {
  type: 'notification' | 'update' | 'refresh';
  data: any;
  timestamp: string;
}

let globalWebSocket: WebSocket | null = null;
let connectionAttempted = false;
let isConnecting = false;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // Éviter les connexions multiples
    if (isConnecting || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      wsRef.current = globalWebSocket;
      return;
    }

    try {
      isConnecting = true;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      globalWebSocket = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        console.log('🔗 Connexion WebSocket établie');
        isConnecting = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      ws.onclose = () => {
        isConnecting = false;
        if (ws === globalWebSocket) {
          globalWebSocket = null;
        }
        
        // Tentative de reconnexion uniquement si le composant est monté
        if (mountedRef.current && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              reconnectTimeoutRef.current = null;
              connect();
            }
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        isConnecting = false;
        if (ws === globalWebSocket) {
          globalWebSocket = null;
        }
      };
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      isConnecting = false;
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
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/occupancy-rate'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/daily-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/reservation-status'] });
        break;
      case 'new_order':
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/pending-orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/active-orders'] });
        break;
      case 'new_message':
        queryClient.invalidateQueries({ queryKey: ['/api/contact/messages'] });
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
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/pending-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/today-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/occupancy-rate'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/daily-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/reservation-status'] });
        break;
      case 'orders':
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/pending-orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/active-orders'] });
        break;
      case 'customers':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
        break;
      case 'menu':
        queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
        queryClient.invalidateQueries({ queryKey: ['/api/menu/categories'] });
        break;
      case 'employees':
        queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
        break;
      case 'messages':
        queryClient.invalidateQueries({ queryKey: ['/api/contact/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/new-messages'] });
        break;
    }
  }, [queryClient]);

  const handleRefresh = useCallback((data: any) => {
    const { type } = data;
    
    if (type === 'stats') {
      // Rafraîchir toutes les statistiques
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/today-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/occupancy-rate'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/monthly-revenue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/daily-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/reservation-status'] });
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
    if (!connectionAttempted) {
      connectionAttempted = true;
      const connectTimeout = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, 1000);
      
      return () => {
        clearTimeout(connectTimeout);
      };
    }
  }, [connect]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    disconnect
  };
}