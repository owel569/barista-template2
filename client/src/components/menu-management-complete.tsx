import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coffee, 
  Plus, 
  Edit,
  Trash2,
  Search,
  Filter,
  Star,
  Eye,
  ChefHat,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName?: string;
  isAvailable: boolean;
  preparationTime?: number;
  calories?: number;
  allergens?: string[];
  ingredients?: string;
  imageUrl?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  popularity?: number;
  createdAt: string;
  updatedAt?: string;
}

interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  itemCount?: number;
}

interface MenuManagementProps {
  userRole: string;
}

export default function MenuManagementComplete({ userRole }: MenuManagementProps) {
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [filter, setFilter] = useState({ 
    search: "", 
    category: "all", 
    availability: "all",
    dietary: "all",
    sortBy: "name" 
  });
  
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: 0,
    preparationTime: 0,
    calories: 0,
    allergens: [] as string[],
    ingredients: "",
    imageUrl: "",
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isAvailable: true
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    displayOrder: 1,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading: loadingItems } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<MenuCategory[]>({
    queryKey: ['/api/menu/categories'],
  });

  const createItemMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest('POST', '/api/menu/items', itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      setIsItemDialogOpen(false);
      resetItemForm();
      toast({ title: "Article de menu créé avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer l'article",
        variant: "destructive" 
      });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PATCH', `/api/menu/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      setEditingItem(null);
      setIsItemDialogOpen(false);
      toast({ title: "Article mis à jour avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour l'article",
        variant: "destructive" 
      });
    }
  });

  const toggleItemAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: number; isAvailable: boolean }) => 
      apiRequest('PATCH', `/api/menu/items/${id}/availability`, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      toast({ title: "Disponibilité mise à jour" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour la disponibilité",
        variant: "destructive" 
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/menu/items/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      toast({ title: "Article supprimé avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer l'article",
        variant: "destructive" 
      });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: any) => apiRequest('POST', '/api/menu/categories', categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/categories"] });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      toast({ title: "Catégorie créée avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer la catégorie",
        variant: "destructive" 
      });
    }
  });

  const resetItemForm = () => {
    setNewItem({
      name: "",
      description: "",
      price: 0,
      categoryId: 0,
      preparationTime: 0,
      calories: 0,
      allergens: [],
      ingredients: "",
      imageUrl: "",
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isAvailable: true
    });
  };

  const resetCategoryForm = () => {
    setNewCategory({
      name: "",
      description: "",
      displayOrder: 1,
      isActive: true
    });
  };

  const getDietaryBadges = (item: MenuItem) => {
    const badges = [];
    if (item.isVegetarian) badges.push(<Badge key="veg" className="bg-green-100 text-green-800">Végétarien</Badge>);
    if (item.isVegan) badges.push(<Badge key="vegan" className="bg-emerald-100 text-emerald-800">Vegan</Badge>);
    if (item.isGlutenFree) badges.push(<Badge key="gluten" className="bg-blue-100 text-blue-800">Sans Gluten</Badge>);
    return badges;
  };

  const getPopularityColor = (popularity?: number) => {
    if (!popularity) return 'text-gray-500';
    if (popularity >= 80) return 'text-green-600';
    if (popularity >= 60) return 'text-blue-600';
    if (popularity >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredItems = menuItems
    .filter(item => {
      const matchesSearch = !filter.search || 
        item.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        item.description.toLowerCase().includes(filter.search.toLowerCase()) ||
        item.ingredients?.toLowerCase().includes(filter.search.toLowerCase());
      
      const matchesCategory = filter.category === 'all' || item.categoryId.toString() === filter.category;
      const matchesAvailability = filter.availability === 'all' || 
        (filter.availability === 'available' && item.isAvailable) ||
        (filter.availability === 'unavailable' && !item.isAvailable);
      
      const matchesDietary = filter.dietary === 'all' ||
        (filter.dietary === 'vegetarian' && item.isVegetarian) ||
        (filter.dietary === 'vegan' && item.isVegan) ||
        (filter.dietary === 'gluten-free' && item.isGlutenFree);
      
      return matchesSearch && matchesCategory && matchesAvailability && matchesDietary;
    })
    .sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.price - a.price;
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'category':
          return (a.categoryName || '').localeCompare(b.categoryName || '');
        default:
          return 0;
      }
    });

  const getMenuStats = () => {
    const availableItems = menuItems.filter(item => item.isAvailable);
    const totalRevenue = menuItems.reduce((sum, item) => sum + (item.price * (item.popularity || 0) / 100), 0);
    
    return {
      totalItems: menuItems.length,
      availableItems: availableItems.length,
      categories: categories.length,
      averagePrice: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length : 0,
      vegetarianItems: menuItems.filter(item => item.isVegetarian).length,
      popularItems: menuItems.filter(item => (item.popularity || 0) >= 70).length,
      estimatedRevenue: totalRevenue
    };
  };

  const stats = getMenuStats();

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: newItem });
    } else {
      createItemMutation.mutate(newItem);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };

  if (loadingItems || loadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-amber-500 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion du Menu</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Carte, prix et disponibilité des produits
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une Nouvelle Catégorie</DialogTitle>
              </DialogHeader>
              <CategoryForm
                category={newCategory}
                onChange={setNewCategory}
                onSubmit={handleCategorySubmit}
                isLoading={createCategoryMutation.isPending}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Modifier l\'Article' : 'Créer un Nouvel Article'}
                </DialogTitle>
              </DialogHeader>
              <MenuItemForm
                item={newItem}
                categories={categories}
                onChange={setNewItem}
                onSubmit={handleItemSubmit}
                isLoading={createItemMutation.isPending || updateItemMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Total Articles", value: stats.totalItems, color: "bg-blue-500", icon: Package },
          { label: "Disponibles", value: stats.availableItems, color: "bg-green-500", icon: CheckCircle },
          { label: "Catégories", value: stats.categories, color: "bg-purple-500", icon: Coffee },
          { label: "Prix Moyen", value: `${stats.averagePrice.toFixed(2)}€`, color: "bg-emerald-500", icon: DollarSign },
          { label: "Végétariens", value: stats.vegetarianItems, color: "bg-lime-500", icon: ChefHat },
          { label: "Populaires", value: stats.popularItems, color: "bg-orange-500", icon: Star },
          { label: "CA Estimé", value: `${stats.estimatedRevenue.toFixed(0)}€`, color: "bg-indigo-500", icon: TrendingUp },
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gestion des catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Catégories du Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map(category => {
              const itemCount = menuItems.filter(item => item.categoryId === category.id).length;
              const availableCount = menuItems.filter(item => item.categoryId === category.id && item.isAvailable).length;
              
              return (
                <div key={category.id} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-amber-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-sm text-gray-600">{availableCount}/{itemCount} disponibles</div>
                  <div className="text-xs text-gray-500">Ordre: {category.displayOrder}</div>
                  {!category.isActive && (
                    <Badge variant="secondary" className="text-xs mt-1">Inactive</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filter.category} onValueChange={(value) => setFilter(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filter.availability} onValueChange={(value) => setFilter(prev => ({ ...prev, availability: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Disponibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="available">Disponibles</SelectItem>
                <SelectItem value="unavailable">Indisponibles</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.dietary} onValueChange={(value) => setFilter(prev => ({ ...prev, dietary: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Régime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les régimes</SelectItem>
                <SelectItem value="vegetarian">Végétarien</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="gluten-free">Sans Gluten</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.sortBy} onValueChange={(value) => setFilter(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="price">Prix</SelectItem>
                <SelectItem value="popularity">Popularité</SelectItem>
                <SelectItem value="category">Catégorie</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setFilter({ search: "", category: "all", availability: "all", dietary: "all", sortBy: "name" })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Articles du Menu ({filteredItems.length})</span>
            <Badge variant="secondary">{filteredItems.length} résultat(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Infos Nutritionnelles</TableHead>
                  <TableHead>Régime</TableHead>
                  <TableHead>Popularité</TableHead>
                  <TableHead>Disponibilité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun article trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: MenuItem) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600 max-w-xs">
                            {item.description}
                          </div>
                          {item.preparationTime && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {item.preparationTime} min
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find(c => c.id === item.categoryId)?.name || 'Non assignée'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium text-lg">{item.price.toFixed(2)}€</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {item.calories && (
                            <div>{item.calories} cal</div>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="text-red-600">
                              Allergènes: {item.allergens.join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {getDietaryBadges(item)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {item.popularity ? (
                          <div className="text-center">
                            <div className={`font-medium ${getPopularityColor(item.popularity)}`}>
                              {item.popularity}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.popularity >= 80 ? 'Très populaire' :
                               item.popularity >= 60 ? 'Populaire' :
                               item.popularity >= 40 ? 'Moyen' : 'Peu populaire'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={(checked) => 
                              toggleItemAvailabilityMutation.mutate({
                                id: item.id,
                                isAvailable: checked
                              })
                            }
                          />
                          <span className={`text-sm ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {item.isAvailable ? 'Disponible' : 'Indisponible'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedItem(item)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <MenuItemDetailsModal item={item} />
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setNewItem({
                                name: item.name,
                                description: item.description,
                                price: item.price,
                                categoryId: item.categoryId,
                                preparationTime: item.preparationTime || 0,
                                calories: item.calories || 0,
                                allergens: item.allergens || [],
                                ingredients: item.ingredients || "",
                                imageUrl: item.imageUrl || "",
                                isVegetarian: item.isVegetarian || false,
                                isVegan: item.isVegan || false,
                                isGlutenFree: item.isGlutenFree || false,
                                isAvailable: item.isAvailable
                              });
                              setIsItemDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {userRole === 'directeur' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour le formulaire article de menu
function MenuItemForm({ item, categories, onChange, onSubmit, isLoading }: {
  item: any;
  categories: MenuCategory[];
  onChange: (item: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  const commonAllergens = [
    'Gluten', 'Lactose', 'Œufs', 'Arachides', 'Fruits à coque', 
    'Soja', 'Poisson', 'Crustacés', 'Céleri', 'Moutarde', 'Sésame'
  ];

  const toggleAllergen = (allergen: string) => {
    const newAllergens = item.allergens.includes(allergen)
      ? item.allergens.filter((a: string) => a !== allergen)
      : [...item.allergens, allergen];
    onChange({ ...item, allergens: newAllergens });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom de l'article</Label>
          <Input
            id="name"
            value={item.name}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Prix (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={item.price}
            onChange={(e) => onChange({ ...item, price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="categoryId">Catégorie</Label>
          <Select
            value={item.categoryId.toString()}
            onValueChange={(value) => onChange({ ...item, categoryId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preparationTime">Temps de préparation (min)</Label>
          <Input
            id="preparationTime"
            type="number"
            value={item.preparationTime}
            onChange={(e) => onChange({ ...item, preparationTime: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label htmlFor="calories">Calories</Label>
          <Input
            id="calories"
            type="number"
            value={item.calories}
            onChange={(e) => onChange({ ...item, calories: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="ingredients">Ingrédients</Label>
        <Textarea
          id="ingredients"
          value={item.ingredients}
          onChange={(e) => onChange({ ...item, ingredients: e.target.value })}
          placeholder="Liste des ingrédients séparés par des virgules"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">URL de l'image</Label>
        <Input
          id="imageUrl"
          type="url"
          value={item.imageUrl}
          onChange={(e) => onChange({ ...item, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="space-y-4">
        <Label>Allergènes</Label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {commonAllergens.map(allergen => (
            <div key={allergen} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`allergen-${allergen}`}
                checked={item.allergens.includes(allergen)}
                onChange={() => toggleAllergen(allergen)}
                className="rounded border-gray-300"
              />
              <Label htmlFor={`allergen-${allergen}`} className="text-sm">
                {allergen}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="isVegetarian"
            checked={item.isVegetarian}
            onCheckedChange={(checked) => onChange({ ...item, isVegetarian: checked })}
          />
          <Label htmlFor="isVegetarian">Végétarien</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isVegan"
            checked={item.isVegan}
            onCheckedChange={(checked) => onChange({ ...item, isVegan: checked })}
          />
          <Label htmlFor="isVegan">Vegan</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isGlutenFree"
            checked={item.isGlutenFree}
            onCheckedChange={(checked) => onChange({ ...item, isGlutenFree: checked })}
          />
          <Label htmlFor="isGlutenFree">Sans Gluten</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isAvailable"
            checked={item.isAvailable}
            onCheckedChange={(checked) => onChange({ ...item, isAvailable: checked })}
          />
          <Label htmlFor="isAvailable">Disponible</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Composant pour le formulaire catégorie
function CategoryForm({ category, onChange, onSubmit, isLoading }: {
  category: any;
  onChange: (category: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom de la catégorie</Label>
        <Input
          id="name"
          value={category.name}
          onChange={(e) => onChange({ ...category, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={category.description}
          onChange={(e) => onChange({ ...category, description: e.target.value })}
        />
      </div>
      
      <div>
        <Label htmlFor="displayOrder">Ordre d'affichage</Label>
        <Input
          id="displayOrder"
          type="number"
          value={category.displayOrder}
          onChange={(e) => onChange({ ...category, displayOrder: parseInt(e.target.value) || 1 })}
          required
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={category.isActive}
          onCheckedChange={(checked) => onChange({ ...category, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Création...' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Composant pour les détails de l'article
function MenuItemDetailsModal({ item }: { item: MenuItem }) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>{item.name}</DialogTitle>
        <DialogDescription>{item.description}</DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Prix:</span>
              <span className="font-medium text-lg">{item.price.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Catégorie:</span>
              <Badge variant="outline">{item.categoryName}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Disponibilité:</span>
              <Badge className={item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {item.isAvailable ? 'Disponible' : 'Indisponible'}
              </Badge>
            </div>
            {item.preparationTime && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Temps de préparation:</span>
                <span className="font-medium">{item.preparationTime} min</span>
              </div>
            )}
            {item.popularity && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Popularité:</span>
                <span className="font-medium">{item.popularity}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations nutritionnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.calories && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Calories:</span>
                <span className="font-medium">{item.calories} cal</span>
              </div>
            )}
            
            <div className="space-y-2">
              <span className="text-sm text-gray-500">Régimes alimentaires:</span>
              <div className="flex flex-wrap gap-2">
                {item.isVegetarian && <Badge className="bg-green-100 text-green-800">Végétarien</Badge>}
                {item.isVegan && <Badge className="bg-emerald-100 text-emerald-800">Vegan</Badge>}
                {item.isGlutenFree && <Badge className="bg-blue-100 text-blue-800">Sans Gluten</Badge>}
                {!item.isVegetarian && !item.isVegan && !item.isGlutenFree && (
                  <span className="text-gray-500">Aucune restriction</span>
                )}
              </div>
            </div>

            {item.allergens && item.allergens.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-gray-500">Allergènes:</span>
                <div className="flex flex-wrap gap-1">
                  {item.allergens.map((allergen, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergen}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {item.ingredients && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingrédients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{item.ingredients}</p>
          </CardContent>
        </Card>
      )}

      {item.imageUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={item.imageUrl} 
              alt={item.name}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}