import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Coffee, Pizza, Utensils, Beef, Clock } from "lucide-react";
import { getItemImageUrl } from "@/lib/image-mapping-optimized";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
  imageUrl?: string;
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
}

const categoryIcons = {
  "Petit déjeuner": Coffee,
  "Crêpes": ChefHat,
  "Pizza": Pizza,
  "Pâtes": Utensils,
  "Les Jus": Coffee,
  "Déjeuner & Dîner": Beef,
  "Café": Coffee,
  "Boissons": Coffee,
};

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/menu/categories"],
  });

  const { data: itemsResponse, isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/menu/items"],
  });

  const categories = categoriesResponse?.categories || [];
  const menuItems = itemsResponse?.items || [];

  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => {
        return item.category?.id?.toString() === selectedCategory;
      });

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName as keyof typeof categoryIcons] || Utensils;
  };

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-amber-700">Chargement du menu...</p>
          </div>
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
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="mb-2"
            >
              Tout
            </Button>
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id.toString() ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className="mb-2"
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
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image HD */}
              <div className="aspect-video bg-coffee-light/20 overflow-hidden">
                <img 
                  src={getItemImageUrl(item.name, item.category?.toLowerCase())}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    try {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = getItemImageUrl('default', item.category?.toLowerCase());
                    } catch (error) {
                      console.warn('Erreur lors du chargement de l\'image de fallback:', error);
                    }
                  }}
                />
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
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-amber-600">{item.price}€</span>
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                {!item.available && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    Temporairement indisponible
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
              Aucun plat dans cette catégorie
            </h3>
            <p className="text-amber-600">
              Essayez une autre catégorie ou revenez plus tard.
            </p>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-amber-800 mb-3">Informations</h3>
              <ul className="space-y-2 text-amber-700">
                <li>• Tous nos plats sont préparés à la commande</li>
                <li>• Ingrédients frais et de qualité</li>
                <li>• Options végétariennes disponibles</li>
                <li>• Allergies : merci de nous prévenir</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-amber-800 mb-3">Horaires</h3>
              <ul className="space-y-2 text-amber-700">
                <li>• Lundi - Vendredi : 7h00 - 22h00</li>
                <li>• Samedi - Dimanche : 8h00 - 23h00</li>
                <li>• Service continu</li>
                <li>• Réservations recommandées</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}