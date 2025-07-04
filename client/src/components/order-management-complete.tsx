import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingCart, 
  Clock,
  DollarSign,
  Filter,
  Plus,
  Edit,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Search,
  Calendar,
  User,
  Phone,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Order {
  id: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  deliveryAddress?: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OrderManagementProps {
  userRole: string;
}

export default function OrderManagementComplete({ userRole }: OrderManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ status: "all", date: "", search: "" });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['/api/menu/items'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest('PATCH', `/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Statut de commande mis à jour avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le statut",
        variant: "destructive" 
      });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/orders/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande supprimée avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer la commande",
        variant: "destructive" 
      });
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => apiRequest('POST', '/api/orders', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowNewOrderDialog(false);
      toast({ title: "Nouvelle commande créée avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer la commande",
        variant: "destructive" 
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">En Attente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Confirmée</Badge>;
      case 'preparing':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Préparation</Badge>;
      case 'ready':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Prête</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Livrée</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'delivered'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getStatusAction = (status: string) => {
    switch (status) {
      case 'pending': return 'Confirmer';
      case 'confirmed': return 'En Préparation';
      case 'preparing': return 'Marquer Prête';
      case 'ready': return 'Marquer Livrée';
      default: return null;
    }
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const filteredOrders = orders.filter((order: Order) => {
    const matchesStatus = filter.status === 'all' || order.status === filter.status;
    const matchesDate = !filter.date || order.createdAt?.includes(filter.date);
    const matchesSearch = !filter.search || 
      order.customerName?.toLowerCase().includes(filter.search.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(filter.search.toLowerCase()) ||
      order.id.toString().includes(filter.search);
    return matchesStatus && matchesDate && matchesSearch;
  });

  const getOrderStats = () => {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0)
    };
  };

  const stats = getOrderStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-amber-500 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Commandes</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivi et gestion de toutes les commandes
          </p>
        </div>
        <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Commande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Nouvelle Commande</DialogTitle>
            </DialogHeader>
            <NewOrderForm 
              menuItems={menuItems}
              onSubmit={(data) => createOrderMutation.mutate(data)}
              isLoading={createOrderMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "En Attente", value: stats.pending, color: "bg-yellow-500", icon: Clock },
          { label: "Confirmées", value: stats.confirmed, color: "bg-blue-500", icon: CheckCircle },
          { label: "En Préparation", value: stats.preparing, color: "bg-orange-500", icon: ShoppingCart },
          { label: "Prêtes", value: stats.ready, color: "bg-purple-500", icon: CheckCircle },
          { label: "Livrées", value: stats.delivered, color: "bg-green-500", icon: Truck },
          { label: "Annulées", value: stats.cancelled, color: "bg-red-500", icon: XCircle },
          { label: "Revenus", value: `${stats.totalRevenue.toFixed(2)}€`, color: "bg-emerald-500", icon: DollarSign },
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
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
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou ID..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En Attente</SelectItem>
                <SelectItem value="confirmed">Confirmées</SelectItem>
                <SelectItem value="preparing">En Préparation</SelectItem>
                <SelectItem value="ready">Prêtes</SelectItem>
                <SelectItem value="delivered">Livrées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
              placeholder="Filtrer par date"
            />
            <Button 
              variant="outline" 
              onClick={() => setFilter({ status: "all", date: "", search: "" })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Commandes ({filteredOrders.length})</span>
            <Badge variant="secondary">{filteredOrders.length} résultat(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune commande trouvée</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order: Order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{order.customerName || 'Client anonyme'}</div>
                            {order.deliveryAddress && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.deliveryAddress.substring(0, 30)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.customerEmail && (
                            <div className="text-sm text-gray-600">{order.customerEmail}</div>
                          )}
                          {order.customerPhone && (
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="font-medium">
                        {order.totalAmount ? `${order.totalAmount.toFixed(2)}€` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <OrderDetailsModal order={order} />
                            </DialogContent>
                          </Dialog>
                          
                          {getNextStatus(order.status) && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => updateStatusMutation.mutate({
                                id: order.id,
                                status: getNextStatus(order.status)!
                              })}
                              disabled={updateStatusMutation.isPending}
                            >
                              {getStatusAction(order.status)}
                            </Button>
                          )}
                          
                          {order.status === 'pending' && userRole === 'directeur' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({
                                id: order.id,
                                status: 'cancelled'
                              })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour les détails de commande
function OrderDetailsModal({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Détails de la Commande #{order.id}</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{order.customerName || 'Client anonyme'}</span>
            </div>
            {order.customerEmail && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Email:</span>
                <span className="text-sm">{order.customerEmail}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{order.customerPhone}</span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <span className="text-sm">{order.deliveryAddress}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Statut:</span>
              {order.status && getStatusBadge(order.status)}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total:</span>
              <span className="font-medium">{order.totalAmount?.toFixed(2) || '0.00'}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Créée le:</span>
              <span className="text-sm">
                {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'N/A'}
              </span>
            </div>
            {order.updatedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Modifiée le:</span>
                <span className="text-sm">
                  {format(new Date(order.updatedAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {order.items && order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Articles de la Commande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">{item.menuItemName}</div>
                    <div className="text-sm text-gray-500">Quantité: {item.quantity}</div>
                    {item.notes && (
                      <div className="text-xs text-gray-400 mt-1">Note: {item.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.price?.toFixed(2) || '0.00'}€</div>
                    <div className="text-sm text-gray-500">
                      Total: {((item.price || 0) * item.quantity).toFixed(2)}€
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composant pour créer une nouvelle commande
function NewOrderForm({ menuItems, onSubmit, isLoading }: { 
  menuItems: any[], 
  onSubmit: (data: any) => void,
  isLoading: boolean 
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: '',
    items: [] as any[]
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { menuItemId: '', quantity: 1, notes: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Nom du client"
          value={formData.customerName}
          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
          required
        />
        <Input
          type="email"
          placeholder="Email du client"
          value={formData.customerEmail}
          onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
        />
        <Input
          type="tel"
          placeholder="Téléphone du client"
          value={formData.customerPhone}
          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
        />
        <Input
          placeholder="Adresse de livraison"
          value={formData.deliveryAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Articles de la commande</h4>
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter article
          </Button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
            <Select
              value={item.menuItemId}
              onValueChange={(value) => updateItem(index, 'menuItemId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner article" />
              </SelectTrigger>
              <SelectContent>
                {menuItems.map((menuItem: any) => (
                  <SelectItem key={menuItem.id} value={menuItem.id.toString()}>
                    {menuItem.name} - {menuItem.price}€
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Quantité"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
            />
            
            <Input
              placeholder="Notes (optionnel)"
              value={item.notes}
              onChange={(e) => updateItem(index, 'notes', e.target.value)}
            />
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => removeItem(index)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Textarea
        placeholder="Notes pour la commande"
        value={formData.notes}
        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
      />

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading || formData.items.length === 0}>
          {isLoading ? 'Création...' : 'Créer Commande'}
        </Button>
      </div>
    </form>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">En Attente</Badge>;
    case 'confirmed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Confirmée</Badge>;
    case 'preparing':
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Préparation</Badge>;
    case 'ready':
      return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Prête</Badge>;
    case 'delivered':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Livrée</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Annulée</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}