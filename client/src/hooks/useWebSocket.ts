import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { NotificationData } from '@/types/admin';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connecté');
        setIsConnected(true);
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleNotification(data);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket déconnecté');
        setIsConnected(false);
        // Reconnexion automatique après 3 secondes
        if (!reconnectTimeout.current) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Erreur connexion WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleNotification = (data: any) => {
    const notification: NotificationData = {
      id: Date.now(),
      type: data.type || 'system',
      title: data.title || 'Nouvelle notification',
      message: data.message || '',
      read: false,
      timestamp: new Date(),
      data: data.data
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Garder max 50 notifications

    // Afficher toast pour les nouvelles notifications importantes
    if (['reservation', 'order', 'message'].includes(notification.type)) {
      toast({
        title: notification.title,
        description: notification.message,
      });
    }
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearNotifications,
    sendMessage
  };
};