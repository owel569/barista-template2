import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Clock, 
  Euro, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Package,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  status: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

type OrderStatus = 'all' | 'en_attente' | 'en_preparation' | 'terminé' | 'annulé';

export default function Orders(): JSX.Element {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commandes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
                            body: JSON.stringify({ status })
        });

        if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Statut de la commande mis à jour',
        });
        await fetchOrders();
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const deleteOrder = async (id: number) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Commande supprimée avec succès',
        });
        await fetchOrders();
      } else {
        throw new Error('Failed to delete order');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la commande',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'terminé':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'en_preparation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'annulé':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'terminé':
        return <CheckCircle className="h-4 w-4" />;
      case 'en_preparation':
        return <Package className="h-4 w-4" />;
      case 'en_attente':
        return <AlertCircle className="h-4 w-4" />;
      case 'annulé':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter !== 'all' && order.status !== filter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.phone.toLowerCase().includes(query) ||
        order.id.toString().includes(query) ||
                  order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    return true;
  });

  const toggleOrderExpansion = (id: number) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Commandes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des commandes du café
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher une commande..."
              className="pl-10 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({orders.length})
        </Button>
        <Button
          variant={filter === 'en_attente' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('en_attente')}
        >
          En attente ({orders.filter((o) => o.status === 'en_attente').length})
        </Button>
        <Button
          variant={filter === 'en_preparation' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('en_preparation')}
        >
          En préparation ({orders.filter((o) => o.status === 'en_preparation').length})
        </Button>
        <Button
          variant={filter === 'terminé' ? 'default' : 'outline'}
          size="sm"
                      onClick={() => setFilter('terminé')}
        >
          Terminées ({orders.filter((o) => o.status === 'terminé').length})
        </Button>
        <Button
          variant={filter === 'annulé' ? 'default' : 'outline'}
          size="sm"
                      onClick={() => setFilter('annulé')}
        >
          Annulées ({orders.filter((o) => o.status === 'annulé').length})
        </Button>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Commande #{order.id}
                        </h3>
                        <Badge className={getStatusColor(order.status}>
                          {getStatusIcon(order.status}
                          <span className="ml-1 capitalize">{order.status.replace('_', ' '}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Client:</strong> {order.customerName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Email:</strong> {order.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <strong>Téléphone:</strong> {order.phone}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-1">
                            <Euro className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              {order.total.toFixed(2}€
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Créée le {formatDate(order.createdAt}
                          </p>
                          {order.updatedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Modifiée le {formatDate(order.updatedAt}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-end md:justify-start">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleOrderExpansion(order.id}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          >
                            {expandedOrderId === order.id ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                Réduire
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                Détails
                              </>
                            }
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {order.status === 'en_attente' && (
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'en_preparation'}>
                            <Package className="h-4 w-4 mr-2" />
                            Préparer
                          </DropdownMenuItem>
                        )}
                        
                        {order.status === 'en_preparation' && (
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'terminé'}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Terminer
                          </DropdownMenuItem>
                        )}
                        
                        {(order.status === 'en_attente' || order.status === 'en_preparation') && (
                          <DropdownMenuItem 
                            onClick={() => updateOrderStatus(order.id, 'annulé'}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Annuler
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem onClick={() => toggleOrderExpansion(order.id}>
                          <Eye className="h-4 w-4 mr-2" />
                          {expandedOrderId === order.id ? 'Masquer' : 'Voir'} détails
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => deleteOrder(order.id}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {expandedOrderId === order.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Articles commandés
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="font-medium">
                              {(item.price * item.quantity).toFixed(2}€
                            </span>
                          </div>
                        );}
                      </div>
                      {order.notes && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Notes
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            {order.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all' 
                ? "Aucune commande n'a été trouvée."
                : `Aucune commande avec le statut "${filter.replace('_', ' '}" n'a été trouvée.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}