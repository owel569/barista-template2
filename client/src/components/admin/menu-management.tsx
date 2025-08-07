import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { MenuItem, MenuCategory } from '@/types/admin';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Coffee, DollarSign, Package, Image, Upload, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';
import { getItemImageUrl } from '@/lib/image-mapping';

const getImageUrlByName = (name: string): string => {
  return getItemImageUrl(name);
};


const menuItemSchema = z.object({
  name: z.string()}).min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.coerce.number().positive('Le prix doit être supérieur à 0').min(0.01, 'Prix minimum : 0,01€').max(999.99, 'Prix maximum : 999,99€'),
  categoryId: z.coerce.number().min(1, 'Veuillez sélectionner une catégorie'),
  available: z.boolean(),
  imageUrl: z.string().optional(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuManagementProps {
  userRole?: 'directeur' | 'employe';
}

export default function MenuManagement({ userRole = 'directeur' }: MenuManagementProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions(user);
  const canDelete = hasPermission('menu', 'delete');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [imageManagementItem, setImageManagementItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialiser WebSocket pour les notifications temps réel
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

  const { data: menuItems = [,], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items',],
  });

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu/categories',],
  });

  const createMutation = useMutation({
    mutationFn: async (data: MenuItemFormData})}) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/menu/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création');
      }
      return response.json();
    },
    onSuccess: () => {
      // Forcer le rechargement immédiat des données
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] )});
      queryClient.invalidateQueries({ queryKey: ['/api/menu/categories'] });
      queryClient.refetchQueries({ queryKey: ['/api/menu/items'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      setPreviewUrl('');
      form.reset({
        name: '',
        description: '',
        price: 0,
        categoryId: 0,
        available: true,
        imageUrl: '',
      });
      toast({
        title: 'Succès',
        description: 'Article de menu créé avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création de l\'article',
        variant: 'destructive',
      )});
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data })}: { id: number; data: MenuItemFormData }) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] )});
      queryClient.refetchQueries({ queryKey: ['/api/menu/items'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset({
        name: '',
        description: '',
        price: 0,
        categoryId: 0,
        available: true,
        imageUrl: '',
      });
      toast({
        title: 'Succès',
        description: 'Article mis à jour avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour de l\'article',
        variant: 'destructive',
      )});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number})}) => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/menu/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu/items'] )});
      queryClient.refetchQueries({ queryKey: ['/api/menu/items'] });
      toast({
        title: 'Succès',
        description: 'Article supprimé avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression de l\'article',
        variant: 'destructive',
      )});
    },
  });

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    try {
      // Créer une URL temporaire pour l'aperçu
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);

      // Ici, vous pourriez ajouter l'upload vers un service cloud
      // Pour l'instant, on utilise juste l'URL temporaire
      form.setValue('imageUrl', fileUrl);

      toast({
        title: 'Image téléchargée',
        description: 'L\'image a été ajoutée avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement de l\'image',
        variant: 'destructive',
      )});
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: MenuItemFormData) => {
    // MODIFICATION : Conserver l'URL personnalisée de l'utilisateur
    // Ne remplacer par l'image par défaut QUE si aucune URL n'est fournie
    if (!data.imageUrl || data.imageUrl.trim() === '') {
      data.imageUrl = getImageUrlByName(data.name);
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data )});
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: unknown) => {
    setEditingItem(item);
    const imageUrl = (item as any).imageUrl || getImageUrlByName(item.name);
    setPreviewUrl(imageUrl);
    form.reset({
      name: item.name,
      description: item.description,
      price: item.price ? parseFloat(item.price}) : 0,
      categoryId: item.categoryId,
      available: item.available,
      imageUrl: imageUrl,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleImageManagement = (item: MenuItem) => {
    setImageManagementItem(item);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setPreviewUrl('');
    form.reset({
      name: '',
      description: '',
      price: 0,
      categoryId: 0,
      available: true,
      imageUrl: '',
    });
    setIsDialogOpen(true);
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter((item: { id: number; name: string; price: string; description: string; categoryId: number; available: boolean }) => item.categoryId === parseInt(selectedCategory));

  // Calculer les statistiques
  const totalItems = menuItems.length;
  const availableItems = menuItems.filter((item: { id: number; name: string; price: string; description: string; categoryId: number; available: boolean }) => item.available).length;
  const averagePrice = menuItems.length > 0 
    ? menuItems.reduce((sum: number, item: { id: number; name: string; price: string | number; description: string; categoryId: number; available: boolean }) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        return sum + (isNaN(price) ? 0 : price);
      }, 0) / menuItems.length 
    : 0;

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestion du Menu</h1>
          <p className="text-muted-foreground">Gérez vos articles de menu et leurs prix</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            // Reset form when dialog closes
            setEditingItem(null);
            setPreviewUrl('');
            form.reset({
              name: '',
              description: '',
              price: 0,
              categoryId: 0,
              available: true,
              imageUrl: '',
            });
          }
          setIsDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Modifier l\'article' : 'Nouvel article'}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 'Modifiez les informations de cet article de menu' : 'Créez un nouvel article pour votre menu'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field )}) => (
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
                  render={({ field )}) => (
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
                    render={({ field )}) => (
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
                    render={({ field )}) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: MenuCategory) => (
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
                  name="imageUrl"
                  render={({ field )}) => (
                    <FormItem>
                      <FormLabel>Image du produit</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Link className="h-4 w-4 text-gray-500" />
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
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e.target.files?.[0])}
                              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                          {previewUrl && (
                            <div className="mt-2">
                              <img 
                                src={previewUrl)} 
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
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

      {/* Statistiques */}
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
            <div className="text-2xl font-bold">{averagePrice.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Articles du Menu</CardTitle>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category: MenuCategory) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {filteredItems.map((item: unknown) => {
                const category = categories.find((cat: unknown) => cat.id === item.categoryId);
                const imageUrl = getImageUrlByName(item.name);

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <img 
                        src={imageUrl} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = getImageUrlByName(item.name);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                    <TableCell className="font-semibold">{typeof item.price === 'number' ? (item.price || 0).toFixed(2) : parseFloat(item.price || '0').toFixed(2)}€</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category?.name || 'Sans catégorie'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.available ? 'default' : 'secondary'}>
                        {item.available ? 'Disponible' : 'Indisponible'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleImageManagement(item)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
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
                  <TableCell colSpan={7)} className="text-center text-muted-foreground">
                    Aucun article trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de gestion d'images */}
      {imageManagementItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gestion des images - {imageManagementItem.name)}</h2>
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