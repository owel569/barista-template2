import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState({
    pendingReservations: 0,
    newMessages: 0,
    pendingOrders: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('WebSocket connecté');
          setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'notification_update':
                setNotifications(prev => ({
                  ...prev,
                  ...message.data
                }));
                break;
              case 'new_reservation':
                setNotifications(prev => ({
                  ...prev,
                  pendingReservations: prev.pendingReservations + 1
                }));
                break;
              case 'new_message':
                setNotifications(prev => ({
                  ...prev,
                  newMessages: prev.newMessages + 1
                }));
                break;
              case 'new_order':
                setNotifications(prev => ({
                  ...prev,
                  pendingOrders: prev.pendingOrders + 1
                }));
                break;
              default:
                console.log('Message WebSocket non géré:', message);
            }
          } catch (error) {
            console.error('Erreur parsing WebSocket:', error);
          }
        };

        ws.current.onclose = () => {
          console.log('WebSocket fermé, reconnexion dans 3s...');
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };

        ws.current.onerror = (error) => {
          console.error('Erreur WebSocket:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Erreur lors de la connexion WebSocket:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const refreshNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des notifications:', error);
    }
  };

  return {
    isConnected,
    notifications,
    sendMessage,
    refreshNotifications
  };
}