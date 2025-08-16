import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, 
  DollarSign, Package, Star, Search, Filter, ChevronDown,
  RefreshCw, FileText, ClipboardList, BarChart2, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
interface Supplier {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  totalOrders: number;
  totalAmount: number;
  lastOrder: string;
  products: string[];
  contractType?: string;
  contractExpiry?: string;
  leadTime?: number; // in days
  paymentTerms?: string;
}

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOrders: number;
  totalSpend: number;
  averageRating: number;
  topCategories: { category: string; count: number; total: number }[];
  recentOrders: { id: string; supplier: string; amount: number; status: string; date: string }[];
  expiringContracts: { supplier: string; type: string; expiry: string; value: number }[];
}

export default function SuppliersManagement() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState({
    suppliers: true,
    stats: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data
  const fetchSuppliersData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Simulated API calls
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock suppliers data
      const mockSuppliers: Supplier[] = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Emma', 'Thomas', 'Camille', 'Antoine', 'Julie', 'Nicolas', 'Laura'][i] + ' ' + 
              ['Dupont', 'Martin', 'Bernard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia'][i],
        company: ['Café Premium', 'Pâtisserie Deluxe', 'Équipement Pro', 'Emballage Eco', 'Nettoyage Pro', 
                 'Boissons Fraîches', 'Service Qualité', 'Logistique Express', 'Sécurité Plus', 'Fournitures Office', 
                 'Technologie Café', 'Design Intérieur'][i],
        email: `contact@${['cafe', 'patisserie', 'equipement', 'emballage', 'nettoyage', 'boissons', 'service', 'logistique', 'securite', 'fournitures', 'tech', 'design'][i]}.com`,
        phone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: `${Math.floor(1 + Math.random() * 100)} Rue de ${['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims'][i]}`,
        category: ['Café', 'Pâtisserie', 'Équipement', 'Emballage', 'Nettoyage', 'Boisson', 'Service', 'Logistique', 'Sécurité', 'Fourniture', 'Technologie', 'Design'][i % 6],
        rating: Number((3 + Math.random() * 2).toFixed(1)),
        status: ['active', 'inactive', 'pending'][Math.floor(Math.random() * 3)] as 'active' | 'inactive' | 'pending',
        totalOrders: Math.floor(1 + Math.random() * 50),
        totalAmount: Number((1000 + Math.random() * 10000).toFixed(2)),
        lastOrder: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)).toISOString(),
        products: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, (_, p) => 
          ['Café Arabica', 'Café Robusta', 'Croissants', 'Pains au Chocolat', 'Machines à Café', 'Tasses', 'Emballages Biodégradables', 
           'Détergents', 'Jus de Fruits', 'Services de Nettoyage', 'Contrats de Maintenance'][Math.floor(Math.random() * 11)]
        ),
        contractType: ['Annuel', 'Semestriel', 'Trimestriel', 'Mensuel'][Math.floor(Math.random() * 4)],
        contractExpiry: new Date(Date.now() + Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365)).toISOString(),
        leadTime: Math.floor(1 + Math.random() * 10),
        paymentTerms: ['30 jours', '45 jours', '60 jours', 'Paiement immédiat'][Math.floor(Math.random() * 4)]
      }));

      // Mock stats data
      const mockStats: SupplierStats = {
        totalSuppliers: 12,
        activeSuppliers: mockSuppliers.filter(s => s.status === 'active').length,
        totalOrders: mockSuppliers.reduce((sum, s) => sum + s.totalOrders, 0),
        totalSpend: mockSuppliers.reduce((sum, s) => sum + s.totalAmount, 0),
        averageRating: Number((mockSuppliers.reduce((sum, s) => sum + s.rating, 0) / mockSuppliers.length).toFixed(1)),
        topCategories: ['Café', 'Pâtisserie', 'Équipement', 'Emballage'].map(category => {
          const categorySuppliers = mockSuppliers.filter(s => s.category === category);
          return {
            category,
            count: categorySuppliers.length,
            total: Number(categorySuppliers.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2))
          };
        }),
        recentOrders: Array.from({ length: 5 }, (_, i) => ({
          id: `ORD-${1000 + i}`,
          supplier: mockSuppliers[i].company,
          amount: Number((100 + Math.random() * 1000).toFixed(2)),
          status: ['pending', 'processing', 'delivered', 'cancelled'][Math.floor(Math.random() * 4)],
          date: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7)).toISOString()
        })),
        expiringContracts: mockSuppliers
          .filter(s => s.contractExpiry)
          .map(s => ({
            supplier: s.company,
            type: s.contractType || 'Annuel',
            expiry: s.contractExpiry || new Date().toISOString(),
            value: Number((s.totalAmount * 0.3).toFixed(2))
          }))
          .slice(0, 3)
      };

      setSuppliers(mockSuppliers);
      setStats(mockStats);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec du chargement des données',
        variant: 'destructive'
      });
    } finally {
      setLoading({ suppliers: false, stats: false });
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSuppliersData();
  }, [fetchSuppliersData]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Café': return 'bg-brown-100 text-brown-800 dark:bg-brown-900/20 dark:text-brown-400';
      case 'Pâtisserie': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'Équipement': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Emballage': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Nettoyage': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400';
      case 'Boisson': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < rating 
          ? 'text-yellow-500 fill-current' 
          : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || supplier.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [suppliers, searchTerm, selectedCategory, selectedStatus]);

  // Loading state
  if (loading.suppliers || loading.stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[300px]" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-[200px]" />
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-[250px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Fournisseurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des partenaires et fournisseurs de Barista Café
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="Café">Café</SelectItem>
                <SelectItem value="Pâtisserie">Pâtisserie</SelectItem>
                <SelectItem value="Équipement">Équipement</SelectItem>
                <SelectItem value="Emballage">Emballage</SelectItem>
                <SelectItem value="Nettoyage">Nettoyage</SelectItem>
                <SelectItem value="Boisson">Boisson</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchSuppliersData} variant="outline" disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Fournisseurs
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalSuppliers}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fournisseurs Actifs
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeSuppliers}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round((stats.activeSuppliers / stats.totalSuppliers) * 100)}% du total
                  </p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Dépenses Totales
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalSpend.toLocaleString('fr-FR')}€
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stats.totalOrders} commandes
                  </p>
                </div>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Satisfaction
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <div className="flex">
                      {renderStars(Math.round(stats.averageRating))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Moyenne des évaluations
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">
            <Truck className="h-4 w-4 mr-2" />
            Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ClipboardList className="h-4 w-4 mr-2" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="h-4 w-4 mr-2" />
            Contrats
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart2 className="h-4 w-4 mr-2" />
            Analyses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {supplier.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {supplier.company}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(supplier.status)}>
                      {getStatusText(supplier.status)}
                    </Badge>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">{supplier.address}</span>
                    </div>

                    <div className="my-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getCategoryColor(supplier.category)}>
                          {supplier.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {renderStars(supplier.rating)}
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                            ({supplier.rating}/5)
                          </span>
                        </div>
                      </div>

                      {supplier.products && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Produits:</span> {supplier.products.slice(0, 3).join(', ')}
                          {supplier.products.length > 3 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-blue-500 cursor-pointer"> +{supplier.products.length - 3} plus</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {supplier.products.slice(3).join(', ')}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3 mt-auto">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Commandes:</span>
                      <p className="font-semibold">{supplier.totalOrders}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <p className="font-semibold text-green-600">
                        {supplier.totalAmount.toLocaleString('fr-FR')}€
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Délai:</span>
                      <p className="font-semibold">{supplier.leadTime} jours</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Paiement:</span>
                      <p className="font-semibold">{supplier.paymentTerms}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Dernière commande: {new Date(supplier.lastOrder).toLocaleDateString('fr-FR')}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Récentes</CardTitle>
              <CardDescription>
                Les 20 dernières commandes passées à vos fournisseurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Commande</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{order.amount.toLocaleString('fr-FR')}€</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' : 
                          order.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {order.status === 'delivered' ? 'Livré' : 
                           order.status === 'pending' ? 'En attente' : 'En cours'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contrats Actifs</CardTitle>
                <CardDescription>
                  Vos contrats actuellement en cours avec les fournisseurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {suppliers
                      .filter(s => s.contractType && s.contractExpiry && new Date(s.contractExpiry) > new Date())
                      .sort((a, b) => new Date(a.contractExpiry!).getTime() - new Date(b.contractExpiry!).getTime())
                      .map((supplier, index) => (
                        <Card key={index} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{supplier.company}</h4>
                              <Badge variant="outline">{supplier.contractType}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Expiration:</span>
                                <p className="font-medium">
                                  {new Date(supplier.contractExpiry!).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Valeur estimée:</span>
                                <p className="font-medium text-green-600">
                                  {(supplier.totalAmount * 0.3).toLocaleString('fr-FR')}€
                                </p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Progress 
                                value={
                                  ((new Date(supplier.contractExpiry!).getTime() - new Date().getTime()) / 
                                  (new Date(supplier.contractExpiry!).getTime() - 
                                   new Date(new Date(supplier.contractExpiry!).getTime() - 365 * 24 * 60 * 60 * 1000).getTime())) * 100
                                }
                                className="h-2"
                              />
                            </div>
                            <Button size="sm" className="w-full mt-3" variant="outline">
                              Voir le contrat
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contrats à Renouveler</CardTitle>
                <CardDescription>
                  Contrats arrivant à expiration dans les 30 prochains jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers
                    .filter(s => s.contractExpiry && 
                              new Date(s.contractExpiry) > new Date() && 
                              new Date(s.contractExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                    .sort((a, b) => new Date(a.contractExpiry!).getTime() - new Date(b.contractExpiry!).getTime())
                    .map((supplier, index) => (
                      <Card key={index} className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{supplier.company}</h4>
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                              {supplier.contractType}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Expiration:</span>
                              <p className="font-medium text-red-600">
                                {new Date(supplier.contractExpiry!).toLocaleDateString('fr-FR')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.ceil((new Date(supplier.contractExpiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours restants
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Valeur estimée:</span>
                              <p className="font-medium">
                                {(supplier.totalAmount * 0.3).toLocaleString('fr-FR')}€
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="flex-1">
                              Renouveler
                            </Button>
                            <Button size="sm" variant="outline">
                              Négocier
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dépenses par Catégorie</CardTitle>
                <CardDescription>
                  Répartition de vos dépenses par catégorie de fournisseurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topCategories.map((category) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(category.category)}>
                            {category.category}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {category.count} fournisseurs
                          </span>
                        </div>
                        <span className="font-semibold">
                          {category.total.toLocaleString('fr-FR')}€
                        </span>
                      </div>
                      <Progress 
                        value={(category.total / (stats?.totalSpend || 1)) * 100} 
                        className="h-2"
                        indicatorClassName={getCategoryColor(category.category).replace('bg-', 'bg-').split(' ')[0]}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Fournisseurs</CardTitle>
                <CardDescription>
                  Vos fournisseurs avec le plus gros volume d'achats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{supplier.totalAmount.toLocaleString('fr-FR')}€</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {supplier.totalOrders} commandes
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}