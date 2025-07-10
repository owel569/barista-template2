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
  Package
} from 'lucide-react';

interface Order {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  total: number;
  status: string;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Commandes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des commandes du café
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
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
          En attente ({orders.filter(o => o.status === 'en_attente').length})
        </Button>
        <Button
          variant={filter === 'en_preparation' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('en_preparation')}
        >
          En préparation ({orders.filter(o => o.status === 'en_preparation').length})
        </Button>
        <Button
          variant={filter === 'terminé' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('terminé')}
        >
          Terminées ({orders.filter(o => o.status === 'terminé').length})
        </Button>
        <Button
          variant={filter === 'annulé' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('annulé')}
        >
          Annulées ({orders.filter(o => o.status === 'annulé').length})
        </Button>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
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
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="flex items-center gap-1 mt-2">
                          <Euro className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {parseFloat(order.total.toString()).toFixed(2)}€
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Articles commandés:
                        </p>
                        <div className="space-y-1">
                          {order.items?.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                              {item.quantity}x {item.name} - {parseFloat(item.price.toString()).toFixed(2)}€
                            </div>
                          )) || (
                            <div className="text-sm text-gray-500 dark:text-gray-500 italic">
                              Détails des articles non disponibles
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Commandé le {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {order.status === 'en_attente' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'en_preparation')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Préparer
                    </Button>
                  )}
                  
                  {order.status === 'en_preparation' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'terminé')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Terminer
                    </Button>
                  )}
                  
                  {(order.status === 'en_attente' || order.status === 'en_preparation') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'annulé')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                  )}
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                : `Aucune commande avec le statut "${filter.replace('_', ' ')}" n'a été trouvée.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}