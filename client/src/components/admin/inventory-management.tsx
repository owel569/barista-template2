import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  categoryId: number;
  categoryName?: string;
  available: boolean;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  supplier?: string;
  cost?: number;
  imageUrl?: string;
}

interface StockAlert {
  id: number;
  itemId: number;
  itemName: string;
  currentStock: number;
  minStock: number;
  alertLevel: 'low' | 'critical' | 'out';
  createdAt: string;
}

interface InventoryStats {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  avgCostPerItem: number;
}

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États pour le formulaire d'ajout/modification
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '',
    minStock: '',
    maxStock: '',
    supplier: '',
    cost: '',
    available: true
  });

  // Récupérer les données
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/admin/inventory/items'],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/menu/categories'],
  });

  const { data: stockAlerts = [] } = useQuery<StockAlert[]>({
    queryKey: ['/api/admin/inventory/alerts'],
  });

  const { data: inventoryStats } = useQuery<InventoryStats>({
    queryKey: ['/api/admin/inventory/stats'],
  });

  // Mutations
  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      return await apiRequest(`/api/admin/inventory/items/${id}/stock`, 'PUT', { stock });
    },
    onSuccess: () => {
      toast({
        title: "Stock mis à jour",
        description: "Le stock a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le stock.",
        variant: "destructive",
      });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/admin/inventory/items/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Article mis à jour",
        description: "L'article a été mis à jour avec succès.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'article.",
        variant: "destructive",
      });
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/inventory/items', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Article ajouté",
        description: "L'article a été ajouté avec succès.",
      });
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        stock: '',
        minStock: '',
        maxStock: '',
        supplier: '',
        cost: '',
        available: true
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article.",
        variant: "destructive",
      });
    }
  });

  // Filtrage des articles
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.categoryId.toString() === filterCategory;
    const matchesStock = filterStock === 'all' || 
                        (filterStock === 'low' && (item.stock || 0) <= (item.minStock || 5)) ||
                        (filterStock === 'out' && (item.stock || 0) === 0) ||
                        (filterStock === 'available' && item.available);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (item: MenuItem): { status: string; color: string; icon: React.ReactNode } => {
    const stock = item.stock || 0;
    const minStock = item.minStock || 5;
    
    if (stock === 0) {
      return { status: 'Rupture', color: 'bg-red-100 text-red-800', icon: <AlertCircle className="h-3 w-3" /> };
    } else if (stock <= minStock) {
      return { status: 'Stock faible', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-3 w-3" /> };
    } else {
      return { status: 'En stock', color: 'bg-green-100 text-green-800', icon: <Package className="h-3 w-3" /> };
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId.toString(),
      stock: item.stock?.toString() || '',
      minStock: item.minStock?.toString() || '',
      maxStock: item.maxStock?.toString() || '',
      supplier: item.supplier || '',
      cost: item.cost?.toString() || '',
      available: item.available
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      categoryId: parseInt(formData.categoryId),
      stock: formData.stock ? parseInt(formData.stock) : undefined,
      minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
      maxStock: formData.maxStock ? parseInt(formData.maxStock) : undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined
    };

    if (selectedItem) {
      updateItemMutation.mutate({ id: selectedItem.id, data: submitData });
    } else {
      addItemMutation.mutate(submitData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Gestion des Stocks</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un article
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total articles</p>
                <p className="text-2xl font-bold">{inventoryStats?.totalItems || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{inventoryStats?.availableItems || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock faible</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats?.lowStockItems || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rupture</p>
                <p className="text-2xl font-bold text-red-600">{inventoryStats?.outOfStockItems || 0}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les stocks</SelectItem>
                <SelectItem value="available">En stock</SelectItem>
                <SelectItem value="low">Stock faible</SelectItem>
                <SelectItem value="out">Rupture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des articles */}
      <Card>
        <CardHeader>
          <CardTitle>Articles du menu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Min</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => {
                const stockStatus = getStockStatus(item);
                const categoryName = categories.find(c => c.id === item.categoryId)?.name || 'Inconnu';
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>{categoryName}</TableCell>
                    <TableCell>{item.price}€</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.stock || 0}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newStock = prompt('Nouveau stock:', item.stock?.toString() || '0');
                            if (newStock !== null) {
                              updateStockMutation.mutate({
                                id: item.id,
                                stock: parseInt(newStock)
                              });
                            }
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{item.minStock || 5}</TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.icon}
                        <span className="ml-1">{stockStatus.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.available}
                        onCheckedChange={(checked) => {
                          updateItemMutation.mutate({
                            id: item.id,
                            data: { ...item, available: checked }
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'ajout/modification */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedItem(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Modifier l\'article' : 'Ajouter un article'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Modifiez les informations de l\'article' : 'Ajoutez un nouvel article au menu'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Prix *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Catégorie *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock initial</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock minimum</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Coût unitaire</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="available"
                checked={formData.available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
              />
              <Label htmlFor="available">Disponible à la vente</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedItem(null);
              }}>
                Annuler
              </Button>
              <Button type="submit" disabled={addItemMutation.isPending || updateItemMutation.isPending}>
                {selectedItem ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}