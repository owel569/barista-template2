import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, Plus, Edit, Trash2, Phone, Mail, MapPin, DollarSign, Package, Star
} from 'lucide-react';

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
}

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOrders: number;
  averageRating: number;
}

export default function SuppliersManagement() : JSX.Element {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchSuppliersData();
  }, []);

  const fetchSuppliersData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [suppliersRes, statsRes] = await Promise.all([
        fetch('/api/admin/suppliers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/suppliers/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (suppliersRes.ok && statsRes.ok) {
        const [suppliersData, statsData] = await Promise.all([
          suppliersRes.json(),
          statsRes.json()
        ]);
        
        setSuppliers(suppliersData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
      case 'Café':
        return 'bg-brown-100 text-brown-800 dark:bg-brown-900/20 dark:text-brown-400';
      case 'Pâtisserie':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'Équipement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Emballage':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Fournisseurs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des partenaires et fournisseurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Toutes catégories</option>
            <option value="Café">Café</option>
            <option value="Pâtisserie">Pâtisserie</option>
            <option value="Équipement">Équipement</option>
            <option value="Emballage">Emballage</option>
          </select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Fournisseur
          </Button>
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
                <Truck className="h-8 w-8 text-blue-500" />
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
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Commandes Totales
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalOrders}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Note Moyenne
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.averageRating.toFixed(1)}
                    </p>
                    <div className="flex">
                      {renderStars(Math.round(stats.averageRating))}
                    </div>
                  </div>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="contracts">Contrats</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400 truncate">{supplier.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 my-3">
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

                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Commandes:</span>
                      <p className="font-semibold">{supplier.totalOrders}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <p className="font-semibold text-green-600">
                        {(supplier.totalAmount || 0).toFixed(2)}€
                      </p>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'ORD-001', supplier: 'Café Premium', amount: 1250.00, status: 'delivered', date: '2025-01-09' },
                  { id: 'ORD-002', supplier: 'Pâtisserie Deluxe', amount: 890.50, status: 'pending', date: '2025-01-08' },
                  { id: 'ORD-003', supplier: 'Équipement Pro', amount: 3450.00, status: 'processing', date: '2025-01-07' },
                  { id: 'ORD-004', supplier: 'Emballage Eco', amount: 560.75, status: 'delivered', date: '2025-01-06' }
                ].map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{order.id}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{order.supplier}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{order.amount.toFixed(2)}€</p>
                      <Badge className={
                        order.status === 'delivered' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }>
                        {order.status === 'delivered' ? 'Livré' : 
                         order.status === 'pending' ? 'En attente' : 'En cours'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contrats Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { supplier: 'Café Premium', type: 'Annuel', expiry: '2025-12-31', value: 45000 },
                    { supplier: 'Pâtisserie Deluxe', type: 'Trimestriel', expiry: '2025-03-31', value: 12000 },
                    { supplier: 'Équipement Pro', type: 'Maintenance', expiry: '2025-06-30', value: 8500 }
                  ].map((contract, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{contract.supplier}</h4>
                        <Badge variant="outline">{contract.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Expiration:</span>
                          <p className="font-medium">
                            {new Date(contract.expiry).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Valeur:</span>
                          <p className="font-medium text-green-600">{contract.value.toFixed(2)}€</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contrats à Renouveler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { supplier: 'Emballage Eco', type: 'Annuel', expiry: '2025-02-15', value: 15000 },
                    { supplier: 'Nettoyage Pro', type: 'Semestriel', expiry: '2025-01-31', value: 6000 }
                  ].map((contract, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{contract.supplier}</h4>
                        <Badge className="bg-yellow-100 text-yellow-800">{contract.type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Expiration:</span>
                          <p className="font-medium text-red-600">
                            {new Date(contract.expiry).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Valeur:</span>
                          <p className="font-medium">{contract.value.toFixed(2)}€</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        Renouveler
                      </Button>
                    </div>
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
                <CardTitle>Performance par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Café', 'Pâtisserie', 'Équipement', 'Emballage'].map((category) => {
                    const categorySuppliers = suppliers.filter(s => s.category === category);
                    const avgRating = categorySuppliers.length > 0 
                      ? categorySuppliers.reduce((sum, s) => sum + s.rating, 0) / categorySuppliers.length 
                      : 0;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getCategoryColor(category)}>{category}</Badge>
                          <span>{categorySuppliers.length} fournisseurs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {renderStars(Math.round(avgRating))}
                          </div>
                          <span className="font-semibold">{avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Fournisseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .slice(0, 5)
                    .map((supplier, index) => (
                      <div key={supplier.id} className="flex items-center justify-between">
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
                          <p className="font-bold text-green-600">{supplier.totalAmount.toFixed(2)}€</p>
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