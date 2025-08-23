import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, AlertTriangle, TrendingUp, ShoppingCart,
  Truck, BarChart3, Plus, Minus, Search,
  Download, RefreshCw, DollarSign
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types améliorés avec des interfaces plus complètes
interface InventoryAlert {
  id: string;
  itemId: string;
  itemName: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  type: 'stock_low' | 'expiring' | 'out_of_stock';
  createdAt: string;
}

interface InventoryItemEnhanced {
  id: string;
  name: string;
  supplier: string;
  status: 'critical' | 'warning' | 'normal';
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  daysRemaining?: number;
  cost: number;
  categoryId: string;
}

interface InventoryMovement {
  id: string;
  item: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  unit: string;
  reason: string;
  user: string;
  date: string;
}

interface InventorySupplierEnhanced {
  id: string;
  name: string;
  categories: string[];
  deliveryTime: string;
  minimumOrder: number;
  reliability: number;
  rating: number;
  lastOrder: string;
}

interface InventoryPrediction {
  name: string;
  currentStock: number;
  predictions: {
    '7d': { remaining: number };
    '14d': { remaining: number };
    '30d': { remaining: number };
  };
  recommendations: {
    urgency: 'high' | 'medium' | 'low';
    reorderDate: string;
    reorderQuantity: number;
    estimatedCost: number;
  };
}

interface InventoryCategory {
  id: string;
  name: string;
  items: InventoryItemEnhanced[];
}

interface InventoryData {
  alerts: InventoryAlert[];
  statistics: {
    totalValue: number;
    lowStockItems: number;
    pendingOrders: number;
    monthlyConsumption: number;
    totalItems: number;
  };
  categories: InventoryCategory[];
}

// Composant StatsCard séparé avec typage propre
const StatsCard = ({ 
  title, 
  value, 
  icon,
  description 
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {typeof value === 'number' 
          ? value.toLocaleString('fr-FR') 
          : value}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

// Composant InventoryItemCard optimisé
const InventoryItemCard = ({ item }: { item: InventoryItemEnhanced }) => {
  const stockPercentage = Math.min(100, (item.currentStock / item.maxStock) * 100);
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.supplier}</p>
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
          <div className="text-xs text-muted-foreground">{item.unit}</div>
        </div>
        
        <div className="w-32">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Min: {item.minStock}</span>
            <span>Max: {item.maxStock}</span>
          </div>
          <Progress 
            value={stockPercentage}
            className={`w-full ${
              stockPercentage < 20 ? 'bg-red-500' :
              stockPercentage < 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
        </div>
        
        {item.daysRemaining !== undefined && (
          <div className="text-center">
            <div className={`text-sm font-medium ${
              item.daysRemaining < 7 ? 'text-red-600' :
              item.daysRemaining < 14 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {item.daysRemaining}j
            </div>
            <div className="text-xs text-muted-foreground">restants</div>
          </div>
        )}
        
        <div className="text-center">
          <div className="text-sm font-medium">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            }).format(item.cost)}
          </div>
          <div className="text-xs text-muted-foreground">/{item.unit}</div>
        </div>
        
        <div className="flex gap-1">
          <Button size="sm" variant="outline" aria-label="Diminuer stock">
            <Minus className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" aria-label="Augmenter stock">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const queryClient = useQueryClient();

  // Requêtes optimisées avec gestion d'erreur améliorée
  const { 
    data: inventory, 
    isLoading, 
    error 
  } = useQuery<InventoryData>({
    queryKey: ['inventory', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/overview');
      if (!res.ok) throw new Error('Échec du chargement des données d\'inventaire');
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000
  });

  const { data: predictions } = useQuery<InventoryPrediction[]>({
    queryKey: ['inventory', 'predictions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/predictions');
      if (!res.ok) throw new Error('Échec du chargement des prédictions');
      return res.json();
    },
    refetchInterval: 300000
  });

  const { data: suppliers } = useQuery<InventorySupplierEnhanced[]>({
    queryKey: ['inventory', 'suppliers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/suppliers');
      if (!res.ok) throw new Error('Échec du chargement des fournisseurs');
      return res.json();
    }
  });

  const { data: movements } = useQuery<InventoryMovement[]>({
    queryKey: ['inventory', 'movements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/movements');
      if (!res.ok) throw new Error('Échec du chargement des mouvements');
      return res.json();
    },
    refetchInterval: 30000
  });

  const generateOrdersMutation = useMutation({
    mutationFn: async (params: { approvalRequired: boolean }) => {
      const response = await fetch('/api/admin/inventory/orders/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token'}`
        },
        body: JSON.stringify(params});
      if (!response.ok) throw new Error('Échec de la génération des commandes');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['inventory'] 
      });
      // Ajouter une notification toast
    },
    onError: (error: Error) => {
      console.error('Erreur:', error.message);
      // Ajouter une notification toast d'erreur
    }
  });

  // Filtrage optimisé avec useMemo et typage correct
  const filteredCategories = useMemo(() => {
    if (!inventory?.categories) return [];
    
    return inventory.categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase();
          const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;
          const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
          return matchesSearch && matchesCategory && matchesStatus;
        }});)
      .filter(category => category.items.length > 0);
  }, [inventory, searchTerm, selectedCategory, selectedStatus]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[125px] w-full" />
          );}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          );}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
          <p className="text-muted-foreground">Suivi intelligent avec prédictions IA</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateOrdersMutation.mutate({ approvalRequired: true })}
            disabled={generateOrdersMutation.isPending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {generateOrdersMutation.isPending ? 'Génération...' : 'Générer Commandes'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Alertes */}
      {inventory?.alerts && inventory.alerts.length > 0 && (
        <div className="space-y-2">
          {inventory.alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.priority === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.itemName}:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          );}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Valeur totale" 
          value={inventory?.statistics.totalValue || 0} 
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="+12% vs mois dernier"
        />
        <StatsCard 
          title="Stocks faibles" 
          value={inventory?.statistics.lowStockItems || 0} 
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          description="Nécessitent attention"
        />
        <StatsCard 
          title="Commandes en cours" 
          value={inventory?.statistics.pendingOrders || 0} 
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          description="En attente livraison"
        />
        <StatsCard 
          title="Consommation" 
          value={inventory?.statistics.monthlyConsumption || 0} 
          icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
          description="Ce mois"
        />
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
          <TabsTrigger value="commandes">Commandes</TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value}
                className="pl-10"
              />
            </div>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {inventory?.categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                );}
              </SelectContent>
            </Select>
            <Select 
              value={selectedStatus} 
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des items */}
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {category.name} ({category.items.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <InventoryItemCard key={item.id} item={item} />
                    );}
                  </div>
                </CardContent>
              </Card>
            );}
          </div>
        </TabsContent>

        {/* Onglet Prédictions */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prédictions IA</CardTitle>
              <CardContent>
                <p className="text-muted-foreground">
                  Analyse prédictive basée sur l'historique de consommation
                </p>
              </CardContent>
            </CardHeader>
            <CardContent>
              {predictions && predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.map((prediction) => (
                    <div key={prediction.name} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{prediction.name}</h3>
                        <Badge variant={
                          prediction.recommendations.urgency === 'high' ? 'destructive' :
                          prediction.recommendations.urgency === 'medium' ? 'secondary' : 'default'
                        }>
                          {prediction.recommendations.urgency}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stock actuel:</span>
                          <div className="font-medium">{prediction.currentStock}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dans 7 jours:</span>
                          <div className="font-medium">{prediction.predictions['7d'].remaining}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Recommandation:</span>
                          <div className="font-medium">{prediction.recommendations.reorderQuantity}</div>
                        </div>
                      </div>
                    </div>
                  );}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Aucune prédiction disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mouvements */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mouvements de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              {movements && movements.length > 0 ? (
                <div className="space-y-3">
                  {movements.slice(0, 20).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          movement.type === 'in' ? 'default' :
                          movement.type === 'out' ? 'secondary' : 'outline'
                        }>
                          {movement.type}
                        </Badge>
                        <div>
                          <div className="font-medium">{movement.item}</div>
                          <div className="text-sm text-muted-foreground">{movement.reason}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity} {movement.unit}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(movement.date).toLocaleDateString('fr-FR'}
                        </div>
                      </div>
                    </div>
                  );}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>Aucun mouvement récent</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Fournisseurs */}
        <TabsContent value="fournisseurs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              {suppliers && suppliers.length > 0 ? (
                <div className="space-y-4">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium">{supplier.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Délai: {supplier.deliveryTime} • Commande min: {supplier.minimumOrder}€
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{supplier.rating}/5</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.reliability}% fiabilité
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Commander
                        </Button>
                        <Button size="sm" variant="outline">
                          Détails
                        </Button>
                      </div>
                    </div>
                  );}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-2" />
                  <p>Aucun fournisseur configuré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Commandes */}
        <TabsContent value="commandes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Automatiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                <p>Fonctionnalité en développement</p>
                <p className="text-sm">Gestion des commandes automatiques basée sur les prédictions IA</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryManagement;