import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MenuItem, MenuCategory } from '@/types/admin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Coffee, DollarSign, Package, Image as ImageIcon, Upload, Link as LinkIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';
import { getItemImageUrl } from '@/lib/image-mapping';
import { useAuth } from '@/components/auth/AuthProvider';

const getImageUrlByName = (name: string): string => {
  return getItemImageUrl(name);
};

const menuItemSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.coerce
    .number()
    .positive('Le prix doit être supérieur à 0')
    .min(0.01, 'Prix minimum : 0,01 DH')
    .max(999.99, 'Prix maximum : 999,99 DH'),
  categoryId: z.coerce.number().min(1, 'Veuillez sélectionner une catégorie'),
  available: z.boolean(),
  imageUrl: z.string().url('Veuillez fournir une URL valide').optional().or(z.literal('')),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuManagementProps {
  userRole?: 'directeur' | 'employe';
}

export default function MenuManagement({ userRole = 'directeur' }: MenuManagementProps) {
  const { user } = useAuth();
  const { canCreate, canEdit, canDelete: canDeleteFn } = usePermissions();
  const canCreateItem = canCreate('menu');
  const canEditItem = canEdit('menu');
  const canDeleteItem = canDeleteFn('menu');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [imageManagementItem, setImageManagementItem] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useWebSocket();

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      categoryId: 0,
      available: true,
      imageUrl: '',
    },
  });

  const { data: menuItems = [], isLoading: isLoadingItems } = useQuery<MenuItem[]>({
    queryKey: ['/api/admin/menu/items'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/menu/items', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur chargement des articles');
      const result = await res.json();
      return result.success ? result.data : [];
    },
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<MenuCategory[]>({
    queryKey: ['/api/admin/menu/categories'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/menu/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur chargement des catégories');
      const result = await res.json();
      return result.success ? result.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/menu/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/menu/categories'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      setPreviewUrl('');
      form.reset({ name: '', description: '', price: 0, categoryId: 0, available: true, imageUrl: '' });
      toast({ title: 'Succès', description: "Article de menu créé avec succès" });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Erreur lors de la création de l'article", variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MenuItemFormData }) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset({ name: '', description: '', price: 0, categoryId: 0, available: true, imageUrl: '' });
      toast({ title: 'Succès', description: 'Article mis à jour avec succès' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Erreur lors de la mise à jour de l'article", variant: 'destructive' });
    },
  });

  const toggleAvailableMutation = useMutation({
    mutationFn: async ({ id, available }: { id: number; available: boolean }) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ available }),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      return response.json();
    },
    onMutate: async ({ id, available }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/menu/items'] });
      const previous = queryClient.getQueryData<MenuItem[]>(['/api/menu/items']);
      if (previous) {
        queryClient.setQueryData<MenuItem[]>(['/api/menu/items'], prev =>
          (prev ?? []).map(i => (i.id === id ? { ...i, available } : i))
        );
      }
      return { previous } as const;
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['/api/menu/items'], context.previous);
      toast({ title: 'Erreur', description: 'Impossible de changer le statut', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token ?? ''}` },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] });
      toast({ title: 'Succès', description: 'Article supprimé avec succès' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: "Erreur lors de la suppression de l'article", variant: 'destructive' });
    },
  });

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      form.setValue('imageUrl', fileUrl);
      toast({ title: 'Image téléchargée', description: "L'image a été ajoutée avec succès" });
    } catch {
      toast({ title: 'Erreur', description: "Erreur lors du téléchargement de l'image", variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: MenuItemFormData) => {
    const payload: MenuItemFormData = {
      ...data,
      imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl : getImageUrlByName(data.name),
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    const imageUrl = item.imageUrl || getImageUrlByName(item.name);
    setPreviewUrl(imageUrl);
    const priceNumber = typeof item.price === 'number' ? item.price : parseFloat(String(item.price));
    form.reset({
      name: item.name,
      description: item.description,
      price: Number.isFinite(priceNumber) ? priceNumber : 0,
      categoryId: item.categoryId,
      available: item.available,
      imageUrl: imageUrl,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (id: number) => {
    if (userRole === 'employe') {
      toast.toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions nécessaires',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cet article du menu ?')) {
      deleteMutation.mutate(id);
    }
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setPreviewUrl('');
    form.reset({ name: '', description: '', price: 0, categoryId: 0, available: true, imageUrl: '' });
    setIsDialogOpen(true);
  };

  const filteredItems: MenuItem[] = useMemo(() => {
    const byCategory = selectedCategory === 'all'
      ? menuItems
      : menuItems.filter(item => item.categoryId === parseInt(selectedCategory, 10));
    const term = search.trim().toLowerCase();
    if (!term) return byCategory;
    return byCategory.filter(i =>
      i.name.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term)
    );
  }, [menuItems, selectedCategory, search]);

  const totalItems = menuItems.length;
  const availableItems = menuItems.filter(item => item.available).length;
  const averagePrice = menuItems.length > 0
    ? menuItems.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0), 0) / menuItems.length
    : 0;

  if (isLoadingItems || isLoadingCategories) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion du Menu</h1>
          <p className="text-muted-foreground">Gérez vos articles de menu et leurs prix</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditingItem(null);
              setPreviewUrl('');
              form.reset({ name: '', description: '', price: 0, categoryId: 0, available: true, imageUrl: '' });
            }
            setIsDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} disabled={!canCreateItem}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Modifiez les informations de cet article de menu'
                  : 'Créez un nouvel article pour votre menu'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'article</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix (DH)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="999.99"
                            placeholder="Ex: 25.50"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-xs text-muted-foreground">
                          Saisissez un prix en dirhams (DH). Min: 0,01 DH, Max: 999,99 DH
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <FormLabel>Disponibilité</FormLabel>
                        <div className="text-xs text-muted-foreground">Marquez l'article comme disponible/indisponible</div>
                      </div>
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value} 
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image du produit</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <LinkIcon className="h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="URL de l'image (https://...)"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.value);
                                setPreviewUrl(e.target.value);
                              }}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Upload className="h-4 w-4 text-gray-500" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e.target.files?.[0])}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {previewUrl && (
                            <div className="mt-2">
                              <img
                                src={previewUrl}
                                alt="Aperçu"
                                className="w-20 h-20 object-cover rounded-lg border"
                                onError={() => setPreviewUrl('')}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || (!canCreateItem && !editingItem)}>
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Enregistrement...'
                      : editingItem
                      ? 'Modifier'
                      : 'Créer'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Disponibles</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePrice.toFixed(2)} DH</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>Articles du Menu</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Rechercher par nom ou description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-72"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const category = categories.find((cat) => cat.id === item.categoryId);
                const imageUrl = item.imageUrl || getImageUrlByName(item.name);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = getImageUrlByName(item.name);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell className="font-semibold">
                      {typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(String(item.price) || '0').toFixed(2)} DH
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{category?.name || 'Sans catégorie'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.available ? 'default' : 'secondary'}>
                          {item.available ? 'Disponible' : 'Indisponible'}
                        </Badge>
                        {canEditItem && (
                          <input
                            type="checkbox"
                            checked={item.available}
                            onChange={(e) => toggleAvailableMutation.mutate({ id: item.id, available: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)} disabled={!canEditItem}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setImageManagementItem(item)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        {canDeleteItem && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun article trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {imageManagementItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion des images - {imageManagementItem.name}</h2>
              <Button variant="ghost" onClick={() => setImageManagementItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">Fonctionnalité de gestion d'images en cours de développement</p>
          </div>
        </div>
      )}
    </div>
  );
}