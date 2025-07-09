import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Package, 
  Building, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface SuppliersProps {
  userRole?: 'directeur' | 'employe';
}

export default function Suppliers({ userRole = 'directeur' }: SuppliersProps) {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données factices pour démonstration
  const suppliers = [
    {
      id: 1,
      name: 'Café Premium Import',
      category: 'Café',
      contact: {
        name: 'Marie Dubois',
        email: 'marie@cafeimport.fr',
        phone: '+33 1 23 45 67 89',
        address: '123 Rue du Commerce, 75001 Paris'
      },
      rating: 4.8,
      status: 'active',
      lastOrder: '2025-07-05',
      totalOrders: 45,
      averageDelivery: '2-3 jours',
      products: ['Grains Arabica', 'Grains Robusta', 'Café moulu', 'Capsules'],
      paymentTerms: '30 jours',
      reliability: 95
    },
    {
      id: 2,
      name: 'Pâtisserie Moderne',
      category: 'Pâtisserie',
      contact: {
        name: 'Jean Martin',
        email: 'jean@patisserie-moderne.fr',
        phone: '+33 1 98 76 54 32',
        address: '456 Avenue des Délices, 75002 Paris'
      },
      rating: 4.6,
      status: 'active',
      lastOrder: '2025-07-08',
      totalOrders: 32,
      averageDelivery: '1-2 jours',
      products: ['Croissants', 'Macarons', 'Mille-feuille', 'Tartes'],
      paymentTerms: '15 jours',
      reliability: 88
    },
    {
      id: 3,
      name: 'Boissons & Sirops',
      category: 'Boissons',
      contact: {
        name: 'Sophie Laurent',
        email: 'sophie@boissons-sirops.fr',
        phone: '+33 1 11 22 33 44',
        address: '789 Rue des Saveurs, 75003 Paris'
      },
      rating: 4.2,
      status: 'inactive',
      lastOrder: '2025-06-15',
      totalOrders: 18,
      averageDelivery: '3-4 jours',
      products: ['Sirops', 'Thés', 'Chocolat chaud', 'Jus'],
      paymentTerms: '45 jours',
      reliability: 82
    }
  ];

  const orders = [
    {
      id: 1,
      supplierId: 1,
      supplierName: 'Café Premium Import',
      orderDate: '2025-07-05',
      deliveryDate: '2025-07-08',
      status: 'livré',
      total: 1250.00,
      items: [
        { name: 'Grains Arabica Premium', quantity: 50, unit: 'kg', price: 15.00 },
        { name: 'Grains Robusta', quantity: 30, unit: 'kg', price: 12.00 },
        { name: 'Café moulu', quantity: 20, unit: 'kg', price: 18.00 }
      ]
    },
    {
      id: 2,
      supplierId: 2,
      supplierName: 'Pâtisserie Moderne',
      orderDate: '2025-07-08',
      deliveryDate: '2025-07-10',
      status: 'en_cours',
      total: 450.00,
      items: [
        { name: 'Croissants', quantity: 100, unit: 'pièces', price: 0.80 },
        { name: 'Macarons', quantity: 50, unit: 'pièces', price: 2.50 },
        { name: 'Mille-feuille', quantity: 20, unit: 'pièces', price: 4.50 }
      ]
    },
    {
      id: 3,
      supplierId: 1,
      supplierName: 'Café Premium Import',
      orderDate: '2025-07-09',
      deliveryDate: '2025-07-12',
      status: 'commande',
      total: 890.00,
      items: [
        { name: 'Capsules café', quantity: 500, unit: 'pièces', price: 0.45 },
        { name: 'Grains Arabica', quantity: 40, unit: 'kg', price: 15.00 }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'livré': return 'default';
      case 'en_cours': return 'secondary';
      case 'commande': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livré': return <CheckCircle className="h-4 w-4" />;
      case 'en_cours': return <Clock className="h-4 w-4" />;
      case 'commande': return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const renderSuppliers = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fournisseurs</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Fournisseur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom</Label>
                  <Input id="name" placeholder="Nom du fournisseur" />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cafe">Café</SelectItem>
                      <SelectItem value="patisserie">Pâtisserie</SelectItem>
                      <SelectItem value="boissons">Boissons</SelectItem>
                      <SelectItem value="equipement">Équipement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="contact-name">Nom du contact</Label>
                <Input id="contact-name" placeholder="Nom du contact" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@fournisseur.fr" />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" placeholder="+33 1 23 45 67 89" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea id="address" placeholder="Adresse complète" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  setIsAddDialogOpen(false);
                  toast({ title: 'Fournisseur ajouté avec succès' });
                }}>
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{supplier.category}</p>
                </div>
                <Badge variant={getStatusColor(supplier.status)}>
                  {supplier.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{supplier.contact.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{supplier.contact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{supplier.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{supplier.rating}/5</span>
                <span className="text-xs text-muted-foreground">({supplier.totalOrders} commandes)</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{supplier.averageDelivery}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{supplier.reliability}% fiable</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setIsOrderDialogOpen(true);
                  }}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Commander
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Commandes</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Commande
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Commande</th>
                  <th className="text-left p-4">Fournisseur</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Livraison</th>
                  <th className="text-left p-4">Statut</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-4">#{order.id}</td>
                    <td className="p-4">{order.supplierName}</td>
                    <td className="p-4">{new Date(order.orderDate).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4">{new Date(order.deliveryDate).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4">
                      <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(order.status)}
                        {order.status === 'livré' ? 'Livré' : 
                         order.status === 'en_cours' ? 'En cours' : 'Commandé'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-medium">{order.total.toFixed(2)}€</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Analyses Fournisseurs</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commandes ce mois</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Coût total</p>
                <p className="text-2xl font-bold">2 590€</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fournisseurs actifs</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance des Fournisseurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{supplier.name}</h4>
                  <p className="text-sm text-muted-foreground">{supplier.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium">{supplier.rating}/5</p>
                    <p className="text-xs text-muted-foreground">Note</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{supplier.reliability}%</p>
                    <p className="text-xs text-muted-foreground">Fiabilité</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{supplier.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des Fournisseurs</h2>
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{suppliers.length} fournisseurs</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {renderSuppliers()}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {renderOrders()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>

      {/* Dialog pour nouvelle commande */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Commande - {selectedSupplier?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de commande</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Date de livraison souhaitée</Label>
                <Input type="date" />
              </div>
            </div>
            <div>
              <Label>Produits disponibles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selectedSupplier?.products.map((product, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <span className="text-sm">{product}</span>
                    <Input type="number" placeholder="Qté" className="w-16 h-8" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Instructions spéciales..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                setIsOrderDialogOpen(false);
                toast({ title: 'Commande créée avec succès' });
              }}>
                Créer Commande
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}