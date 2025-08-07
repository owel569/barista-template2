import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit3, Eye, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@shared/schema';

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
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImagePrimary, setNewImagePrimary] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les images existantes
  const { data: images = [,], isLoading } = useQuery({
    queryKey: ['menu-item-images', menuItem.id],
    queryFn: async (})}) => {
      const response = await fetch(`/api/admin/images/${menuItem.id)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des images');
      return response.json();
    }
  });

  // Ajouter une image
  const addImageMutation = useMutation({
    mutationFn: async (imageData: {
      menuItemId: number;
      imageUrl: string;
      altText: string;
      isPrimary: boolean;
      uploadMethod: 'url' | 'upload' | 'generated';
    })}) => {
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')})}`
        },
        body: JSON.stringify(imageData)
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ajout de l\'image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-images', menuItem.id] )});
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setIsAddingImage(false);
      setNewImageUrl('');
      setNewImageAlt('');
      setNewImagePrimary(false);
      toast({ title: 'Image ajoutée avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' )});
    }
  });

  // Supprimer une image
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number})}) => {
      const response = await fetch(`/api/admin/images/${imageId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression de l\'image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-images', menuItem.id] )});
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({ title: 'Image supprimée avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' )});
    }
  });

  // Mettre à jour une image
  const updateImageMutation = useMutation({
    mutationFn: async ({ imageId, updates })}: { imageId: number; updates: Partial<MenuItemImage> }) => {
      const response = await fetch(`/api/admin/images/${imageId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de l\'image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-images', menuItem.id] )});
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setEditingImageId(null);
      toast({ title: 'Image mise à jour avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' )});
    }
  });

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast({ title: 'Erreur', description: 'URL d\'image requise', variant: 'destructive' });
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

  const handleUpdateImage = (imageId: number, updates: Partial<MenuItemImage>) => {
    updateImageMutation.mutate({ imageId, updates )});
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Gestion des images - {menuItem.name)}</CardTitle>
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
        {/* Images existantes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Images existantes ({images.length})</h3>
            <Button onClick={() => setIsAddingImage(true)} disabled={isAddingImage}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une image
            </Button>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune image configurée pour cet élément.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image: MenuItemImage) => (
                <div key={image.id} className="border rounded-lg p-4 space-y-3">
                  <div className="relative">
                    <img 
                      src={image.imageUrl} 
                      alt={image.altText || menuItem.name}
                      className="w-full h-40 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingImageId(image.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {editingImageId === image.id && (
                      <div className="space-y-2 border-t pt-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={image.isPrimary)}
                            onCheckedChange={(checked) => 
                              handleUpdateImage(image.id, { isPrimary: checked })
                            }
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

        {/* Formulaire d'ajout d'image */}
        {isAddingImage && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <h3 className="text-lg font-semibold">Ajouter une nouvelle image</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">URL de l'image *</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={newImageUrl)}
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
                    src={newImageUrl)} 
                    alt="Aperçu"
                    className="w-full h-40 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/api/placeholder/400/300';
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