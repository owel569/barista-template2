import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ShoppingCart, Clock, Euro, User, Check, X, Eye, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: number;
  customerName: string;
  customerPhone?: string;
  orderType: 'sur_place' | 'emporter' | 'livraison';
  status: string;
  total: number;
  items: OrderItem[];
  notes?: string;
  tableNumber?: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersProps {
  userRole: 'directeur' | 'employe';
  user?: any;
}

export default function Orders({ userRole, user }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Actualisation automatique toutes les 15 secondes
    const interval = setInterval(() => {
      fetchOrders();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, typeFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.orderType === typeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm))
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === id ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
        ));
        toast({
          title: "Succès",
          description: `Commande ${id} mise à jour vers ${getStatusText(newStatus)}`,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'en_preparation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pret':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'servi':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'annule':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'En attente';
      case 'en_preparation':
        return 'En préparation';
      case 'pret':
        return 'Prêt';
      case 'servi':
        return 'Servi';
      case 'annule':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getOrderTypeText = (type: string) => {
    switch (type) {
      case 'sur_place':
        return 'Sur place';
      case 'emporter':
        return 'À emporter';
      case 'livraison':
        return 'Livraison';
      default:
        return type;
    }
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'sur_place':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'emporter':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'livraison':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'en_attente':
        return 'en_preparation';
      case 'en_preparation':
        return 'pret';
      case 'pret':
        return 'servi';
      default:
        return null;
    }
  };

  const getNextStatusText = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusText(nextStatus) : null;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Commandes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredOrders.length} commande(s) trouvée(s)
          </p>
        </div>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
          {userRole === 'directeur' ? 'Directeur' : 'Employé'}
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom, numéro de commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_preparation">En préparation</SelectItem>
                  <SelectItem value="pret">Prêt</SelectItem>
                  <SelectItem value="servi">Servi</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="sur_place">Sur place</SelectItem>
                  <SelectItem value="emporter">À emporter</SelectItem>
                  <SelectItem value="livraison">Livraison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setSearchTerm('');
              }} variant="outline">
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune commande trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aucune commande ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Commande #{order.id}
                      </h3>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      <Badge className={getOrderTypeColor(order.orderType)}>
                        {getOrderTypeText(order.orderType)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        <span className="font-semibold">{order.total.toFixed(2)}€</span>
                      </div>
                    </div>
                    
                    {order.tableNumber && (
                      <div className="mb-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                          Table {order.tableNumber}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{order.items.length} article(s):</span>
                      <span className="ml-2">
                        {order.items.slice(0, 3).map(item => `${item.quantity}x ${item.menuItemName}`).join(', ')}
                        {order.items.length > 3 && '...'}
                      </span>
                    </div>
                    
                    {order.notes && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <span className="font-medium">Note:</span> {order.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {order.status !== 'servi' && order.status !== 'annule' && getNextStatus(order.status) && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ChefHat className="h-4 w-4 mr-1" />
                        {getNextStatusText(order.status)}
                      </Button>
                    )}
                    
                    {order.status === 'en_attente' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'annule')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                    )}
                    
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Détails de la commande #{selectedOrder?.id}</DialogTitle>
                          <DialogDescription>
                            Consultez les détails complets de cette commande
                          </DialogDescription>
                        </DialogHeader>
                        {selectedOrder && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Client</Label>
                                <p className="text-sm font-medium">{selectedOrder.customerName}</p>
                              </div>
                              <div>
                                <Label>Statut</Label>
                                <Badge className={getStatusColor(selectedOrder.status)}>
                                  {getStatusText(selectedOrder.status)}
                                </Badge>
                              </div>
                              <div>
                                <Label>Type</Label>
                                <Badge className={getOrderTypeColor(selectedOrder.orderType)}>
                                  {getOrderTypeText(selectedOrder.orderType)}
                                </Badge>
                              </div>
                              <div>
                                <Label>Total</Label>
                                <p className="text-sm font-semibold">{selectedOrder.total.toFixed(2)}€</p>
                              </div>
                              {selectedOrder.tableNumber && (
                                <div>
                                  <Label>Table</Label>
                                  <p className="text-sm">Table {selectedOrder.tableNumber}</p>
                                </div>
                              )}
                              <div>
                                <Label>Créée le</Label>
                                <p className="text-sm">{format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Articles commandés</Label>
                              <div className="mt-2 space-y-2">
                                {selectedOrder.items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <span>{item.quantity}x {item.menuItemName}</span>
                                    <span className="font-medium">{item.total.toFixed(2)}€</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {selectedOrder.notes && (
                              <div>
                                <Label>Notes</Label>
                                <p className="text-sm">{selectedOrder.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}