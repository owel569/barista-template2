import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit, Eye, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/auth-context';
import type { menuItems } from '@shared/schema';

type MenuItem = typeof menuItems.$inferSelect;

interface MenuItemImage {
  id: number;
  menuItemId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  uploadMethod: 'url' | 'upload' | 'generated';
  createdAt: string;
  updatedAt: string;
}

interface ImageManagementProps {
  menuItem: MenuItem;
  onClose: () => void;
}

export function ImageManagement({ menuItem, onClose }: ImageManagementProps) {
  const [isAddingImage, setIsAddingImage] = React.useState(false);
  const [editingImageId, setEditingImageId] = React.useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = React.useState('');
  const [newImageAlt, setNewImageAlt] = React.useState('');
  const [newImagePrimary, setNewImagePrimary] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Vérifier si l'utilisateur peut gérer les images
  const canManageImages = user?.role === 'directeur' || hasPermission('image_management', 'edit');
  const canDeleteImages = user?.role === 'directeur' || hasPermission('image_management', 'delete');

  // Data fetching with mock data
  const { data: images = [], isPending } = useQuery<MenuItemImage[]>({
    queryKey: ['menu-item-images', menuItem.id],
    queryFn: async () => {
      // Mock data
      return [
        {
          id: 1,
          menuItemId: menuItem.id,
          imageUrl: 'https://example.com/cafe1.jpg',
          altText: 'Cappuccino avec latte art',
          isPrimary: true,
          uploadMethod: 'url',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          menuItemId: menuItem.id,
          imageUrl: 'https://example.com/cafe2.jpg',
          altText: 'Café noir dans tasse blanche',
          isPrimary: false,
          uploadMethod: 'url',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  });

  // Mutations
  const addImageMutation = useMutation({
    mutationFn: async (imageData: Omit<MenuItemImage, 'id' | 'createdAt' | 'updatedAt'>) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...imageData, id: Math.random() };
    },
    onSuccess: (newImage) => {
      queryClient.setQueryData(['menu-item-images', menuItem.id], (old: MenuItemImage[] = []) => 
        [...old, newImage]
      );
      toast({ title: 'Image ajoutée avec succès' });
      setIsAddingImage(false);
      setNewImageUrl('');
      setNewImageAlt('');
      setNewImagePrimary(false);
    },
    onError: () => {
      toast({ 
        title: 'Erreur', 
        description: "Impossible d'ajouter l'image", 
        variant: 'destructive' 
      });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return imageId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['menu-item-images', menuItem.id], (old: MenuItemImage[] = []) => 
        old.filter(img => img.id !== deletedId)
      );
      toast({ title: 'Image supprimée avec succès' });
    },
    onError: () => {
      toast({ 
        title: 'Erreur', 
        description: "Impossible de supprimer l'image", 
        variant: 'destructive' 
      });
    }
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ imageId, updates }: { 
      imageId: number; 
      updates: Partial<MenuItemImage> 
    }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { imageId, updates };
    },
    onSuccess: ({ imageId, updates }) => {
      queryClient.setQueryData(['menu-item-images', menuItem.id], (old: MenuItemImage[] = []) => 
        old.map(img => img.id === imageId ? { ...img, ...updates } : img)
      );
      toast({ title: 'Image mise à jour avec succès' });
      setEditingImageId(null);
    },
    onError: () => {
      toast({ 
        title: 'Erreur', 
        description: "Impossible de mettre à jour l'image", 
        variant: 'destructive' 
      });
    }
  });

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast({ 
        title: 'Erreur', 
        description: 'URL d\'image requise', 
        variant: 'destructive' 
      });
      return;
    }

    addImageMutation.mutate({
      menuItemId: menuItem.id,
      imageUrl: newImageUrl,
      altText: newImageAlt || menuItem.name,
      isPrimary: newImagePrimary,
      uploadMethod: 'url'
    });
  };

  const handleDeleteImage = (imageId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleSetPrimary = (imageId: number, isPrimary: boolean) => {
    updateImageMutation.mutate({ 
      imageId, 
      updates: { isPrimary } 
    });
  };

  if (isPending) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Gestion des images - {menuItem.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Chargement des images...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestion des images - {menuItem.name}</CardTitle>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Fermer
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing images */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Images existantes ({images.length})</h3>
            {canManageImages && (
              <Button onClick={() => setIsAddingImage(true)} disabled={isAddingImage}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une image
              </Button>
            )}
          </div>

          {images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune image configurée pour cet élément.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 space-y-3">
                  <div className="relative">
                    <img 
                      src={image.imageUrl} 
                      alt={image.altText || menuItem.name}
                      className="w-full h-40 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2 space-x-1">
                      {image.isPrimary && (
                        <Badge variant="default" className="bg-green-500">
                          Principale
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {image.uploadMethod}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {image.altText || 'Sans description'}
                      </span>
                      <div className="flex space-x-1">
                        {canManageImages && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingImageId(image.id === editingImageId ? null : image.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDeleteImages && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingImageId === image.id && (
                      <div className="space-y-2 border-t pt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={image.isPrimary}
                            onCheckedChange={(checked) => handleSetPrimary(image.id, checked)}
                            disabled={image.isPrimary}
                          />
                          <Label className="text-sm">Image principale</Label>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setEditingImageId(null)}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Terminé
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add image form */}
        {isAddingImage && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="text-lg font-semibold">Ajouter une nouvelle image</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">URL de l'image *</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="imageAlt">Description (optionnel)</Label>
                <Input
                  id="imageAlt"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  placeholder={menuItem.name}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newImagePrimary}
                  onCheckedChange={setNewImagePrimary}
                />
                <Label>Image principale</Label>
              </div>

              {newImageUrl && (
                <div>
                  <Label>Aperçu :</Label>
                  <img 
                    src={newImageUrl} 
                    alt="Aperçu"
                    className="w-full h-40 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddImage}
                  disabled={addImageMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {addImageMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingImage(false);
                    setNewImageUrl('');
                    setNewImageAlt('');
                    setNewImagePrimary(false);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}