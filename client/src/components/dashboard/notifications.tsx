import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Types
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'low' | 'medium' | 'high';
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

// Composant de notification individuelle
function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className={cn(
      "relative p-4 border-l-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800",
      getPriorityColor(),
      notification.read ? "opacity-60" : "opacity-100"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium",
                notification.read ? "text-gray-600" : "text-gray-900 dark:text-white"
              )}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(notification.timestamp)}
              </p>
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {!notification.read && (
                <Badge variant="secondary" className="text-xs">
                  Nouveau
                </Badge>
              )}
              <Badge variant="outline" className="text-xs capitalize">
                {notification.priority}
              </Badge>
            </div>
          </div>
          
          {notification.action && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={notification.action.onClick}
                className="text-xs"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {!notification.read && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsRead(notification.id)}
            className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
          >
            <Check className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(notification.id)}
          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Composant principal du centre de notifications
export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete,
  className 
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const highPriorityCount = notifications.filter(n => n.priority === 'high' && !n.read).length;

  const handleMarkAllAsRead = useCallback(() => {
    onMarkAllAsRead();
    setOpen(false);
  }, [onMarkAllAsRead]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.action) {
      notification.action.onClick();
    }
  }, [onMarkAsRead]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative h-9 w-9 p-0",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {highPriorityCount > 0 && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune notification
              </p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-1">
                {notifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <NotificationItem
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                      />
                    </div>
                    {index < notifications.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </PopoverContent>
    </Popover>
  );
}

// Composant de notification toast
export function NotificationToast({ 
  notification, 
  onDismiss 
}: { 
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getToastStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 border rounded-lg shadow-lg max-w-sm",
      getToastStyles()
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {notification.message}
        </p>
        {notification.action && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={notification.action.onClick}
              className="text-xs"
            >
              {notification.action.label}
            </Button>
          </div>
        )}
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDismiss(notification.id)}
        className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Hook pour gérer les notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-dismiss after 5 seconds for low priority notifications
    if (notification.priority === 'low') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
}

// Composant de gestionnaire de notifications global
export function NotificationManager() {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();

  return (
    <NotificationCenter
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={removeNotification}
    />
  );
}