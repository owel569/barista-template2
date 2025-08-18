import React from 'react';
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Coffee, Pizza, Utensils, Beef, Clock, Wine, IceCream, Sandwich } from "lucide-react";
import { getItemImageUrl } from "@/lib/image-mapping";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
  preparationTime?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}

interface MenuCategory {
  id: number;
  name: string;
  description: string;
  slug: string;
}

const categoryIcons = {
  "Petit déjeuner": Coffee,
  "Crêpes": ChefHat,
  "Pizza": Pizza,
  "Pâtes": Utensils,
  "Les Jus": Wine,
  "Déjeuner & Dîner": Beef,
  "Café": Coffee,
  "Boissons": Wine,
  "Desserts": IceCream,
  "Sandwichs": Sandwich,
};

export default function MenuPage(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { addItem } = useCart();

  const { data: categoriesResponse, isLoading: categoriesLoading, error: categoriesError } = useQuery<{ categories: MenuCategory[] }>({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const response = await fetch("/api/menu/categories");
      if (!response.ok) throw new Error("Erreur lors du chargement des catégories");
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 heure de cache
  });

  const { data: itemsResponse, isLoading: itemsLoading, error: itemsError } = useQuery<{ items: MenuItem[] }>({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const response = await fetch("/api/menu/items");
      if (!response.ok) throw new Error("Erreur lors du chargement des articles");
      return response.json();
    },
  });

  const categories = categoriesResponse?.categories || [];
  const menuItems = itemsResponse?.items || [];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category?.id?.toString() === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName as keyof typeof categoryIcons] || Utensils;
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) {
      toast.warning("Cet article n'est pas disponible actuellement");
      return;
    }
    
    addItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: getItemImageUrl(item.name, item.category?.slug || 'default'),
    });
    
    toast.success(`${item.name} ajouté au panier`);
  };

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12 space-y-4">
            <Skeleton className="h-12 w-48 mx-auto" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="aspect-video w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categoriesError || itemsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">
            {categoriesError ? "Erreur de chargement des catégories" : "Erreur de chargement du menu"}
          </h2>
          <p className="text-amber-600 mb-6">
            {categoriesError?.message || itemsError?.message}
          </p>
          <Button 
            variant="default" 
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Notre Menu</h1>
          <p className="text-xl md:text-2xl text-amber-100 max-w-2xl mx-auto">
            Découvrez nos spécialités préparées avec passion et des ingrédients de qualité
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Rechercher un plat ou un ingrédient..."
              className="w-full px-4 py-2 rounded-full border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="mb-2 shadow-sm"
            >
              Tout voir
            </Button>
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className="mb-2 shadow-sm"
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
            >
              {/* Image with fallback */}
              <div className="aspect-video bg-amber-100/20 overflow-hidden relative">
                <img
                  src={getItemImageUrl(item.name, item.category?.slug || 'default')}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = getItemImageUrl('default', 'default');
                  }}
                />
                {!item.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold bg-amber-800/90 px-3 py-1 rounded-full text-sm">
                      Indisponible
                    </span>
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant={item.available ? "default" : "secondary"}>
                    {item.available ? "Disponible" : "Indisponible"}
                  </Badge>
                </div>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>

              <CardContent className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-amber-600">{item.price.toFixed(2)}€</span>
                  <Badge variant="outline" className="text-xs">
                    {item.category?.name || 'Non classé'}
                  </Badge>
                </div>

                {/* Dietary badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.isVegetarian && (
                    <Badge variant="secondary" className="text-xs">
                      Végétarien
                    </Badge>
                  )}
                  {item.isVegan && (
                    <Badge variant="secondary" className="text-xs">
                      Vegan
                    </Badge>
                  )}
                  {item.isGlutenFree && (
                    <Badge variant="secondary" className="text-xs">
                      Sans gluten
                    </Badge>
                  )}
                </div>

                <Button
                  variant="default"
                  className="w-full mt-2 bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.available}
                >
                  Ajouter au panier
                </Button>

                {item.preparationTime && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    Préparation: ~{item.preparationTime} min
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-amber-700 mb-2">
              {searchTerm ? "Aucun résultat pour votre recherche" : "Aucun plat dans cette catégorie"}
            </h3>
            <p className="text-amber-600">
              {searchTerm 
                ? "Essayez avec d'autres termes ou explorez nos catégories."
                : "Essayez une autre catégorie ou revenez plus tard."}
            </p>
            {searchTerm && (
              <Button 
                variant="ghost" 
                onClick={() => setSearchTerm("")}
                className="mt-4 text-amber-600"
              >
                Réinitialiser la recherche
              </Button>
            )}
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-amber-800 mb-3">Informations</h3>
              <ul className="space-y-2 text-amber-700">
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Tous nos plats sont préparés à la commande</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Ingrédients frais et de qualité</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Options végétariennes et vegan disponibles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Allergies : merci de nous prévenir</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-amber-800 mb-3">Horaires de service</h3>
              <ul className="space-y-2 text-amber-700">
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Lundi - Vendredi : 7h00 - 22h00</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Samedi - Dimanche : 8h00 - 23h00</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Service continu toute la journée</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-500 mr-2">•</span>
                  <span>Réservations recommandées le soir</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}