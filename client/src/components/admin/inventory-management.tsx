import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingDown, 
  TrendingUp, 
  DollarSign,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
  X
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
// import { InventoryItemForm } from './inventory-item-form';

type InventoryStatus = 'ok' | 'low' | 'critical' | 'out';

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  lastRestocked: string;
  status: InventoryStatus;
  barcode?: string;
  location?: string;
}

type AlertSeverity = 'low' | 'critical' | 'out';

interface StockAlert {
  id: number;
  itemId: number;
  itemName: string;
  currentStock: number;
  minStock: number;
  severity: AlertSeverity;
  createdAt: string;
  resolved?: boolean;
  message: string;
  type: string;
  priority: string;
}

interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  leadTime: number;
}

export default function InventoryManagement() : JSX.Element {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: keyof InventoryItem; direction: 'ascending' | 'descending'} | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    description: false,
    barcode: false,
    location: false,
    lastRestocked: true,
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [itemsRes, alertsRes, suppliersRes] = await Promise.all([
        fetch('/api/admin/inventory/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/inventory/alerts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/inventory/suppliers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        const processedItems = (itemsData || []).map((item: Record<string, unknown>) => ({
          ...item,
          currentStock: Number(item.currentStock) || 0,
          minStock: Number(item.minStock) || 0,
          maxStock: Number(item.maxStock) || 0,
          unitCost: Number(item.unitCost) || 0,
          status: calculateStatus(
            Number(item.currentStock) || 0,
            Number(item.minStock) || 0
          )
        }));
        setItems(processedItems);
      }

      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        const processedAlerts = Array.isArray(alertsData) ? alertsData.map((alert: Record<string, unknown>) => ({
          id: alert.id || Date.now(),
          itemId: alert.itemId || 0,
          itemName: alert.itemName || 'Unknown Item',
          severity: alert.severity || 'low',
          createdAt: alert.createdAt || new Date().toISOString(),
          message: alert.message || 'Stock alert',
          type: alert.type || 'low_stock',
          priority: alert.priority || 'low',
          currentStock: alert.currentStock || 0,
          minStock: alert.minStock || 0
        })) : [];
        setAlerts(processedAlerts);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (currentStock: number, minStock: number): InventoryStatus => {
    if (currentStock === 0) return 'out';
    if (currentStock <= minStock * 0.2) return 'critical';
    if (currentStock <= minStock * 0.5) return 'low';
    return 'ok';
  };

  const requestSort = (key: keyof InventoryItem) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    if (!sortConfig) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === undefined || bValue === undefined) {
        return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const getStatusColor = (status: InventoryStatus) => {
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

  const getStatusText = (status: InventoryStatus) => {
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
        toast.success('Stock mis à jour avec succès');
        await fetchInventory();
      } else {
        toast.error('Erreur lors de la mise à jour du stock');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      toast.error('Erreur lors de la mise à jour du stock');
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/inventory/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Article supprimé avec succès');
        await fetchInventory();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/inventory/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Alerte résolue');
        await fetchInventory();
      } else {
        toast.error('Erreur lors de la résolution de l\'alerte');
      }
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'alerte:', error);
      toast.error('Erreur lors de la résolution de l\'alerte');
    }
  };

  const exportInventory = () => {
    // Format data for CSV export
    const headers = [
      'ID', 'Nom', 'Catégorie', 'Stock Actuel', 'Stock Min', 'Stock Max',
      'Coût Unitaire', 'Fournisseur', 'Dernière Réappro', 'Statut'
    ];

    const data = filteredItems.map(item => [
      item.id,
      item.name,
      item.category,
      item.currentStock,
      item.minStock,
      item.maxStock,
      item.unitCost,
      item.supplier,
      item.lastRestocked,
      getStatusText(item.status)
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventaire_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [...new Set(items.map(item => item.category))];
  const supplierNames = [...new Set(items.map(item => item.supplier))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode?.includes(searchTerm);

    const matchesCategory = selectedCategories.length === 0 || 
                          selectedCategories.includes(item.category);

    const matchesSupplier = selectedSuppliers.length === 0 || 
                          selectedSuppliers.includes(item.supplier);

    return matchesSearch && matchesCategory && matchesSupplier;
  });

  const sortedItems = getSortedItems();
  const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const lowStockItems = items.filter(item => item.status === 'low' || item.status === 'critical').length;
  const outOfStockItems = items.filter(item => item.status === 'out').length;
  const activeAlerts = alerts.filter(alert => !alert.resolved);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportInventory}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Article
          </Button>
        </div>
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
            Alertes {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{activeAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Catégories
                  {selectedCategories.length > 0 && (
                    <Badge className="ml-2">{selectedCategories.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {categories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev =>
                        checked
                          ? [...prev, category]
                          : prev.filter(c => c !== category)
                      );
                    }}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Fournisseurs
                  {selectedSuppliers.length > 0 && (
                    <Badge className="ml-2">{selectedSuppliers.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {supplierNames.map(supplier => (
                  <DropdownMenuCheckboxItem
                    key={supplier}
                    checked={selectedSuppliers.includes(supplier)}
                    onCheckedChange={(checked) => {
                      setSelectedSuppliers(prev =>
                        checked
                          ? [...prev, supplier]
                          : prev.filter(s => s !== supplier)
                      );
                    }}
                  >
                    {supplier}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Colonnes
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {Object.entries(columnVisibility).map(([key, visible]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visible}
                    onCheckedChange={(checked) => {
                      setColumnVisibility(prev => ({
                        ...prev,
                        [key]: checked
                      }));
                    }}
                  >
                    {key === 'description' && 'Description'}
                    {key === 'barcode' && 'Code-barres'}
                    {key === 'location' && 'Emplacement'}
                    {key === 'lastRestocked' && 'Dernière réappro'}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => requestSort('name')}
                  >
                    <div className="flex items-center">
                      Nom
                      {sortConfig?.key === 'name' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  {columnVisibility.description && (
                    <TableHead>Description</TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer" 
                    onClick={() => requestSort('category')}
                  >
                    <div className="flex items-center">
                      Catégorie
                      {sortConfig?.key === 'category' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  {columnVisibility.barcode && (
                    <TableHead>Code-barres</TableHead>
                  )}
                  {columnVisibility.location && (
                    <TableHead>Emplacement</TableHead>
                  )}
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => requestSort('currentStock')}
                  >
                    <div className="flex items-center justify-end">
                      Stock
                      {sortConfig?.key === 'currentStock' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead 
                    className="cursor-pointer text-right" 
                    onClick={() => requestSort('unitCost')}
                  >
                    <div className="flex items-center justify-end">
                      Coût
                      {sortConfig?.key === 'unitCost' && (
                        sortConfig.direction === 'ascending' ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Fournisseur</TableHead>
                  {columnVisibility.lastRestocked && (
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => requestSort('lastRestocked')}
                    >
                      <div className="flex items-center">
                        Dernière réappro
                        {sortConfig?.key === 'lastRestocked' && (
                          sortConfig.direction === 'ascending' ? 
                          <ChevronUp className="h-4 w-4 ml-1" /> : 
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                  )}
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.length > 0 ? (
                  sortedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      {columnVisibility.description && (
                        <TableCell className="max-w-xs truncate">
                          {item.description || '-'}
                        </TableCell>
                      )}
                      <TableCell>{item.category}</TableCell>
                      {columnVisibility.barcode && (
                        <TableCell>{item.barcode || '-'}</TableCell>
                      )}
                      {columnVisibility.location && (
                        <TableCell>{item.location || '-'}</TableCell>
                      )}
                      <TableCell className="text-right">{item.currentStock}</TableCell>
                      <TableCell className="text-right">{item.minStock}</TableCell>
                      <TableCell className="text-right">{item.maxStock}</TableCell>
                      <TableCell className="text-right">{item.unitCost.toFixed(2)}€</TableCell>
                      <TableCell>{item.supplier}</TableCell>
                      {columnVisibility.lastRestocked && (
                        <TableCell>
                          {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Input
                            type="number"
                            placeholder="Qté"
                            className="w-20"
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center">
                      Aucun article trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {activeAlerts.length} alertes actives
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchInventory()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {activeAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
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
              {activeAlerts.map((alert) => (
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
                          {new Date(alert.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Résoudre
                        </Button>
                      </div>
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
                {suppliers.map((supplier) => {
                  const supplierItems = items.filter(item => item.supplier === supplier.name);
                  const totalValue = supplierItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
                  const criticalItems = supplierItems.filter(item => item.status === 'critical' || item.status === 'out').length;

                  return (
                    <div key={`supplier-${supplier.id}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{supplier.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {supplier.contact} • {supplier.email} • {supplier.phone}
                          </p>
                        </div>
                        <Badge variant="outline">{supplierItems.length} articles</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Délai livraison:</span>
                          <p className="font-medium">{supplier.leadTime} jours</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Valeur totale:</span>
                          <p className="font-medium">{totalValue.toFixed(2)}€</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Articles critiques:</span>
                          <p className="font-medium text-red-600">{criticalItems}</p>
                        </div>
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
                  {categories.map((category) => {
                    const categoryItems = items.filter(item => item.category === category);
                    const totalValue = categoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
                    const criticalItems = categoryItems.filter(item => item.status === 'critical' || item.status === 'out').length;

                    return (
                      <div key={`category-${category}`} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{category}</span>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {categoryItems.length} articles • {criticalItems} critiques
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{totalValue.toFixed(2)}€</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {(totalValue / totalValue * 100).toFixed(1)}% du total
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
                    <span>Articles en rupture:</span>
                    <Badge variant="destructive">
                      {items.filter(item => item.status === 'out').length}
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
                  <div className="flex items-center justify-between">
                    <span>Ratio stock moyen/minimum:</span>
                    <span className="font-semibold">
                      {items.length > 0 ? 
                        (items.reduce((sum, item) => sum + item.currentStock, 0) / 
                         items.reduce((sum, item) => sum + item.minStock, 0)).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAddForm && (
        <div>
          {/* TODO: Implement InventoryItemForm for create mode */}
          <Button onClick={() => {
            setShowAddForm(false);
            fetchInventory();
          }}>Close</Button>
        </div>
      )}

      {editingItem && (
        <div>
          {/* TODO: Implement InventoryItemForm for edit mode */}
          <Button onClick={() => {
            setEditingItem(null);
            fetchInventory();
          }}>Close</Button>
        </div>
      )}
    </div>
  );
}