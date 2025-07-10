import { useState, useEffect, useRef } from 'react';

interface NotificationData {
  pendingReservations: number;
  pendingOrders: number;
  newMessages: number;
  lowStockItems: number;
  maintenanceAlerts: number;
  systemAlerts: number;
}

export const useWebSocket = () => {
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingReservations: 0,
    pendingOrders: 0,
    newMessages: 0,
    lowStockItems: 0,
    maintenanceAlerts: 0,
    systemAlerts: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connecté');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notifications') {
            setNotifications(data.data);
          }
        } catch (error) {
          console.error('Erreur parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket déconnecté');
        setIsConnected(false);
        
        // Tentative de reconnexion
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Tentative de reconnexion ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Erreur création WebSocket:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close();
      }
    };
  }, []);

  return {
    notifications,
    isConnected
  };
};