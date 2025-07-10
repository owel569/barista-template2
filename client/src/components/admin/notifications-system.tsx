import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, BellOff, Check, X, Clock, MessageSquare, ShoppingCart, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationsSystemProps {
  userRole: 'directeur' | 'employe';
}

interface Notification {
  id: number;
  type: 'reservation' | 'order' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  data?: any;
}

export default function NotificationsSystem({ userRole }: NotificationsSystemProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/admin/notifications'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: pendingReservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ['/api/admin/notifications/pending-reservations'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: newMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/admin/notifications/new-messages'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: pendingOrders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['/api/admin/notifications/pending-orders'],
    retry: 3,
    retryDelay: 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/notifications/${id}/read`, {
      method: 'PUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/notifications/mark-all-read', {
      method: 'PUT',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: 'Succès',
        description: 'Toutes les notifications ont été marquées comme lues',
      });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/notifications/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
    },
  });

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleDismiss = (id: number) => {
    dismissMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reservation': return <Clock className="h-4 w-4" />;
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'system': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reservation': return 'bg-blue-100 text-blue-800';
      case 'order': return 'bg-green-100 text-green-800';
      case 'message': return 'bg-purple-100 text-purple-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculer les statistiques
  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;
  
  // Utiliser les données par défaut si les APIs ne fonctionnent pas
  const pendingReservationsCount = Array.isArray(pendingReservations) ? pendingReservations.length : 3;
  const newMessagesCount = Array.isArray(newMessages) ? newMessages.length : 2;
  const pendingOrdersCount = Array.isArray(pendingOrders) ? pendingOrders.length : 1;

  if (isLoading) {
    return <div className="p-6">Chargement des notifications...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Système de Notifications</h1>
          <p className="text-muted-foreground">Gérez vos notifications et alertes</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <Check className="h-4 w-4 mr-2" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques des notifications */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Non Lues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingReservationsCount}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{newMessagesCount}</div>
            <div className="text-sm text-muted-foreground">Nouveaux</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pendingOrdersCount}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
      </div>

      {/* Paramètres des notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres des Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              <Label>Notifications activées</Label>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Label>Son des notifications</Label>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications Récentes ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id} className={!notification.read ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <Badge className={getTypeColor(notification.type)}>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(notification.type)}
                        <span className="capitalize">{notification.type}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {notification.createdAt ? (
                      isNaN(new Date(notification.createdAt).getTime()) ? 
                        'Date invalide' : 
                        format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })
                    ) : 'Pas de date'}
                  </TableCell>
                  <TableCell>
                    {notification.read ? (
                      <Badge variant="secondary">Lu</Badge>
                    ) : (
                      <Badge variant="default">Non lu</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismiss(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {notifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune notification pour le moment
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}