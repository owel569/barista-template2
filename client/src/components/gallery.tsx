import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image, Camera, MapPin, Clock, Users, Plus, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

// Données d'exemple pour la galerie - en production, ces données viendraient d'une API
const galleryImages: GalleryImage[] = [
  {
    id: 1,
    title: "Ambiance chaleureuse",
    description: "Notre salle principale avec vue panoramique",
    category: "intérieur",
    imageUrl: "https://images.pexels.com/photos/3021250/pexels-photo-3021250.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    id: 2,
    title: "Terrasse vue mer",
    description: "Notre magnifique terrasse avec vue sur l'océan",
    category: "extérieur",
    imageUrl: "https://images.pexels.com/photos/30957991/pexels-photo-30957991.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    id: 3,
    title: "Bar à jus",
    description: "Notre bar coloré avec une sélection de jus frais et boissons",
    category: "boissons",
    imageUrl: "https://images.pexels.com/photos/32659127/pexels-photo-32659127.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    id: 4,
    title: "Café signature",
    description: "Notre mélange exclusif de café arabica",
    category: "boissons",
    imageUrl: "https://images.pexels.com/photos/29799615/pexels-photo-29799615.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    id: 5,
    title: "Plats divers",
    description: "Sélection variée de nos spécialités culinaires artisanales",
    category: "plats",
    imageUrl: "https://images.pexels.com/photos/6605298/pexels-photo-6605298.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },

];

const categories = [
  { id: "all", name: "Tout", count: galleryImages.length },
  { id: "intérieur", name: "Intérieur", count: galleryImages.filter(img => img.category === "intérieur").length },
  { id: "extérieur", name: "Extérieur", count: galleryImages.filter(img => img.category === "extérieur").length },
  { id: "plats", name: "Nos Plats", count: galleryImages.filter(img => img.category === "plats").length },
  { id: "boissons", name: "Boissons", count: galleryImages.filter(img => img.category === "boissons").length }
];

export default function Gallery() : JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [newImage, setNewImage] = useState({
    title: '',
    description: '',
    category: 'intérieur',
    imageUrl: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isDirecteur = user?.role === 'directeur';

  // Récupérer les images depuis l'API
  const { data: apiImages = [], refetch } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/gallery/images');
        if (response.ok) {
          return await response.json();
        }
        return galleryImages; // Fallback aux données statiques
      } catch (error) {
        console.error('Erreur lors du chargement des images:', error);
        return galleryImages; // Fallback aux données statiques
      }
    }
  });

  const addImageMutation = useMutation({
    mutationFn: async (imageData: typeof newImage) => {
      const response = await fetch('/api/gallery/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(imageData)
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Image ajoutée avec succès' });
      setIsAddingImage(false);
      setNewImage({ title: '', description: '', category: 'intérieur', imageUrl: '' });
      refetch();
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter l\'image', variant: 'destructive' });
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await fetch(`/api/gallery/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Image supprimée avec succès' });
      refetch();
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'image', variant: 'destructive' });
    }
  });

  const handleAddImage = () => {
    if (!newImage.title || !newImage.imageUrl) {
      toast({ title: 'Erreur', description: 'Titre et URL requis', variant: 'destructive' });
      return;
    }
    addImageMutation.mutate(newImage);
  };

  const handleDeleteImage = (imageId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const images = apiImages.length > 0 ? apiImages : galleryImages;
  const filteredImages = selectedCategory === "all" 
    ? images 
    : images.filter((img: GalleryImage) => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Galerie Photos</h1>
          <p className="text-xl md:text-2xl text-amber-100 max-w-2xl mx-auto">
            Découvrez l'ambiance unique de notre café-restaurant
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className="mb-2"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
          
          {/* Bouton d'ajout pour le directeur */}
          {isDirecteur && (
            <div className="flex justify-center mt-4">
              <Button onClick={() => setIsAddingImage(true)} className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une image
              </Button>
            </div>
          )}
        </div>

        {/* Images Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredImages.map((image: GalleryImage) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-0">
                    <div className="relative group">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {isDirecteur && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <h3 className="text-white font-semibold text-lg">{image.title}</h3>
                        <p className="text-amber-200 text-sm">{image.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" aria-describedby="image-description">
                <DialogTitle className="sr-only">Image de galerie</DialogTitle>
                <div className="relative">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-amber-800">{image.title}</h3>
                    <p id="image-description" className="text-amber-600 mt-2">{image.description}</p>
                    <Badge className="mt-3" variant="outline">
                      {image.category}
                    </Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Emplacement</h3>
              <p className="text-amber-600">
                Marina Shopping Center<br />
                Boulevard des Almohades<br />
                Casablanca, Maroc
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Horaires</h3>
              <p className="text-amber-600">
                Lun - Ven : 7h00 - 22h00<br />
                Sam - Dim : 8h00 - 23h00<br />
                Service continu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Capacité</h3>
              <p className="text-amber-600">
                80 places assises<br />
                Terrasse 40 places<br />
                Réservations acceptées
              </p>
            </CardContent>
          </Card>
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-700 mb-2">
              Aucune image dans cette catégorie
            </h3>
            <p className="text-amber-600">
              Essayez une autre catégorie pour voir nos photos.
            </p>
          </div>
        )}

        {/* Dialog d'ajout d'image pour le directeur */}
        <Dialog open={isAddingImage} onOpenChange={setIsAddingImage}>
          <DialogContent className="max-w-md">
            <DialogTitle>Ajouter une nouvelle image</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle image à la galerie du restaurant
            </DialogDescription>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={newImage.title}
                  onChange={(e) => setNewImage({...newImage, title: e.target.value})}
                  placeholder="Titre de l'image"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newImage.description}
                  onChange={(e) => setNewImage({...newImage, description: e.target.value})}
                  placeholder="Description de l'image"
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={newImage.category}
                  onChange={(e) => setNewImage({...newImage, category: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="intérieur">Intérieur</option>
                  <option value="extérieur">Extérieur</option>
                  <option value="plats">Nos Plats</option>
                  <option value="boissons">Boissons</option>
                </select>
              </div>
              <div>
                <Label htmlFor="imageUrl">URL de l'image</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={newImage.imageUrl}
                  onChange={(e) => setNewImage({...newImage, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingImage(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddImage} disabled={addImageMutation.isPending}>
                  {addImageMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}