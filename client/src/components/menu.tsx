import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, GlassWater, Cookie, Utensils, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMenuItemImage } from "@/data/images";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  categoryId: number;
  imageUrl?: string;
  available: boolean;
}

interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

const categoryIcons = {
  cafes: Coffee,
  boissons: GlassWater,
  patisseries: Cookie,
  plats: Utensils,
};

const defaultMenuItems = {
  cafes: [
    {
      id: 1,
      name: "Espresso Classique",
      description: "Un espresso authentique aux arômes intenses et à la crema parfaite",
      price: "3.50",
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: 2,
      name: "Latte Art",
      description: "Café latte avec mousse de lait onctueuse et motifs artistiques",
      price: "4.80",
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: 3,
      name: "Cappuccino Premium",
      description: "Équilibre parfait entre espresso, lait vapeur et mousse veloutée",
      price: "4.20",
      imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    }
  ],
  boissons: [
    {
      id: 4,
      name: "Thé Vert Premium",
      description: "Sélection de thés verts d'exception",
      price: "3.80"
    },
    {
      id: 5,
      name: "Chocolat Chaud",
      description: "Chocolat artisanal à la chantilly",
      price: "4.50"
    },
    {
      id: 6,
      name: "Smoothie du Jour",
      description: "Fruits frais de saison",
      price: "5.20"
    }
  ],
  patisseries: [
    {
      id: 7,
      name: "Croissants Artisanaux",
      description: "Croissants au beurre, feuilletés à la perfection",
      price: "2.80",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: 8,
      name: "cookies au chocolat",
      description: "Assortiment de macarons aux saveurs variées",
      price: "6.50",
      imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: 9,
      name: "Gâteau au Chocolat",
      description: "Fondant au chocolat noir avec fruits rouges",
      price: "5.90",
      imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    }
  ],
  plats: [
    {
      id: 10,
      name: "Sandwich Club",
      description: "Sandwich club traditionnel avec frites maison",
      price: "8.90"
    },
    {
      id: 11,
      name: "Salade César",
      description: "Salade fraîche avec poulet grillé et parmesan",
      price: "9.50"
    },
    {
      id: 12,
      name: "Quiche Lorraine",
      description: "Quiche traditionnelle avec salade verte",
      price: "7.80"
    }
  ]
};

export default function Menu() {
  const [activeTab, setActiveTab] = useState("cafes");
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu/categories"]
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu/items"]
  });

  // Use default categories if API data is not available
  const defaultCategories = [
    { id: 1, name: "Cafés", slug: "cafes", displayOrder: 1 },
    { id: 2, name: "Boissons", slug: "boissons", displayOrder: 2 },
    { id: 3, name: "Pâtisseries", slug: "patisseries", displayOrder: 3 },
    { id: 4, name: "Plats", slug: "plats", displayOrder: 4 }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  
  // Filtrer les éléments par catégorie
  const getItemsByCategory = (categorySlug: string) => {
    if (menuItems.length === 0) return defaultMenuItems[categorySlug as keyof typeof defaultMenuItems] || [];
    
    const categoryId = displayCategories.find(cat => cat.slug === categorySlug)?.id;
    if (!categoryId) return [];
    
    return menuItems.filter((item: any) => item.categoryId === categoryId || item.category_id === categoryId);
  };
  
  const displayItems = getItemsByCategory(activeTab);

  const handleAddToCart = (item: any) => {
    toast({
      title: "Ajouté au panier",
      description: `${item.name} a été ajouté à votre commande`,
    });
  };

  return (
    <section id="menu" className="py-20 bg-coffee-cream">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-coffee-dark mb-4">
            Notre Menu
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Découvrez notre sélection de cafés d'exception, boissons artisanales et délices culinaires
          </p>
        </div>

        {/* Menu Navigation */}
        <div className="flex flex-wrap justify-center mb-12 gap-4">
          {displayCategories.map((category) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Coffee;
            return (
              <Button
                key={category.id}
                onClick={() => setActiveTab(category.slug)}
                className={`px-6 py-2 rounded-full font-semibold transition duration-300 ${
                  activeTab === category.slug
                    ? "bg-coffee-accent text-white"
                    : "bg-white text-coffee-dark hover:bg-coffee-accent hover:text-white"
                }`}
              >
                <IconComponent className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Menu Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayItems.map((item: any) => (
            <Card key={item.id} className="bg-white shadow-lg overflow-hidden hover:transform hover:scale-105 transition duration-300">
              <div className="w-full h-48 bg-coffee-light/20 overflow-hidden">
                <img 
                  src={item.imageUrl || item.image_url || getMenuItemImage(item.name)} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getMenuItemImage(item.name);
                  }}
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-coffee-dark mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {item.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-coffee-accent">
                    {item.price}€
                  </span>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="bg-coffee-dark hover:bg-coffee-accent text-white px-4 py-2 rounded-lg transition duration-300"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
