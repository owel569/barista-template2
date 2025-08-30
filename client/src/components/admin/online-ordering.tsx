import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  ShoppingCart, 
  Clock, 
  Truck, 
  CreditCard, 
  Settings, 
  Eye, 
  Trash2,
  Smartphone, 
  Monitor, 
  Tablet,
  Loader2,
  Search,
  Download,
  Grid,
  List,
  Bell,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderTimer } from '@/components/order-timer';
import { OrderCard } from '@/components/order-card';
import { ExportDialog } from '@/components/export-dialog';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

// Define interfaces and types
interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  platform: 'website' | 'mobile_app' | 'phone';
  orderType: 'pickup' | 'delivery' | 'dine_in';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'paypal' | 'cash' | 'mobile';
  notes?: string;
  internalNote?: string;
  estimatedTime?: number;
  driverId?: number;
  driver?: Driver;
  stockChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  customizations?: string[];
  notes?: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  available: boolean;
}

interface PlatformStats {
  website: { orders: number; revenue: number };
  mobile_app: { orders: number; revenue: number };
  phone: { orders: number; revenue: number };
}

interface OrderSettings {
  onlineOrderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  onlinePaymentEnabled: boolean;
  minPrepTime: number;
  minDeliveryTime: number;
  deliveryFee: number;
  minDeliveryAmount: number;
}

interface Notification {
  id: number;
  type: 'new_order' | 'status_change' | 'stock_alert';
  message: string;
  orderId: number;
  read: boolean;
  createdAt: string;
}

// Constants for styling and labels
const statusColors: Record<OnlineOrder['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<OnlineOrder['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const platformIcons: Record<OnlineOrder['platform'], React.ElementType> = {
  website: Monitor,
  mobile_app: Smartphone,
  phone: Tablet,
};

// Main component
export default function OnlineOrdering(): JSX.Element {
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [internalNote, setInternalNote] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settingsForm, setSettingsForm] = useState<Partial<OrderSettings>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket hook for real-time updates
  useWebSocket('orders', {
    onMessage: (data: any) => {
      if (data.type === 'new_order') {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'new_order',
          message: `Nouvelle commande #${data.order.orderNumber}`,
          orderId: data.order.id,
          read: false,
          createdAt: new Date().toISOString()
        }]);

        toast({
          title: "Nouvelle commande!",
          description: `Commande #${data.order.orderNumber} reçue`,
        });

        queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      } else if (data.type === 'ORDER_UPDATE') {
        // Handle order status updates
        queryClient.setQueryData<OnlineOrder[]>(['onlineOrders'], (oldOrders) => 
          oldOrders
            ? oldOrders.map(order => 
                order.id === data.orderId 
                  ? { ...order, status: data.status }
                  : order
              )
            : []
        );
      }
    }
  });

  // Queries for fetching data
  const { data: orders = [], isLoading, isError } = useQuery<OnlineOrder[]>({
    queryKey: ['onlineOrders'],
    queryFn: () => apiRequest('/api/admin/online-orders'),
    staleTime: 1000 * 30,
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: () => apiRequest('/api/admin/drivers'),
  });

  const { data: platformStats } = useQuery<PlatformStats>({
    queryKey: ['onlineOrderStats'],
    queryFn: () => apiRequest('/api/admin/online-orders/stats'),
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<OrderSettings>({
    queryKey: ['onlineOrderSettings'],
    queryFn: () => apiRequest('/api/admin/online-ordering/settings'),
  });

  const { data: storedNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => apiRequest('/api/admin/notifications'),
  });

  // Effects for state management
  useEffect(() => {
    if (settings) {
      setSettingsForm(settings);
    }
  }, [settings]);

  useEffect(() => {
    setNotifications(storedNotifications);
  }, [storedNotifications]);

  // Keyboard shortcuts for status updates
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && selectedOrder) {
        switch(e.key) {
          case '1': 
            updateOrderStatus(selectedOrder.id, 'confirmed');
            break;
          case '2': 
            updateOrderStatus(selectedOrder.id, 'preparing');
            break;
          case '3': 
            updateOrderStatus(selectedOrder.id, 'ready');
            break;
          case '4': 
            updateOrderStatus(selectedOrder.id, 'completed');
            break;
          case 'Escape':
            setSelectedOrder(null);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedOrder]);

  // Mutations for data manipulation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => 
      apiRequest(`/api/admin/online-orders/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      toast({ 
        title: "Commande mise à jour",
        description: "Le statut de la commande a été modifié avec succès"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour de la commande",
        variant: "destructive"
      });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/online-orders/${id}/cancel`, { 
        method: 'POST' 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      toast({ 
        title: "Commande annulée",
        description: "La commande a été annulée avec succès"
      });
    },
  });

  const checkStockMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/online-orders/${id}/stock-check`, { 
        method: 'POST' 
      }),
    onSuccess: (data: { inStock: boolean; outOfStockItems: string[] }) => {
      if (data.inStock) {
        toast({ 
          title: "Stock vérifié",
          description: "Tous les articles sont en stock"
        });
      } else {
        toast({
          title: "Stock insuffisant",
          description: `Articles manquants: ${data.outOfStockItems.join(', ')}`,
          variant: "destructive"
        });
      }
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) => 
      apiRequest(`/api/admin/online-orders/${orderId}/assign-driver`, { 
        method: 'POST',
        body: JSON.stringify({ driverId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      toast({ 
        title: "Livreur assigné",
        description: "Le livreur a été assigné avec succès"
      });
    },
  });

  const addInternalNoteMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) => 
      apiRequest(`/api/admin/online-orders/${orderId}/internal-note`, { 
        method: 'POST',
        body: JSON.stringify({ note })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      setInternalNote('');
      toast({ 
        title: "Note ajoutée",
        description: "La note interne a été ajoutée"
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<OrderSettings>) => 
      apiRequest('/api/admin/online-ordering/settings', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrderSettings'] });
      toast({ 
        title: "Paramètres sauvegardés",
        description: "Les paramètres ont été mis à jour avec succès"
      });
    },
  });

  const markNotificationAsRead = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/notifications/${id}/read`, { 
        method: 'POST' 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Handlers for UI interactions
  const updateOrderStatus = (id: number, status: OnlineOrder['status']) => {
    updateOrderMutation.mutate({ id, status });
  };

  const handleSettingsChange = (key: keyof OrderSettings, value: unknown) => {
    setSettingsForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Memoized filtered orders based on current filters
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const platformMatch = platformFilter === 'all' || order.platform === platformFilter;
      const searchMatch = searchTerm === '' || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.includes(searchTerm) ||
        order.customerPhone.includes(searchTerm);

      return statusMatch && platformMatch && searchMatch;
    });
  }, [orders, statusFilter, platformFilter, searchTerm]);

  const unreadNotifications = useMemo(() => 
    notifications.filter(n => !n.read).length, 
    [notifications]
  );

  // Helper function to get platform icon
  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform as keyof typeof platformIcons] || Monitor;
    return <IconComponent className="h-4 w-4" />;
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state UI
  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Erreur lors du chargement des commandes. Veuillez réessayer.
      </div>
    );
  }

  // Main component rendering
  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Commandes en Ligne</h2>
        <div className="flex items-center space-x-2">
          <ExportDialog orders={filteredOrders} />

          <Button 
            variant="outline" 
            onClick={() => setShowAnalytics(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {unreadNotifications}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground">Aucune notification</p>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded border ${notification.read ? 'bg-muted' : 'bg-blue-50'}`}
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markNotificationAsRead.mutate(notification.id)}
                          className="mt-2"
                        >
                          Marquer comme lu
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Paramètres Commandes en Ligne</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-4">
                    <div>
                      <Label>Commandes en ligne</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer/désactiver les commandes en ligne
                      </p>
                    </div>
                    <Switch 
                      checked={settingsForm.onlineOrderingEnabled ?? false} 
                      onCheckedChange={(val) => handleSettingsChange('onlineOrderingEnabled', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-4">
                    <div>
                      <Label>Livraison</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer les livraisons
                      </p>
                    </div>
                    <Switch 
                      checked={settingsForm.deliveryEnabled ?? false} 
                      onCheckedChange={(val) => handleSettingsChange('deliveryEnabled', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-4">
                    <div>
                      <Label>À emporter</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer les commandes à emporter
                      </p>
                    </div>
                    <Switch 
                      checked={settingsForm.pickupEnabled ?? false} 
                      onCheckedChange={(val) => handleSettingsChange('pickupEnabled', val)}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-4">
                    <div>
                      <Label>Paiement en ligne</Label>
                      <p className="text-sm text-muted-foreground">
                        Activer les paiements en ligne
                      </p>
                    </div>
                    <Switch 
                      checked={settingsForm.onlinePaymentEnabled ?? false} 
                      onCheckedChange={(val) => handleSettingsChange('onlinePaymentEnabled', val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temps de préparation min.</Label>
                    <Input 
                      type="number" 
                      value={settingsForm.minPrepTime ?? 15} 
                      onChange={(e) => handleSettingsChange('minPrepTime', parseInt(e.target.value))}
                      placeholder="15" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temps de livraison min.</Label>
                    <Input 
                      type="number" 
                      value={settingsForm.minDeliveryTime ?? 30} 
                      onChange={(e) => handleSettingsChange('minDeliveryTime', parseInt(e.target.value))}
                      placeholder="30" 
                  />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frais de livraison (€)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={settingsForm.deliveryFee ?? 0} 
                    onChange={(e) => handleSettingsChange('deliveryFee', parseFloat(e.target.value))}
                    placeholder="5.00" 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Montant minimum livraison (€)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={settingsForm.minDeliveryAmount ?? 0} 
                    onChange={(e) => handleSettingsChange('minDeliveryAmount', parseFloat(e.target.value))}
                    placeholder="25.00" 
                  />
                </div>

                <DialogFooter>
                  <Button 
                    onClick={() => updateSettingsMutation.mutate(settingsForm)} 
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sauvegarder
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques par plateforme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platformStats && Object.entries(platformStats).map(([platform, stats]) => {
          const IconComponent = platformIcons[platform as keyof typeof platformIcons] || Monitor;
          return (
            <Card key={platform}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 capitalize">
                      {platform === 'website' ? 'Site Web' : 
                       platform === 'mobile_app' ? 'App Mobile' : 'Téléphone'}
                    </p>
                    <p className="text-2xl font-bold">{stats?.orders || 0}</p>
                    <p className="text-sm text-gray-500">{stats?.revenue?.toFixed(2) || 0}€ de revenus</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Filtres</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4 mr-2" />
              Tableau
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4 mr-2" />
              Grille
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, téléphone ou n° commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plateforme</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="website">Site Web</SelectItem>
                  <SelectItem value="mobile_app">App Mobile</SelectItem>
                  <SelectItem value="phone">Téléphone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau ou Grille des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes en Cours ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Plateforme</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Temps</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-gray-500">{order.customerPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(order.platform)}
                          <span className="capitalize">
                            {order.platform === 'website' ? 'Site Web' : 
                             order.platform === 'mobile_app' ? 'App Mobile' : 'Téléphone'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.orderType === 'pickup' ? 'À emporter' :
                           order.orderType === 'delivery' ? 'Livraison' : 'Sur place'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.estimatedTime && (
                          <OrderTimer 
                            createdAt={order.createdAt} 
                            estimatedTime={order.estimatedTime} 
                          />
                        )}
                      </TableCell>
                      <TableCell>{(order.totalAmount || 0).toFixed(2)}€</TableCell>
                      <TableCell>
                        <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                          {order.paymentStatus === 'paid' ? 'Payé' : 
                           order.paymentStatus === 'pending' ? 'En attente' : 'Échec'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {!order.stockChecked && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => checkStockMutation.mutate(order.id)}
                              disabled={checkStockMutation.isPending}
                            >
                              {checkStockMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : 'Stock'}
                            </Button>
                          )}

                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              disabled={updateOrderMutation.isPending}
                            >
                              {updateOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : 'Confirmer'}
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              disabled={updateOrderMutation.isPending}
                            >
                              {updateOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : 'Préparer'}
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              disabled={updateOrderMutation.isPending}
                            >
                              {updateOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : 'Prête'}
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              disabled={updateOrderMutation.isPending}
                            >
                              {updateOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : 'Terminée'}
                            </Button>
                          )}

                          {order.status !== 'cancelled' && order.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelOrderMutation.mutate(order.id)}
                              disabled={cancelOrderMutation.isPending}
                            >
                              {cancelOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : 'Annuler'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onSelect={setSelectedOrder}
                  onUpdateStatus={updateOrderStatus}
                  onCancel={cancelOrderMutation.mutate}
                  onCheckStock={checkStockMutation.mutate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails commande */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Détails Commande #{selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Client</h3>
                  <div className="space-y-1">
                    <p>{selectedOrder.customerName}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Informations commande</h3>
                  <div className="space-y-1">
                    <p>Type: {selectedOrder.orderType === 'pickup' ? 'À emporter' :
                             selectedOrder.orderType === 'delivery' ? 'Livraison' : 'Sur place'}</p>
                    <p>Plateforme: {selectedOrder.platform === 'website' ? 'Site Web' :
                                   selectedOrder.platform === 'mobile_app' ? 'App Mobile' : 'Téléphone'}</p>
                    <p>Statut: {statusLabels[selectedOrder.status]}</p>
                    {selectedOrder.estimatedTime && (
                      <OrderTimer 
                        createdAt={selectedOrder.createdAt} 
                        estimatedTime={selectedOrder.estimatedTime} 
                      />
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.orderType === 'delivery' && (
                <div>
                  <h3 className="font-medium mb-2">Livraison</h3>
                  <Select
                    value={selectedOrder.driverId?.toString() || ''}
                    onValueChange={(driverId) => assignDriverMutation.mutate({ 
                      orderId: selectedOrder.id, 
                      driverId: parseInt(driverId) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assigner un livreur" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.filter(d => d.available).map(driver => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.name} - {driver.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Articles commandés</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                        <p className="text-sm text-gray-500">Prix unitaire: {item.unitPrice.toFixed(2)}€</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <p className="text-sm text-blue-600">
                            Personnalisations: {item.customizations.join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-500">Note: {item.notes}</p>
                        )}
                      </div>
                      <p className="font-medium">{(item.quantity * item.unitPrice).toFixed(2)}€</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-lg font-bold">Total: {(selectedOrder.totalAmount || 0).toFixed(2)}€</p>
                <Badge className={statusColors[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes client</h3>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">{selectedOrder.notes}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Note interne</h3>
                <div className="flex space-x-2">
                  <Input
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Ajouter une note interne..."
                  />
                  <Button
                    onClick={() => addInternalNoteMutation.mutate({ 
                      orderId: selectedOrder.id, 
                      note: internalNote 
                    })}
                    disabled={!internalNote.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
                {selectedOrder.internalNote && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded mt-2">
                    {selectedOrder.internalNote}
                  </p>
                )}
              </div>

              <div className="flex space-x-2 justify-end">
                {selectedOrder.status === 'pending' && (
                  <Button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                    disabled={updateOrderMutation.isPending}
                  >
                    Confirmer
                  </Button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                    disabled={updateOrderMutation.isPending}
                  >
                    Préparer
                  </Button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <Button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    disabled={updateOrderMutation.isPending}
                  >
                    Prête
                  </Button>
                )}
                {selectedOrder.status === 'ready' && (
                  <Button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                    disabled={updateOrderMutation.isPending}
                  >
                    Terminée
                  </Button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                  <Button
                    variant="destructive"
                    onClick={() => cancelOrderMutation.mutate(selectedOrder.id)}
                    disabled={cancelOrderMutation.isPending}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog Analytics */}
      {showAnalytics && (
        <AnalyticsDashboard 
          open={showAnalytics} 
          onOpenChange={setShowAnalytics} 
          orders={orders} 
        />
      )}
    </div>
  );
}