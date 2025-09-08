/**
 * Système de notifications ultra-optimisé
 * Gestion complète des notifications en temps réel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  BellRing, 
  Settings, 
  Send, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  Search,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Users,
  Mail,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Zap,
  Target,
  Calendar,
  Star,
  Archive,
  RefreshCw,
  Download,
  Upload,
  Pause,
  Play,
  SkipForward,
  Bookmark,
  Share2
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

// Types optimisés
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'reservation' | 'system' | 'user' | 'payment' | 'inventory' | 'maintenance';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  readAt?: string;
  userId?: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
  scheduledFor?: string;
  expiresAt?: string;
  channel: 'web' | 'email' | 'sms' | 'push';
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  variant: 'default' | 'destructive' | 'outline';
  url?: string;
  action?: string;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  sms: boolean;
  categories: Record<string, boolean>;
  priorities: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'realtime' | 'batch' | 'daily';
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: Notification['type'];
  category: Notification['category'];
  variables: string[];
}

// Define NotificationData type alias to match usage in setNewNotification
type NotificationData = Notification;

export default function NotificationsSystem(): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('notifications');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    category: 'system',
    channel: 'web'
  });

  // WebSocket pour notifications en temps réel
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  // Requêtes optimisées
  const { data: notificationData = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Erreur de réseau');
        const data = await response.json();
        return data.notifications || [];
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
        return [];
      }
    },
    refetchInterval: 30000,
    staleTime: 10000
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<NotificationSettings>({
    queryKey: ['notificationSettings'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications/settings');
        if (!response.ok) throw new Error('Erreur de réseau');
        const data = await response.json();
        return data.settings || getDefaultSettings();
      } catch (error) {
        return getDefaultSettings();
      }
    }
  });

  const { data: templates = [] } = useQuery<NotificationTemplate[]>({
    queryKey: ['notificationTemplates'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/notifications/templates');
        if (!response.ok) throw new Error('Erreur de réseau');
        const data = await response.json();
        return data.templates || [];
      } catch (error) {
        return [];
      }
    }
  });

  // Mutations optimisées
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds })
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Notifications marquées comme lues' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour des notifications',
        variant: 'destructive'
      });
    }
  });

  const archiveNotificationsMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await fetch('/api/notifications/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: notificationIds })
      });
      if (!response.ok) throw new Error('Erreur lors de l\'archivage');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedNotifications([]);
      toast({ title: 'Notifications archivées' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'archivage des notifications',
        variant: 'destructive'
      });
    }
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notification: Partial<Notification>) => {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsCreating(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        category: 'system',
        channel: 'web'
      });
      toast({ title: 'Notification créée avec succès' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la création de la notification',
        variant: 'destructive'
      });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: NotificationSettings) => {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast({ title: 'Paramètres mis à jour' });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour des paramètres',
        variant: 'destructive'
      });
    }
  });

  // Notifications filtrées et optimisées
  const filteredNotifications = useMemo(() => {
    return notificationData.filter((notification) => {
      const matchesSearch = !searchTerm || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || !filterType || notification.type === filterType;
      const matchesStatus = filterStatus === 'all' || !filterStatus || notification.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notificationData, searchTerm, filterType, filterStatus]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: notificationData.length,
      unread: notificationData.filter(n => n.status === 'unread').length,
      urgent: notificationData.filter(n => n.priority === 'urgent').length
    };
  }, [notificationData]);

  // Paramètres par défaut
  function getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      sound: true,
      desktop: true,
      email: false,
      sms: false,
      categories: {
        order: true,
        reservation: true,
        system: true,
        user: false,
        payment: true,
        inventory: false,
        maintenance: false
      },
      priorities: {
        low: false,
        medium: true,
        high: true,
        urgent: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      frequency: 'realtime'
    };
  }

  // Gestion WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data as string);
        if (data.type === 'notification') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });

          // Notification système si activée
          if (settings?.desktop && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(data.title, {
              body: data.message,
              icon: '/favicon.ico'
            });
          }

          // Son si activé
          if (settings?.sound) {
            const audio = new Audio('/notification-sound.mp3');
            audio.play().catch(() => {});
          }
        }
      } catch (error) {
        console.error('Erreur parsing WebSocket:', error);
      }
    }
  }, [lastMessage, settings, queryClient]);

  // Demander la permission pour les notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Actions
  const handleMarkAsRead = useCallback((ids: string[]) => {
    markAsReadMutation.mutate(ids);
  }, [markAsReadMutation]);

  const handleArchive = useCallback((ids: string[]) => {
    archiveNotificationsMutation.mutate(ids);
  }, [archiveNotificationsMutation]);

  const handleCreateNotification = useCallback(() => {
    if (newNotification.title && newNotification.message) {
      createNotificationMutation.mutate({
        ...newNotification,
        id: `notif_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'unread'
      });
    }
  }, [newNotification, createNotificationMutation]);

  const handleBulkAction = useCallback((action: 'read' | 'archive') => {
    if (selectedNotifications.length === 0) return;

    switch (action) {
      case 'read':
        handleMarkAsRead(selectedNotifications);
        break;
      case 'archive':
        handleArchive(selectedNotifications);
        break;
    }
    setSelectedNotifications([]);
  }, [selectedNotifications, handleMarkAsRead, handleArchive]);

  // Icônes par type
  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'system': return <Settings className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper to update settings safely
  const updateSetting = useCallback((key: keyof NotificationSettings, value: any) => {
    if (settings) {
      updateSettingsMutation.mutate({ ...settings, [key]: value });
    }
  }, [settings, updateSettingsMutation]);

  // Specific update handlers for nested settings
  const updateCategory = useCallback((category: string, checked: boolean) => {
    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        categories: { ...settings.categories, [category]: checked }
      });
    }
  }, [settings, updateSettingsMutation]);

  const updatePriority = useCallback((priority: string, checked: boolean) => {
    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        priorities: { ...settings.priorities, [priority]: checked }
      });
    }
  }, [settings, updateSettingsMutation]);

  const updateQuietHours = useCallback((field: 'start' | 'end', value: string) => {
    if (settings) {
      updateSettingsMutation.mutate({
        ...settings,
        quietHours: { ...settings.quietHours, [field]: value }
      });
    }
  }, [settings, updateSettingsMutation]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Bell className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des notifications: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <span>{stats.unread}</span>
            <span>non lues</span>
          </Badge>
          {stats.urgent > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{stats.urgent} urgentes</span>
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'En ligne' : 'Hors ligne'}
          </Badge>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Nouvelle
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
            <div className="text-sm text-gray-500">Non lues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            <div className="text-sm text-gray-500">Urgentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((stats.total - stats.unread) / Math.max(stats.total, 1) * 100)}%
            </div>
            <div className="text-sm text-gray-500">Taux de lecture</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Créer</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Modèles</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filtres et recherche */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans les notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterType || ''} onValueChange={(value) => setFilterType(value === 'all' ? undefined : value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus || ''} onValueChange={(value) => setFilterStatus(value === 'all' ? undefined : value as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
                <SelectItem value="archived">Archivées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions groupées */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedNotifications.length} notification(s) sélectionnée(s)
              </span>
              <Button
                onClick={() => handleBulkAction('read')}
                variant="outline"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                Marquer comme lues
              </Button>
              <Button
                onClick={() => handleBulkAction('archive')}
                variant="outline"
                size="sm"
              >
                <Archive className="w-4 h-4 mr-1" />
                Archiver
              </Button>
              <Button
                onClick={() => setSelectedNotifications([])}
                variant="ghost"
                size="sm"
              >
                Annuler
              </Button>
            </div>
          )}

          {/* Liste des notifications */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    notification.status === 'unread' ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-300' : ''}`}
                  onClick={() => {
                    if (selectedNotifications.includes(notification.id)) {
                      setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                    } else {
                      setSelectedNotifications(prev => [...prev, notification.id]);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-medium ${notification.status === 'unread' ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Monitor className="w-3 h-3" />
                              <span>{notification.channel}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {notification.status === 'unread' && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead([notification.id]);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive([notification.id]);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Actions de la notification */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2">
                        {notification.actions.map((action) => (
                          <Button
                            key={action.id}
                            variant={action.variant as any}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (action.url) {
                                window.open(action.url, '_blank');
                              }
                            }}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune notification trouvée</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Créer une nouvelle notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    placeholder="Titre de la notification"
                    value={newNotification.title || ''}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newNotification.type || ''}
                    onValueChange={(value) => setNewNotification({...newNotification, type: value as NotificationData['type']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="success">Succès</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="error">Erreur</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={newNotification.priority || ''}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: value as Notification['priority'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={newNotification.category || ''}
                    onValueChange={(value) => setNewNotification(prev => ({ ...prev, category: value as Notification['category'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order">Commande</SelectItem>
                      <SelectItem value="reservation">Réservation</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="payment">Paiement</SelectItem>
                      <SelectItem value="inventory">Inventaire</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Contenu de la notification"
                  value={newNotification.message || ''}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsCreating(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateNotification}
                  disabled={!newNotification.title || !newNotification.message || createNotificationMutation.isPending}
                >
                  {createNotificationMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modèles de notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.title}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{template.type}</Badge>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <Button
                          onClick={() => {
                            setNewNotification({
                              title: template.title,
                              message: template.message,
                              type: template.type,
                              category: template.category,
                              priority: 'medium',
                              channel: 'web'
                            });
                            setActiveTab('create');
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Utiliser ce modèle
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {settingsLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Paramètres des notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Paramètres généraux */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Général</h3>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications activées</Label>
                      <p className="text-sm text-gray-500">Recevoir toutes les notifications</p>
                    </div>
                    <Switch
                      checked={Boolean(settings?.enabled)}
                      onCheckedChange={(checked) => updateSetting('enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications sonores</Label>
                      <p className="text-sm text-gray-500">Jouer un son pour les nouvelles notifications</p>
                    </div>
                    <Switch
                      checked={Boolean(settings?.sound)}
                      onCheckedChange={(checked) => updateSetting('sound', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications bureau</Label>
                      <p className="text-sm text-gray-500">Afficher les notifications du navigateur</p>
                    </div>
                    <Switch
                      checked={Boolean(settings?.desktop)}
                      onCheckedChange={(checked) => updateSetting('desktop', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications par email</Label>
                      <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                    </div>
                    <Switch
                      checked={Boolean(settings?.email)}
                      onCheckedChange={(checked) => updateSetting('email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications par SMS</Label>
                      <p className="text-sm text-gray-500">Recevoir des notifications par SMS</p>
                    </div>
                    <Switch
                      checked={Boolean(settings?.sms)}
                      onCheckedChange={(checked) => updateSetting('sms', checked)}
                    />
                  </div>
                </div>

                {/* Catégories */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Catégories</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings?.categories || {}).map(([category, enabled]) => (
                      <div key={category} className="flex items-center justify-between">
                        <Label className="capitalize">{category}</Label>
                        <Switch
                          checked={Boolean(enabled)}
                          onCheckedChange={(checked) => updateCategory(category, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priorités */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Priorités</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(settings?.priorities || {}).map(([priority, enabled]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <Label className="capitalize">{priority}</Label>
                        <Switch
                          checked={Boolean(enabled)}
                          onCheckedChange={(checked) => updatePriority(priority, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heures silencieuses */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Heures silencieuses</h3>

                  <div className="flex items-center justify-between">
                    <Label>Activer les heures silencieuses</Label>
                    <Switch
                      checked={Boolean(settings?.quietHours?.enabled)}
                      onCheckedChange={(checked) => updateSettingsMutation.mutate({
                        ...settings!,
                        quietHours: { ...settings!.quietHours, enabled: checked }
                      })}
                    />
                  </div>

                  {settings?.quietHours?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Début</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.start}
                          onChange={(e) => updateQuietHours('start', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fin</Label>
                        <Input
                          type="time"
                          value={settings.quietHours.end}
                          onChange={(e) => updateQuietHours('end', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}