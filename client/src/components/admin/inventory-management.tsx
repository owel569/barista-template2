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
import { Progress } from '@/components/ui/progress';
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
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  TrendingDown, 
  Package2,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Filter,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  category?: string;
  lastRestocked?: string;
}

interface InventoryManagementProps {
  userRole: 'directeur' | 'employe';
}

export default function InventoryManagement({ userRole }: InventoryManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Récupérer l'inventaire
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/admin/inventory'],
    retry: 3,
  });

  // Récupérer les alertes
  const { data: alerts = [] } = useQuery({
    queryKey: ['/api/admin/inventory/alerts'],
    retry: 3,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Omit<InventoryItem, 'id'>) => 
      apiRequest('/api/admin/inventory', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      setIsAddDialogOpen(false);
      toast({ title: "Article ajouté", description: "L'article a été ajouté à l'inventaire" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: InventoryItem) =>
      apiRequest(`/api/admin/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      setEditingItem(null);
      toast({ title: "Article mis à jour", description: "L'article a été modifié" });
    }
  });

  // Calculs et statistiques
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
  const outOfStockItems = inventory.filter(item => item.currentStock === 0);
  const criticalItems = inventory.filter(item => item.currentStock < item.minStock * 0.5);

  // Filtrage
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'low' && item.currentStock <= item.minStock) ||
      (statusFilter === 'critical' && item.currentStock < item.minStock * 0.5) ||
      (statusFilter === 'out' && item.currentStock === 0) ||
      (statusFilter === 'normal' && item.currentStock > item.minStock);
    
    return matchesSearch && matchesStatus;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: 'Rupture', color: 'bg-red-500 text-white', icon: AlertCircle };
    if (item.currentStock < item.minStock * 0.5) return { label: 'Critique', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (item.currentStock <= item.minStock) return { label: 'Faible', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown };
    return { label: 'Normal', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / item.maxStock) * 100, 100);
  };

  const handleSubmitForm = (formData: FormData) => {
    const data = {
      name: formData.get('name') as string,
      currentStock: parseInt(formData.get('currentStock') as string),
      minStock: parseInt(formData.get('minStock') as string),
      maxStock: parseInt(formData.get('maxStock') as string),
      unitCost: parseFloat(formData.get('unitCost') as string),
      supplier: formData.get('supplier') as string,
      category: formData.get('category') as string || 'Général',
    };

    if (editingItem) {
      updateMutation.mutate({ ...data, id: editingItem.id });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="p-6">Chargement de l'inventaire...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Stocks</h1>
          <p className="text-muted-foreground">Suivi et gestion de l'inventaire</p>
        </div>
        {canCreate && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un Article</DialogTitle>
                <DialogDescription>
                  Créer un nouvel article dans l'inventaire
                </DialogDescription>
              </DialogHeader>
              <form action={handleSubmitForm} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de l'article</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentStock">Stock actuel</Label>
                    <Input id="currentStock" name="currentStock" type="number" required />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Stock minimum</Label>
                    <Input id="minStock" name="minStock" type="number" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxStock">Stock maximum</Label>
                    <Input id="maxStock" name="maxStock" type="number" required />
                  </div>
                  <div>
                    <Label htmlFor="unitCost">Coût unitaire (€)</Label>
                    <Input id="unitCost" name="unitCost" type="number" step="0.01" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <Input id="supplier" name="supplier" required />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Input id="category" name="category" placeholder="Général" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Ajout...' : 'Ajouter l\'Article'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              Total Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Valeur Totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Stock Faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Ruptures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Alertes de Stock ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center gap-2">
                    <Package2 className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{alert.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-orange-700">
                    Stock: {alert.currentStock}/{alert.minStock}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'normal', 'low', 'critical', 'out'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Tous' :
                   status === 'normal' ? 'Normal' :
                   status === 'low' ? 'Faible' :
                   status === 'critical' ? 'Critique' : 'Rupture'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table d'inventaire */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire ({filteredInventory.length} articles)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Coût Unitaire</TableHead>
                <TableHead>Valeur</TableHead>
                {(canUpdate || canDelete) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const StatusIcon = status.icon;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category || 'Général'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {item.currentStock} / {item.maxStock}
                        </div>
                        <Progress value={getStockPercentage(item)} className="h-2" />
                        <div className="text-xs text-gray-500">
                          Min: {item.minStock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400" />
                        {item.supplier}
                      </div>
                    </TableCell>
                    <TableCell>{item.unitCost.toFixed(2)}€</TableCell>
                    <TableCell className="font-medium">
                      {(item.currentStock * item.unitCost).toFixed(2)}€
                    </TableCell>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <div className="flex gap-2">
                          {canUpdate && (
                            <Dialog open={editingItem?.id === item.id} onOpenChange={(open) => !open && setEditingItem(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Modifier {item.name}</DialogTitle>
                                  <DialogDescription>
                                    Mettre à jour les informations de l'article
                                  </DialogDescription>
                                </DialogHeader>
                                <form action={handleSubmitForm} className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-name">Nom de l'article</Label>
                                    <Input id="edit-name" name="name" defaultValue={item.name} required />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="edit-currentStock">Stock actuel</Label>
                                      <Input id="edit-currentStock" name="currentStock" type="number" defaultValue={item.currentStock} required />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-minStock">Stock minimum</Label>
                                      <Input id="edit-minStock" name="minStock" type="number" defaultValue={item.minStock} required />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="edit-maxStock">Stock maximum</Label>
                                      <Input id="edit-maxStock" name="maxStock" type="number" defaultValue={item.maxStock} required />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-unitCost">Coût unitaire (€)</Label>
                                      <Input id="edit-unitCost" name="unitCost" type="number" step="0.01" defaultValue={item.unitCost} required />
                                    </div>
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-supplier">Fournisseur</Label>
                                    <Input id="edit-supplier" name="supplier" defaultValue={item.supplier} required />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-category">Catégorie</Label>
                                    <Input id="edit-category" name="category" defaultValue={item.category || 'Général'} />
                                  </div>
                                  <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? 'Mise à jour...' : 'Mettre à Jour'}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}