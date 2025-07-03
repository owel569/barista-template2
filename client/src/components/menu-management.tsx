import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Coffee, Cake, Cookie, UtensilsCrossed, Upload, Image } from "lucide-react";

interface MenuCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  categoryId: number;
  category?: MenuCategory;
  imageUrl?: string;
  available: boolean;
  allergens?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewMenuItem {
  name: string;
  description: string;
  price: string;
  categoryId: number;
  imageUrl: string;
  allergens: string;
  available: boolean;
}

export default function MenuManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [newItem, setNewItem] = useState<NewMenuItem>({
    name: "",
    description: "",
    price: "",
    categoryId: 1,
    imageUrl: "",
    allergens: "",
    available: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Images par défaut pour chaque catégorie
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'cafés':
        return <Coffee className="h-5 w-5" />;
      case 'pâtisseries':
        return <Cake className="h-5 w-5" />;
      case 'snacks':
        return <Cookie className="h-5 w-5" />;
      default:
        return <UtensilsCrossed className="h-5 w-5" />;
    }
  };

  const getDefaultImage = (categoryName: string) => {
    const images = {
      'cafés': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coffeeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4A2C17;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="#F5F5DC"/>
        <ellipse cx="100" cy="160" rx="60" ry="8" fill="#DDD"/>
        <rect x="40" y="80" width="120" height="80" rx="8" fill="url(#coffeeGradient)"/>
        <ellipse cx="100" cy="80" rx="60" ry="12" fill="#D2691E"/>
        <ellipse cx="100" cy="75" rx="50" ry="8" fill="#CD853F"/>
        <rect x="160" y="90" width="20" height="30" rx="10" fill="#8B4513"/>
        <path d="M 70 50 Q 75 40 80 50" stroke="#D2691E" stroke-width="3" fill="none"/>
        <path d="M 85 45 Q 90 35 95 45" stroke="#D2691E" stroke-width="3" fill="none"/>
        <path d="M 105 45 Q 110 35 115 45" stroke="#D2691E" stroke-width="3" fill="none"/>
        <path d="M 120 50 Q 125 40 130 50" stroke="#D2691E" stroke-width="3" fill="none"/>
      </svg>`,
      'pâtisseries': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#FFF8DC"/>
        <ellipse cx="100" cy="180" rx="80" ry="10" fill="#DDD"/>
        <path d="M 30 150 Q 50 120 70 150 Q 90 120 110 150 Q 130 120 150 150 Q 170 120 190 150 L 190 160 L 30 160 Z" fill="#FFB6C1"/>
        <ellipse cx="100" cy="150" rx="80" ry="15" fill="#F0E68C"/>
        <ellipse cx="100" cy="135" rx="75" ry="12" fill="#DDA0DD"/>
        <ellipse cx="100" cy="120" rx="70" ry="10" fill="#98FB98"/>
        <circle cx="100" cy="110" r="8" fill="#FF6347"/>
        <circle cx="80" cy="125" r="3" fill="#FF1493"/>
        <circle cx="120" cy="125" r="3" fill="#FF1493"/>
        <circle cx="90" cy="140" r="2" fill="#32CD32"/>
        <circle cx="110" cy="140" r="2" fill="#32CD32"/>
      </svg>`,
      'snacks': `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#FFF8DC"/>
        <ellipse cx="100" cy="180" rx="70" ry="8" fill="#DDD"/>
        <circle cx="100" cy="100" r="60" fill="#DEB887"/>
        <circle cx="100" cy="100" r="50" fill="#F4A460"/>
        <circle cx="85" cy="85" r="4" fill="#8B4513"/>
        <circle cx="115" cy="85" r="4" fill="#8B4513"/>
        <circle cx="100" cy="95" r="3" fill="#8B4513"/>
        <circle cx="80" cy="110" r="3" fill="#8B4513"/>
        <circle cx="120" cy="110" r="3" fill="#8B4513"/>
        <circle cx="90" cy="125" r="4" fill="#8B4513"/>
        <circle cx="110" cy="125" r="4" fill="#8B4513"/>
        <circle cx="100" cy="115" r="2" fill="#8B4513"/>
        <path d="M 60 80 Q 80 75 100 80 Q 120 75 140 80" stroke="#CD853F" stroke-width="2" fill="none"/>
        <path d="M 65 120 Q 85 125 100 120 Q 115 125 135 120" stroke="#CD853F" stroke-width="2" fill="none"/>
      </svg>`
    };
    return images[categoryName.toLowerCase() as keyof typeof images] || images['cafés'];
  };

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu/categories"],
  });

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu/items"],
  });

  const createItemMutation = useMutation({
    mutationFn: (data: NewMenuItem) => {
      console.log("Token auth:", localStorage.getItem("auth_token"));
      console.log("Données article envoyées:", data);
      return apiRequest("POST", "/api/menu/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Article de menu créé avec succès",
      });
    },
    onError: (error: any) => {
      console.error("Erreur création article:", error);
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Erreur lors de la création de l'article",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MenuItem> }) =>
      apiRequest("PATCH", `/api/menu/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      setEditingItem(null);
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Succès",
        description: "Article de menu mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'article",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/menu/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      toast({
        title: "Succès",
        description: "Article de menu supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'article",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewItem({
      name: "",
      description: "",
      price: "",
      categoryId: 1,
      imageUrl: "",
      allergens: "",
      available: true
    });
    setEditingItem(null);
    setImagePreview("");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setNewItem({ ...newItem, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.name.trim() || !newItem.description.trim() || !newItem.price.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs obligatoires doivent être remplis",
        variant: "destructive",
      });
      return;
    }

    // Générer l'image par défaut si aucune n'est fournie
    const categoryName = categories.find(c => c.id === newItem.categoryId)?.name || "cafés";
    const finalItem = {
      ...newItem,
      imageUrl: newItem.imageUrl || `data:image/svg+xml;base64,${btoa(getDefaultImage(categoryName))}`
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: finalItem });
    } else {
      createItemMutation.mutate(finalItem);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || "",
      allergens: item.allergens || "",
      available: item.available
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      deleteItemMutation.mutate(id);
    }
  };

  // Filtrer les articles par catégorie
  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter(item => item.categoryId === parseInt(selectedCategory));

  if (categoriesLoading || itemsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion du Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion du Menu</h2>
          <p className="text-muted-foreground">Gérez les articles de votre menu</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Modifier l'Article" : "Nouvel Article de Menu"}
              </DialogTitle>
              <DialogDescription>
                {editingItem ? "Modifiez les informations de l'article." : "Ajoutez un nouvel article au menu."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Nom de l'article"
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={newItem.categoryId.toString()}
                  onValueChange={(value) => setNewItem({ ...newItem, categoryId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category.name)}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Description de l'article"
                />
              </div>
              <div>
                <Label htmlFor="price">Prix (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="image">Image de l'article (optionnel)</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview("");
                        setNewItem({ ...newItem, imageUrl: "" });
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  </div>
                  
                  {/* Prévisualisation de l'image */}
                  {imagePreview && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Image className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Aperçu de l'image :</span>
                      </div>
                      <div className="mt-2 w-24 h-24 border rounded-lg overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Aperçu" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Choisissez une image depuis votre ordinateur ou laissez vide pour utiliser l'image par défaut
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="allergens">Allergènes</Label>
                <Input
                  id="allergens"
                  value={newItem.allergens}
                  onChange={(e) => setNewItem({ ...newItem, allergens: e.target.value })}
                  placeholder="ex: gluten, lait, noix"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={newItem.available}
                  onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })}
                />
                <Label htmlFor="available">Disponible</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                  {createItemMutation.isPending || updateItemMutation.isPending ? "En cours..." : editingItem ? "Modifier" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.filter(item => item.available).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix Moyen</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menuItems.length > 0 
                ? (menuItems.reduce((sum, item) => sum + parseFloat(item.price), 0) / menuItems.length).toFixed(2)
                : "0.00"
              }€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.name)}
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Liste des articles */}
      <Card>
        <CardHeader>
          <CardTitle>Articles du Menu</CardTitle>
          <CardDescription>
            {filteredItems.length} article(s) {selectedCategory !== "all" && `dans ${categories.find(c => c.id === parseInt(selectedCategory))?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-full h-full"
                          dangerouslySetInnerHTML={{ __html: getDefaultImage(item.category?.name || "cafés") }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(item.category?.name || "")}
                      {item.category?.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.price}€</TableCell>
                  <TableCell>
                    <Badge variant={item.available ? "default" : "secondary"}>
                      {item.available ? "Disponible" : "Indisponible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun article trouvé
              {selectedCategory !== "all" && " dans cette catégorie"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}