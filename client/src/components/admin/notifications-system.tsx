import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, Clock, AlertTriangle, Users, ShoppingCart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'reservation' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  data?: any;
}

interface NotificationsSystemProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function NotificationsSystem({ isOpen, onToggle }: NotificationsSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les nouvelles réservations
  const { data: pendingReservations = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/notifications/pending-reservations'],
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });

  // Récupérer les nouveaux messages
  const { data: newMessages = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/notifications/new-messages'],
    refetchInterval: 30000,
  });

  // Récupérer les commandes en attente
  const { data: pendingOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/notifications/pending-orders'],
    refetchInterval: 30000,
  });

  // Générer les notifications basées sur les données
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Notifications pour les réservations
    (pendingReservations as any[]).forEach((reservation: any) => {
      newNotifications.push({
        id: `reservation-${reservation.id}`,
        type: 'reservation',
        title: 'Nouvelle réservation',
        message: `${reservation.customerName} - ${reservation.date} à ${reservation.time}`,
        timestamp: reservation.createdAt || new Date().toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/admin/reservations',
        data: reservation
      });
    });

    // Notifications pour les messages
    (newMessages as any[]).forEach((message: any) => {
      newNotifications.push({
        id: `message-${message.id}`,
        type: 'message',
        title: 'Nouveau message de contact',
        message: `${message.name}: ${message.subject}`,
        timestamp: message.createdAt || new Date().toISOString(),
        read: false,
        priority: 'medium',
        actionUrl: '/admin/messages',
        data: message
      });
    });

    // Notifications pour les commandes
    (pendingOrders as any[]).forEach((order: any) => {
      newNotifications.push({
        id: `order-${order.id}`,
        type: 'order',
        title: 'Commande en attente',
        message: `Commande #${order.id} - ${order.total}€`,
        timestamp: order.createdAt || new Date().toISOString(),
        read: false,
        priority: 'high',
        actionUrl: '/admin/orders',
        data: order
      });
    });

    // Trier par timestamp (plus récent en premier)
    newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setNotifications(newNotifications);
  }, [pendingReservations, newMessages, pendingOrders]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'reservation': return <Users className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast({
      title: "Notifications marquées comme lues",
      description: "Toutes les notifications ont été marquées comme lues",
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread': return !notif.read;
      case 'high': return notif.priority === 'high';
      default: return true;
    }
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;
  const highPriorityCount = notifications.filter(notif => notif.priority === 'high' && !notif.read).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={onToggle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant={highPriorityCount > 0 ? "destructive" : "default"}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notifications */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 z-50">
          <Card className="shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Tout marquer lu
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggle}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Filtres */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="text-xs"
                >
                  Toutes ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="text-xs"
                >
                  Non lues ({unreadCount})
                </Button>
                <Button
                  variant={filter === 'high' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('high')}
                  className="text-xs"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Urgentes ({highPriorityCount})
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {filteredNotifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        <div 
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-primary/5 border-l-4 border-primary' : ''
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-1 ${notification.priority === 'high' ? 'text-red-500' : ''}`}>
                              {getIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start">
                                <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h4>
                                <div className="flex gap-1">
                                  <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                                    {notification.priority}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(notification.timestamp)}
                                </span>
                                
                                {notification.actionUrl && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs h-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Navigation vers l'action
                                      window.location.href = notification.actionUrl!;
                                    }}
                                  >
                                    Voir détails
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {index < filteredNotifications.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}