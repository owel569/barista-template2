import { useState, useEffect, useRef } from 'react';

interface NotificationData {
  pendingReservations: number;
  newMessages: number;
  pendingOrders: number;
  lowStockItems: number;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingReservations: 0,
    newMessages: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const lastFetchRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Fetch notifications once on mount
    const fetchInitialNotifications = async () => {
      const now = Date.now();
      if (now - lastFetchRef.current < 1000) return; // Throttle to 1 second
      
      try {
        const token = localStorage.getItem('token');
        if (!token || !mountedRef.current) return;

        lastFetchRef.current = now;
        const response = await fetch('/api/admin/notifications/count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok && mountedRef.current) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.log('Erreur notifications:', error);
      }
    };

    fetchInitialNotifications();

    // Connect WebSocket only once
    const connectWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          if (mountedRef.current) {
            console.log('WebSocket connecté');
            setIsConnected(true);
          }
        };

        wsRef.current.onmessage = (event) => {
          if (!mountedRef.current) return;
          
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'notification' || message.type === 'data_update') {
              // Trigger a single notification refresh
              setTimeout(() => {
                if (mountedRef.current) {
                  fetchInitialNotifications();
                }
              }, 1000);
            }
          } catch (error) {
            console.log('Message WebSocket non géré');
          }
        };

        wsRef.current.onclose = () => {
          if (mountedRef.current) {
            console.log('WebSocket fermé');
            setIsConnected(false);
          }
        };

        wsRef.current.onerror = () => {
          if (mountedRef.current) {
            setIsConnected(false);
          }
        };
      } catch (error) {
        console.log('Erreur WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    notifications
  };
}