import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { Monitor, Eye, Clock, Package, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// ==========================================
// TYPES ET INTERFACES PRÉCISES
// ==========================================

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

interface CartItem {
  id: number;
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
  notes: string; // Obligatoire pour éviter les erreurs de type
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  category?: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  available: boolean;
}

interface Notification {
  id: number;
  type: 'new_order' | 'status_change' | 'stock_alert';
  message: string;
  orderId: number;
  read: boolean;
  createdAt: string;
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

interface PlatformStats {
  website: { orders: number; revenue: number };
  mobile_app: { orders: number; revenue: number };
  phone: { orders: number; revenue: number };
}

// ==========================================
// CONSTANTES ET CONFIGURATION
// ==========================================

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
  mobile_app: Monitor, // Utilisation de Monitor au lieu de Smartphone
  phone: Monitor, // Utilisation de Monitor au lieu de Tablet
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

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
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0); // Ajout pour suivre les nouvelles commandes
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ==========================================
  // WEBSOCKET ET DONNÉES
  // ==========================================

  const webSocketHook = useWebSocket();
  const lastMessage = webSocketHook?.lastMessage || null;
  
  useEffect(() => {
    if (lastMessage?.data) {
      const data = lastMessage.data as any;
      if (data?.type === 'new_order') {
        setNewOrdersCount(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ['/api/admin/online-orders'] });

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Nouvelle commande reçue', {
            body: `Commande #${data.order?.orderNumber || 'N/A'}`,
            icon: '/favicon.ico'
          });
        }
      } else if (data?.type === 'order_updated') {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/online-orders'] });
      }
    }
  }, [lastMessage, queryClient]);

  // Queries avec types précis
  const { data: onlineOrders = [], isLoading } = useQuery<OnlineOrder[]>({
    queryKey: ['onlineOrders'],
    queryFn: () => apiRequest('/api/admin/online-orders'),
  });

  const { data: platformStats } = useQuery<PlatformStats>({
    queryKey: ['platformStats'],
    queryFn: () => apiRequest('/api/admin/online-orders/platform-stats'),
  });

  // ==========================================
  // MUTATIONS
  // ==========================================

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

  // ==========================================
  // HANDLERS
  // ==========================================

  const updateOrderStatus = (id: number, status: OnlineOrder['status']) => {
    updateOrderMutation.mutate({ id, status });
  };

  const addCartItem = (menuItem: MenuItem) => {
    const newItem: CartItem = {
      id: Date.now(),
      menuItem,
      quantity: 1,
      customizations: {},
      notes: '' // Valeur par défaut pour éviter undefined
    };

    toast({
      title: "Article ajouté",
      description: `${menuItem.name} ajouté au panier`
    });
  };

  // ==========================================
  // DONNÉES FILTRÉES
  // ==========================================

  const filteredOrders = useMemo(() => {
    return onlineOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || order.platform === platformFilter;
      const matchesSearch = searchTerm === '' || 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesPlatform && matchesSearch;
    });
  }, [onlineOrders, statusFilter, platformFilter, searchTerm]);

  // ==========================================
  // FONCTIONS UTILITAIRES
  // ==========================================

  const getStatusColor = (status: OnlineOrder['status']) => {
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: OnlineOrder['status']) => {
    return statusLabels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // ==========================================
  // RENDU
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Commandes en ligne</h1>
          <p className="text-muted-foreground">
            Gérez les commandes provenant des plateformes en ligne
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmées</SelectItem>
              <SelectItem value="preparing">En préparation</SelectItem>
              <SelectItem value="ready">Prêtes</SelectItem>
              <SelectItem value="completed">Terminées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Plateforme" />
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

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="relative cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.orderNumber}</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {order.customerName} • {formatCurrency(order.totalAmount)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{order.platform}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">{order.items.length} article(s)</span>
                  </div>

                  {order.estimatedTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{order.estimatedTime} min</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>

                    {order.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      >
                        Accepter
                      </Button>
                    )}

                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        Préparer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineOrders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(onlineOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onlineOrders.filter(o => o.status === 'pending').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {onlineOrders.filter(o => o.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des commandes en ligne</CardTitle>
              <CardDescription>
                Configurez les options de commande en ligne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temps de préparation minimum (min)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="15"
                    value={settingsForm.minPrepTime || ''}
                    onChange={(e) => setSettingsForm(prev => ({ 
                      ...prev, 
                      minPrepTime: parseInt(e.target.value) || 0 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Frais de livraison (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="2.50"
                    value={settingsForm.deliveryFee || ''}
                    onChange={(e) => setSettingsForm(prev => ({ 
                      ...prev, 
                      deliveryFee: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>

              <Button 
                onClick={() => updateSettingsMutation.mutate(settingsForm)}
                disabled={updateSettingsMutation.isPending}
              >
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog pour les détails de commande */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Commande #{selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Informations client</h3>
                  <p><strong>Nom:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                  <p><strong>Téléphone:</strong> {selectedOrder.customerPhone}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Détails commande</h3>
                  <p><strong>Type:</strong> {selectedOrder.orderType}</p>
                  <p><strong>Plateforme:</strong> {selectedOrder.platform}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Articles</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Select 
                  value={selectedOrder.status} 
                  onValueChange={(status) => updateOrderStatus(selectedOrder.id, status as OnlineOrder['status'])}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="preparing">En préparation</SelectItem>
                    <SelectItem value="ready">Prête</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="destructive"
                  onClick={() => cancelOrderMutation.mutate(selectedOrder.id)}
                  disabled={cancelOrderMutation.isPending}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}