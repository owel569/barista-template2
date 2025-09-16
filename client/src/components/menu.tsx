import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, GlassWater, Cookie, Utensils, Plus } from "lucide-react";
import { getItemImageUrl } from "@/lib/image-mapping";
import { apiRequest } from '@/lib/queryClient';
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients?: string[];
  calories?: number;
  imageUrl?: string;
  image_url?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  description?: string;
  items?: MenuItem[];
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
      id: "1",
      name: "Espresso Classique",
      description: "Un espresso authentique aux arômes intenses et à la crema parfaite",
      price: "3.50",
      categoryId: "1",
      isAvailable: true,
      preparationTime: 5,
      imageUrl: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: "2",
      name: "Latte Art",
      description: "Café latte avec mousse de lait onctueuse et motifs artistiques",
      price: "4.80",
      categoryId: "1",
      isAvailable: true,
      preparationTime: 7,
      imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: "3",
      name: "Cappuccino Premium",
      description: "Équilibre parfait entre espresso, lait vapeur et mousse veloutée",
      price: "4.20",
      categoryId: "1",
      isAvailable: true,
      preparationTime: 6,
      imageUrl: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    }
  ],
  boissons: [
    {
      id: "4",
      name: "Thé Vert Premium",
      description: "Sélection de thés verts d'exception",
      price: "3.80",
      categoryId: "2",
      isAvailable: true,
      preparationTime: 4
    },
    {
      id: "5",
      name: "Chocolat Chaud",
      description: "Chocolat artisanal à la chantilly",
      price: "4.50",
      categoryId: "2",
      isAvailable: true,
      preparationTime: 5
    },
    {
      id: "6",
      name: "Smoothie du Jour",
      description: "Fruits frais de saison",
      price: "5.20",
      categoryId: "2",
      isAvailable: true,
      preparationTime: 6
    }
  ],
  patisseries: [
    {
      id: "7",
      name: "Croissants Artisanaux",
      description: "Croissants au beurre, feuilletés à la perfection",
      price: "2.80",
      categoryId: "3",
      isAvailable: true,
      preparationTime: 5,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: "8",
      name: "cookies au chocolat",
      description: "Assortiment de macarons aux saveurs variées",
      price: "6.50",
      categoryId: "3",
      isAvailable: true,
      preparationTime: 8,
      imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    },
    {
      id: "9",
      name: "Gâteau au Chocolat",
      description: "Fondant au chocolat noir avec fruits rouges",
      price: "5.90",
      categoryId: "3",
      isAvailable: true,
      preparationTime: 10,
      imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=200"
    }
  ],
  plats: [
    {
      id: "10",
      name: "Sandwich Club",
      description: "Sandwich club traditionnel avec frites maison",
      price: "8.90",
      categoryId: "4",
      isAvailable: true,
      preparationTime: 15
    },
    {
      id: "11",
      name: "Salade César",
      description: "Salade fraîche avec poulet grillé et parmesan",
      price: "9.50",
      categoryId: "4",
      isAvailable: true,
      preparationTime: 12
    },
    {
      id: "12",
      name: "Quiche Lorraine",
      description: "Quiche traditionnelle avec salade verte",
      price: "7.80",
      categoryId: "4",
      isAvailable: true,
      preparationTime: 10
    }
  ]
};

export default function Menu() : JSX.Element {
  const [activeTab, setActiveTab] = useState("cafes");
  const { addItem } = useCart();

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu/categories'],
    queryFn: () => apiRequest('/api/menu/categories'),
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
    queryFn: () => apiRequest('/api/menu/items'),
  });

  // Use default categories if API data is not available
  const defaultCategories: MenuCategory[] = [
    { id: "1", name: "Cafés", slug: "cafes", displayOrder: 1 },
    { id: "2", name: "Boissons", slug: "boissons", displayOrder: 2 },
    { id: "3", name: "Pâtisseries", slug: "patisseries", displayOrder: 3 },
    { id: "4", name: "Plats", slug: "plats", displayOrder: 4 }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  // Filtrer les éléments par catégorie
  const getItemsByCategory = (categorySlug: string) => {
    // Toujours utiliser les données de l'API si disponibles
    if (menuItems.length > 0) {
      const category = displayCategories.find(cat => cat.slug === categorySlug);
      if (!category) return [];

      return menuItems.filter((item: MenuItem) => item.categoryId === category.id);
    }

    // Utiliser les données par défaut uniquement si l'API n'a pas de données
    return defaultMenuItems[categorySlug as keyof typeof defaultMenuItems] || [];
  };

  const displayItems = getItemsByCategory(activeTab);

  const handleAddToCart = (item: MenuItem) => {
    // Utiliser le hook useCart pour ajouter l'article
    addItem({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price),
      imageUrl: getItemImageUrl(item.name),
      quantity: 1
    });

    console.log("Ajout au panier:", item);
    toast(`${item.name} a été ajouté à votre panier`);
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
          {displayItems.map((item: MenuItem) => (
            <Card key={item.id} className="bg-white shadow-lg overflow-hidden hover:transform hover:scale-105 transition duration-300">
              <div className="w-full h-48 bg-coffee-light/20 overflow-hidden">
                <img
                  src={item.imageUrl || item.image_url || getItemImageUrl(item.name, activeTab)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // En cas d'erreur, utiliser le système de mapping centralisé
                    const fallbackImage = getItemImageUrl(item.name, activeTab);
                    if (e.currentTarget.src !== fallbackImage) {
                      e.currentTarget.src = fallbackImage;
                    }
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