import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Users,
  ShoppingCart,
  Mail,
  Database
} from 'lucide-react';

interface RealTimeNotification {
  id: string;
  type: 'reservation' | 'order' | 'message' | 'inventory' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
}

interface RealTimeUpdatesProps {
  onNotificationReceived?: (notification: RealTimeNotification) => void;
}

export default function RealTimeUpdates({ onNotificationReceived }: RealTimeUpdatesProps) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Configuration WebSocket avec gestion des messages
  useWebSocket((message) => {
    if (message) {
      handleWebSocketMessage(message);
    }
  });

  const handleWebSocketMessage = (message: any) => {
    setIsConnected(true);
    setLastUpdate(new Date());
    
    // Traiter les différents types de messages
    switch (message.type) {
      case 'reservation_created':
      case 'reservation_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/today-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/daily-reservations'] });
        addNotification({
          type: 'reservation',
          title: 'Nouvelle réservation',
          message: `Réservation ${message.type === 'reservation_created' ? 'créée' : 'mise à jour'} pour ${message.customerName || 'un client'}`,
          priority: 'medium'
        });
        break;

      case 'order_created':
      case 'order_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/active-orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats/orders-by-status'] });
        addNotification({
          type: 'order',
          title: 'Commande mise à jour',
          message: `Commande ${message.type === 'order_created' ? 'créée' : 'mise à jour'}`,
          priority: 'high'
        });
        break;

      case 'message_created':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/count'] });
        addNotification({
          type: 'message',
          title: 'Nouveau message',
          message: `Message reçu de ${message.email || 'un client'}`,
          priority: 'medium'
        });
        break;

      case 'menu_item_created':
      case 'menu_item_updated':
      case 'menu_item_deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
        queryClient.invalidateQueries({ queryKey: ['/api/menu/categories'] });
        queryClient.refetchQueries({ queryKey: ['/api/menu/items'] });
        addNotification({
          type: 'system',
          title: 'Menu mis à jour',
          message: `Article de menu ${message.type === 'menu_item_created' ? 'créé' : message.type === 'menu_item_updated' ? 'modifié' : 'supprimé'}`,
          priority: 'low'
        });
        break;

      case 'inventory_alert':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory/items'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory/alerts'] });
        addNotification({
          type: 'inventory',
          title: 'Alerte inventaire',
          message: `Stock faible: ${message.itemName || 'article'}`,
          priority: 'high'
        });
        break;

      case 'employee_created':
      case 'employee_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
        addNotification({
          type: 'system',
          title: 'Employé mis à jour',
          message: `Employé ${message.type === 'employee_created' ? 'créé' : 'modifié'}`,
          priority: 'low'
        });
        break;

      case 'customer_created':
      case 'customer_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
        addNotification({
          type: 'system',
          title: 'Client mis à jour',
          message: `Client ${message.type === 'customer_created' ? 'créé' : 'modifié'}`,
          priority: 'low'
        });
        break;

      default:
        // Actualisation générale pour tous les autres types
        queryClient.invalidateQueries();
        break;
    }
  };

  const addNotification = (notification: Omit<RealTimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealTimeNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Garder seulement les 10 dernières

    // Notifier via toast pour les notifications prioritaires
    if (notification.priority === 'high') {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    }

    // Callback externe
    if (onNotificationReceived) {
      onNotificationReceived(newNotification);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const forceRefresh = () => {
    queryClient.invalidateQueries();
    queryClient.refetchQueries();
    setLastUpdate(new Date());
    toast({
      title: "Actualisation forcée",
      description: "Toutes les données ont été actualisées",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reservation': return <Clock className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'message': return <Mail className="h-4 w-4" />;
      case 'inventory': return <Database className="h-4 w-4" />;
      case 'system': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Temps Réel
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Button
              variant="ghost"
              size="sm"
              onClick={forceRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        {lastUpdate && (
          <p className="text-xs text-gray-500">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucune notification récente
            </p>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read 
                      ? 'bg-gray-50 dark:bg-gray-800' 
                      : 'bg-white dark:bg-gray-900 border-l-4 border-l-blue-500'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                          <span className="text-xs text-gray-500">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="w-full text-xs"
                >
                  Effacer tout
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook pour utiliser les notifications en temps réel
export const useRealTimeUpdates = () => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useWebSocket((message) => {
    if (message) {
      setIsConnected(true);
      
      // Invalidation automatique selon le type de message
      switch (message.type) {
        case 'reservation_created':
        case 'reservation_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/admin/reservations'] });
          break;
        case 'order_created':
        case 'order_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
          break;
        case 'message_created':
          queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
          break;
        case 'menu_item_created':
        case 'menu_item_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
          queryClient.refetchQueries({ queryKey: ['/api/menu/items'] });
          break;
      }
    }
  });

  return {
    notifications,
    isConnected,
    forceRefresh: () => {
      queryClient.invalidateQueries();
      queryClient.refetchQueries();
    }
  };
};