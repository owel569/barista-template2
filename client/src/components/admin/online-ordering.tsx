import React, { useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Globe, 
  ShoppingCart, 
  Clock, 
  Truck, 
  CreditCard, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Smartphone, 
  Monitor, 
  Tablet,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Skeleton } from '@/components/ui/skeleton';

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
  estimatedTime?: string;
  actualTime?: string;
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

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const platformIcons = {
  website: Monitor,
  mobile_app: Smartphone,
  phone: Tablet,
};

export default function OnlineOrdering(): JSX.Element {
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [settingsForm, setSettingsForm] = useState<Partial<OrderSettings>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useWebSocket();

  const { data: orders = [], isLoading, isError } = useQuery<OnlineOrder[]>({
    queryKey: ['onlineOrders'],
    queryFn: () => apiRequest('/api/admin/online-orders'),
    staleTime: 1000 * 30, // 30 seconds
  });

  const { data: platformStats } = useQuery<PlatformStats>({
    queryKey: ['onlineOrderStats'],
    queryFn: () => apiRequest('/api/admin/online-orders/stats'),
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<OrderSettings>({
    queryKey: ['onlineOrderSettings'],
    queryFn: () => apiRequest('/api/admin/online-ordering/settings'),
    onSuccess: (data) => setSettingsForm(data),
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: any }) => 
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
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour des paramètres",
        variant: "destructive"
      });
    }
  });

  const updateOrderStatus = (id: number, status: string) => {
    updateOrderMutation.mutate({ id, status });
  };

  const handleSettingsChange = (key: keyof OrderSettings, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const platformMatch = platformFilter === 'all' || order.platform === platformFilter;
      return statusMatch && platformMatch;
    });
  }, [orders, statusFilter, platformFilter]);

  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform as keyof typeof platformIcons] || Monitor;
    return <IconComponent className="h-4 w-4" />;
  };

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

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Erreur lors du chargement des commandes. Veuillez réessayer.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Commandes en Ligne</h2>
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
              <DialogDescription>
                Configurez les options de commande en ligne pour votre restaurant.
              </DialogDescription>
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
                    checked={settingsForm.onlineOrderingEnabled || false} 
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
                    checked={settingsForm.deliveryEnabled || false} 
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
                    checked={settingsForm.pickupEnabled || false} 
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
                    checked={settingsForm.onlinePaymentEnabled || false} 
                    onCheckedChange={(val) => handleSettingsChange('onlinePaymentEnabled', val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temps de préparation min.</Label>
                  <Input 
                    type="number" 
                    value={settingsForm.minPrepTime || 15} 
                    onChange={(e) => handleSettingsChange('minPrepTime', parseInt(e.target.value))}
                    placeholder="15" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temps de livraison min.</Label>
                  <Input 
                    type="number" 
                    value={settingsForm.minDeliveryTime || 30} 
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
                  value={settingsForm.deliveryFee || 0} 
                  onChange={(e) => handleSettingsChange('deliveryFee', parseFloat(e.target.value))}
                  placeholder="5.00" 
                />
              </div>

              <div className="space-y-2">
                <Label>Montant minimum livraison (€)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={settingsForm.minDeliveryAmount || 0} 
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

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
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

      {/* Tableau des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes en Cours ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Plateforme</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog détails commande */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails Commande #{selectedOrder.orderNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Client</p>
                  <p>{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="font-medium">Commande</p>
                  <p>Type: {selectedOrder.orderType === 'pickup' ? 'À emporter' :
                           selectedOrder.orderType === 'delivery' ? 'Livraison' : 'Sur place'}</p>
                  <p>Plateforme: {selectedOrder.platform === 'website' ? 'Site Web' :
                                 selectedOrder.platform === 'mobile_app' ? 'App Mobile' : 'Téléphone'}</p>
                  <p>Statut: {statusLabels[selectedOrder.status]}</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Articles commandés</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
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
                  <p className="font-medium">Notes</p>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}