import React, { useState } from 'react';
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
  DialogTrigger,
  DialogDescription,
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
  Globe, ShoppingCart, Clock, Truck, CreditCard, Settings, 
  Plus, Edit, Trash2, Eye, CheckCircle, AlertCircle,
  Smartphone, Monitor, Tablet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';

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

export default function OnlineOrdering() {
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useWebSocket();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/online-orders'],
  });

  const { data: platformStats } = useQuery({
    queryKey: ['/api/admin/online-orders/stats'],
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/admin/online-ordering/settings'],
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/online-orders/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/online-orders'] });
      toast({ title: "Commande mise à jour" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/online-ordering/settings', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/online-ordering/settings'] });
      toast({ title: "Paramètres sauvegardés" });
    },
  });

  const updateOrderStatus = (id: number, status: string) => {
    updateOrderMutation.mutate({ id, status });
  };

  const filteredOrders = orders.filter((order: OnlineOrder) => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const platformMatch = platformFilter === 'all' || order.platform === platformFilter;
    return statusMatch && platformMatch;
  });

  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform as keyof typeof platformIcons] || Monitor;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commandes en ligne</label>
                  <Switch checked={settings?.onlineOrderingEnabled} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Livraison</label>
                  <Switch checked={settings?.deliveryEnabled} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">À emporter</label>
                  <Switch checked={settings?.pickupEnabled} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Paiement en ligne</label>
                  <Switch checked={settings?.onlinePaymentEnabled} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temps de préparation min.</label>
                  <Input type="number" defaultValue={settings?.minPrepTime} placeholder="15" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temps de livraison min.</label>
                  <Input type="number" defaultValue={settings?.minDeliveryTime} placeholder="30" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Frais de livraison</label>
                <Input type="number" step="0.01" defaultValue={settings?.deliveryFee} placeholder="5.00" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Montant minimum livraison</label>
                <Input type="number" step="0.01" defaultValue={settings?.minDeliveryAmount} placeholder="25.00" />
              </div>

              <Button onClick={() => updateSettingsMutation.mutate(settings)} className="w-full">
                Sauvegarder les Paramètres
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques par plateforme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {platformStats && Object.entries(platformStats).map(([platform, stats]: [string, any]) => {
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
                    <p className="text-2xl font-bold">{stats.orders}</p>
                    <p className="text-sm text-gray-500">{stats.revenue}€ de revenus</p>
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
              <label className="text-sm font-medium">Statut</label>
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
              <label className="text-sm font-medium">Plateforme</label>
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
          <CardTitle>Commandes en Cours</CardTitle>
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
              {filteredOrders.map((order: OnlineOrder) => (
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
                  <TableCell>{order.totalAmount.toFixed(2)}€</TableCell>
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
                        >
                          Confirmer
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
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          Prête
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                        >
                          Terminée
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
                  <p>Type: {selectedOrder.orderType}</p>
                  <p>Plateforme: {selectedOrder.platform}</p>
                  <p>Statut: {statusLabels[selectedOrder.status]}</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">Articles commandés</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                        {item.customizations && (
                          <p className="text-sm text-blue-600">
                            Personnalisations: {item.customizations.join(', ')}
                          </p>
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