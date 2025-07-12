import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Package, Plus, Edit, Trash2, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  lastRestocked: string;
  status: 'ok' | 'low' | 'critical' | 'out';
}

interface StockAlert {
  id: number;
  itemName: string;
  currentStock: number;
  minStock: number;
  severity: 'low' | 'critical' | 'out';
  createdAt: string;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [itemsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/inventory/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/inventory/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (itemsRes.ok && alertsRes.ok) {
        const [itemsData, alertsData] = await Promise.all([
          itemsRes.json(),
          alertsRes.json()
        ]);
        
        // Traiter les données pour s'assurer que tous les nombres sont correctement formatés
        const processedItems = (itemsData || []).map((item: any) => ({
          ...item,
          currentStock: Number(item.currentStock) || 0,
          minStock: Number(item.minStock) || 0,
          maxStock: Number(item.maxStock) || 0,
          unitCost: Number(item.unitCost) || 0
        }));
        
        const processedAlerts = Array.isArray(alertsData) ? alertsData.map((alert: any) => ({
          ...alert,
          currentStock: Number(alert.currentStock) || 0,
          minStock: Number(alert.minStock) || 0
        })) : [];
        
        setItems(processedItems);
        setAlerts(processedAlerts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'critical':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'out':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ok': return 'Stock OK';
      case 'low': return 'Stock Faible';
      case 'critical': return 'Stock Critique';
      case 'out': return 'Rupture';
      default: return 'Inconnu';
    }
  };

  const updateStock = async (itemId: number, newStock: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/inventory/items/${itemId}/stock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentStock: newStock })
      });

      if (response.ok) {
        await fetchInventory();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const lowStockItems = items.filter(item => item.status === 'low' || item.status === 'critical').length;
  const outOfStockItems = items.filter(item => item.status === 'out').length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            Gestion d'Inventaire
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Suivi des stocks et alertes automatiques
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Article
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Articles
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {items.length}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valeur Totale
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalValue.toFixed(2)}€
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Stock Faible
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lowStockItems}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ruptures
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {outOfStockItems}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items">Articles</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertes {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="grid gap-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Stock actuel:</span>
                            <p className="font-medium">{item.currentStock}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Stock min:</span>
                            <p className="font-medium">{item.minStock}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Coût unitaire:</span>
                            <p className="font-medium">{item.unitCost.toFixed(2)}€</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Fournisseur:</span>
                            <p className="font-medium">{item.supplier}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Nouveau stock"
                          className="w-32"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              const newStock = parseInt(target.value);
                              if (!isNaN(newStock)) {
                                updateStock(item.id, newStock);
                                target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucune alerte active
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Tous les stocks sont dans les niveaux acceptables.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {alert.itemName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Stock actuel: {alert.currentStock} / Minimum: {alert.minStock}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge 
                        variant="destructive"
                        className={
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'low' ? 'bg-yellow-500' :
                          'bg-red-600'
                        }
                      >
                        {alert.severity === 'critical' ? 'Critique' :
                         alert.severity === 'low' ? 'Faible' : 'Rupture'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(items.map(item => item.supplier))).map((supplier, index) => {
                  const supplierItems = items.filter(item => item.supplier === supplier);
                  const totalValue = supplierItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
                  
                  return (
                    <div key={`supplier-${supplier}-${index}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{supplier}</h3>
                        <Badge variant="outline">{supplierItems.length} articles</Badge>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Valeur totale: {totalValue.toFixed(2)}€
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(items.map(item => item.category))).map((category, index) => {
                    const categoryItems = items.filter(item => item.category === category);
                    const totalValue = categoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
                    
                    return (
                      <div key={`category-${category}-${index}`} className="flex items-center justify-between">
                        <span className="font-medium">{category}</span>
                        <div className="text-right">
                          <p className="font-semibold">{totalValue.toFixed(2)}€</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {categoryItems.length} articles
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Articles en stock critique:</span>
                    <Badge variant="destructive">
                      {items.filter(item => item.status === 'critical').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Valeur moyenne par article:</span>
                    <span className="font-semibold">
                      {items.length > 0 ? (totalValue / items.length).toFixed(2) : '0.00'}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stock moyen:</span>
                    <span className="font-semibold">
                      {items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item.currentStock, 0) / items.length) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}