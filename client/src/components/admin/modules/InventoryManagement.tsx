import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Truck, 
  BarChart3,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const queryClient = useQueryClient();

  // Récupérer l'aperçu du stock
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['/api/admin/inventory/overview'],
    refetchInterval: 60000 // Actualisation chaque minute
  });

  // Récupérer les prédictions de stock
  const { data: predictions } = useQuery({
    queryKey: ['/api/admin/inventory/predictions'],
    refetchInterval: 300000 // Actualisation toutes les 5 minutes
  });

  // Récupérer les fournisseurs
  const { data: suppliersData } = useQuery({
    queryKey: ['/api/admin/inventory/suppliers']
  });

  // Récupérer les mouvements de stock
  const { data: movements } = useQuery({
    queryKey: ['/api/admin/inventory/movements'],
    refetchInterval: 30000
  });

  // Mutation pour générer des commandes automatiques
  const generateOrdersMutation = useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const response = await fetch('/api/admin/inventory/orders/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(params)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement inventaire...</p>
        </div>
      </div>
    );
  }

  const stockAlerts = inventory?.alerts || [];
  const stockStats = inventory?.statistics || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
          <p className="text-gray-600">Suivi intelligent avec prédictions IA</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateOrdersMutation.mutate({ approvalRequired: true })}
            disabled={generateOrdersMutation.isPending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Générer Commandes
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Alertes critiques */}
      {stockAlerts.length > 0 && (
        <div className="space-y-2">
          {stockAlerts.map((alert: any, index: number) => (
            <Alert key={index} variant={alert.priority === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.item}:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.totalValue?.toFixed(2) || 0}€</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stocks faibles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes en cours</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              En attente livraison
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consommation</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.monthlyConsumption?.toFixed(0) || 0}€</div>
            <p className="text-xs text-muted-foreground">
              Ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filtres de recherche */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="cafe">Café & Thé</SelectItem>
                <SelectItem value="patisserie">Pâtisserie</SelectItem>
                <SelectItem value="autres">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inventaire par catégorie */}
          <div className="space-y-6">
            {inventory?.categories?.map((category: any, categoryIndex: number) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items?.map((item: any, itemIndex: number) => (
                      <div key={itemIndex} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.supplier}</p>
                            </div>
                            <Badge variant={
                              item.status === 'critical' ? 'destructive' :
                              item.status === 'warning' ? 'secondary' : 'default'
                            }>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-bold">{item.currentStock}</div>
                            <div className="text-xs text-gray-500">{item.unit}</div>
                          </div>
                          
                          <div className="w-32">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Min: {item.minStock}</span>
                              <span>Max: {item.maxStock}</span>
                            </div>
                            <Progress 
                              value={(item.currentStock / item.maxStock) * 100} 
                              className="w-full"
                            />
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-medium">{item.daysRemaining}j</div>
                            <div className="text-xs text-gray-500">restants</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-sm font-medium">{item.cost}€</div>
                            <div className="text-xs text-gray-500">/{item.unit}</div>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Prédictions Intelligentes
                <Badge variant="outline">IA v2.1 - 89.5% précision</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {predictions?.items?.map((prediction: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{prediction.name}</h4>
                        <p className="text-sm text-gray-600">Stock actuel: {prediction.currentStock} unités</p>
                      </div>
                      <Badge variant={
                        prediction.recommendations.urgency === 'high' ? 'destructive' :
                        prediction.recommendations.urgency === 'medium' ? 'secondary' : 'default'
                      }>
                        {prediction.recommendations.urgency}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-red-600">
                          {prediction.predictions['7d']?.remaining || 0}
                        </div>
                        <div className="text-xs text-gray-600">7 jours</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-orange-600">
                          {prediction.predictions['14d']?.remaining || 0}
                        </div>
                        <div className="text-xs text-gray-600">14 jours</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-blue-600">
                          {prediction.predictions['30d']?.remaining || 0}
                        </div>
                        <div className="text-xs text-gray-600">30 jours</div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900 mb-2">Recommandations</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Date recommandée:</span>
                          <span className="font-medium">{prediction.recommendations.reorderDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantité:</span>
                          <span className="font-medium">{prediction.recommendations.reorderQuantity} unités</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Coût estimé:</span>
                          <span className="font-medium">{prediction.recommendations.estimatedCost}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {predictions?.automaticOrders?.enabled && (
                  <Card className="bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">Commandes Automatiques</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {predictions.automaticOrders.scheduled?.map((order: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <span className="font-medium">{order.item}</span>
                              <span className="text-sm text-gray-600 ml-2">- {order.quantity} unités</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{order.estimated_cost}€</span>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Mouvements de Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {movements?.movements?.map((movement: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        movement.type === 'in' ? 'default' :
                        movement.type === 'out' ? 'secondary' : 'destructive'
                      }>
                        {movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Ajustement'}
                      </Badge>
                      <div>
                        <div className="font-medium">{movement.item}</div>
                        <div className="text-sm text-gray-600">
                          {movement.reason} - {movement.user}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.type === 'in' ? '+' : ''}{movement.quantity} {movement.unit}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(movement.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliersData?.suppliers?.map((supplier: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {supplier.name}
                    <Badge variant="outline">
                      ⭐ {supplier.rating}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Catégories:</span>
                      <span className="text-sm">{supplier.categories.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Délai livraison:</span>
                      <span className="text-sm">{supplier.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commande min:</span>
                      <span className="text-sm">{supplier.minimumOrder}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fiabilité:</span>
                      <span className="text-sm">{supplier.reliability}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dernière commande:</span>
                      <span className="text-sm">{supplier.lastOrder}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        Contacter
                      </Button>
                      <Button size="sm" className="flex-1">
                        Nouvelle commande
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Gestion des Commandes
                </span>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle commande
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune commande en cours</p>
                  <p className="text-sm">Les nouvelles commandes apparaîtront ici</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManagement;