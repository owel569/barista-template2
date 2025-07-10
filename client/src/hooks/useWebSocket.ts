import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import type { NotificationData } from '@/types/admin';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Éviter les connexions multiples
    if (ws.current && ws.current.readyState === WebSocket.CONNECTING) {
      return;
    }
    
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
          if (data && data.type) {
            handleNotification(data);
          }
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket déconnecté');
        setIsConnected(false);
        // Reconnexion automatique après 5 secondes seulement si pas de timeout en cours
        if (!reconnectTimeout.current) {
          reconnectTimeout.current = setTimeout(() => {
            reconnectTimeout.current = null;
            connect();
          }, 5000);
        }
      };

      ws.current.onerror = (error) => {
        console.log('WebSocket déconnecté');
        setIsConnected(false);
      };
    } catch (error) {
      console.log('WebSocket déconnecté');
      setIsConnected(false);
    }
  };

  const handleNotification = (data: any) => {
    try {
      const notification: NotificationData = {
        id: Date.now() + Math.random(), // ID unique
        type: data.data?.type || data.type || 'system',
        title: data.data?.title || data.title || 'Nouvelle notification',
        message: data.data?.message || data.message || '',
        read: false,
        timestamp: new Date(),
        data: data.data
      };

      setNotifications(prev => {
        // Éviter les notifications dupliquées
        const exists = prev.some(n => 
          n.type === notification.type && 
          n.message === notification.message &&
          Math.abs(n.timestamp.getTime() - notification.timestamp.getTime()) < 1000
        );
        
        if (exists) return prev;
        
        return [notification, ...prev.slice(0, 49)]; // Garder max 50 notifications
      });

      // Afficher toast pour les nouvelles notifications importantes (limité)
      if (['new_reservation', 'new_order', 'new_message'].includes(notification.type)) {
        toast({
          title: notification.title,
          description: notification.message,
        });
      }
    } catch (error) {
      // Silencieux pour éviter les logs excessifs
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
    let mounted = true;
    
    const connectIfMounted = () => {
      if (mounted) {
        connect();
      }
    };
    
    connectIfMounted();

    return () => {
      mounted = false;
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