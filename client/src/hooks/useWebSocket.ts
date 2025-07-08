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

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Éviter les connexions multiples
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN) {
      wsRef.current = globalWebSocket;
      return;
    }

    try {
      isConnectingRef.current = true;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      globalWebSocket = ws;

      ws.onopen = () => {
        console.log('🔗 Connexion WebSocket établie');
        isConnectingRef.current = false;
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      ws.onclose = () => {
        isConnectingRef.current = false;
        if (ws === globalWebSocket) {
          globalWebSocket = null;
        }
        
        // Tentative de reconnexion après 5 secondes
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 5000);
        }
      };

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        isConnectingRef.current = false;
        if (ws === globalWebSocket) {
          globalWebSocket = null;
        }
      };
    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      isConnectingRef.current = false;
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
    if (!connectionAttempted) {
      connectionAttempted = true;
      const connectTimeout = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => {
        clearTimeout(connectTimeout);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    disconnect
  };
}