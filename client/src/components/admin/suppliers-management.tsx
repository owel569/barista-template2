import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Star,
  TrendingUp,
  TrendingDown,
  Package,
  Euro,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SuppliersManagementProps {
  userRole?: 'directeur' | 'employe';
}

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  category: string;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  payment_terms: string;
  delivery_time: string;
  notes: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order: string;
}

export default function SuppliersManagement({ userRole = 'directeur' }: SuppliersManagementProps) {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    category: '',
    rating: 0,
    status: 'active',
    payment_terms: '',
    delivery_time: '',
    notes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données factices pour les fournisseurs
  const suppliers: Supplier[] = [
    {
      id: 1,
      name: 'Café Premium SAS',
      contact_person: 'Jean Dupont',
      email: 'contact@cafepremium.fr',
      phone: '+33 1 23 45 67 89',
      address: '123 Rue du Commerce',
      city: 'Paris',
      postal_code: '75001',
      category: 'Café',
      rating: 4.5,
      status: 'active',
      payment_terms: '30 jours',
      delivery_time: '2-3 jours',
      notes: 'Excellent fournisseur, qualité constante',
      created_at: '2024-01-15T09:00:00Z',
      total_orders: 45,
      total_spent: 15420.50,
      last_order: '2025-07-05T14:30:00Z'
    },
    {
      id: 2,
      name: 'Laiterie du Terroir',
      contact_person: 'Marie Martin',
      email: 'marie@laiterieduterroir.fr',
      phone: '+33 2 34 56 78 90',
      address: '456 Route de la Ferme',
      city: 'Rouen',
      postal_code: '76000',
      category: 'Produits laitiers',
      rating: 4.2,
      status: 'active',
      payment_terms: '45 jours',
      delivery_time: '1-2 jours',
      notes: 'Produits bio de qualité',
      created_at: '2024-02-20T10:15:00Z',
      total_orders: 32,
      total_spent: 8945.30,
      last_order: '2025-07-08T11:20:00Z'
    },
    {
      id: 3,
      name: 'Boulangerie Artisanale',
      contact_person: 'Pierre Lefevre',
      email: 'pierre@boulangerie-artisanale.fr',
      phone: '+33 3 45 67 89 01',
      address: '789 Avenue des Boulangers',
      city: 'Lyon',
      postal_code: '69000',
      category: 'Pâtisserie',
      rating: 4.8,
      status: 'active',
      payment_terms: '15 jours',
      delivery_time: '1 jour',
      notes: 'Livraison très rapide, produits frais',
      created_at: '2024-03-10T08:45:00Z',
      total_orders: 67,
      total_spent: 12876.90,
      last_order: '2025-07-09T16:00:00Z'
    }
  ];

  const orders = [
    {
      id: 1,
      supplier: 'Café Premium SAS',
      date: '2025-07-05',
      items: ['Café Arabica Premium - 10kg', 'Café Robusta - 5kg'],
      amount: 450.00,
      status: 'delivered',
      delivery_date: '2025-07-07'
    },
    {
      id: 2,
      supplier: 'Laiterie du Terroir',
      date: '2025-07-08',
      items: ['Lait bio - 20L', 'Crème fraîche - 5L'],
      amount: 85.50,
      status: 'pending',
      delivery_date: '2025-07-10'
    },
    {
      id: 3,
      supplier: 'Boulangerie Artisanale',
      date: '2025-07-09',
      items: ['Croissants - 50 pièces', 'Pain de mie - 10 pièces'],
      amount: 127.50,
      status: 'confirmed',
      delivery_date: '2025-07-10'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const supplierData = {
      ...supplierForm,
      id: selectedSupplier?.id || Date.now(),
      created_at: selectedSupplier?.created_at || new Date().toISOString(),
      total_orders: selectedSupplier?.total_orders || 0,
      total_spent: selectedSupplier?.total_spent || 0,
      last_order: selectedSupplier?.last_order || ''
    };

    if (selectedSupplier) {
      toast({
        title: 'Succès',
        description: 'Fournisseur modifié avec succès',
      });
    } else {
      toast({
        title: 'Succès',
        description: 'Nouveau fournisseur ajouté avec succès',
      });
    }

    setIsDialogOpen(false);
    setSelectedSupplier(null);
    setSupplierForm({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      category: '',
      rating: 0,
      status: 'active',
      payment_terms: '',
      delivery_time: '',
      notes: ''
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      postal_code: supplier.postal_code,
      category: supplier.category,
      rating: supplier.rating,
      status: supplier.status,
      payment_terms: supplier.payment_terms,
      delivery_time: supplier.delivery_time,
      notes: supplier.notes
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'inactive':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Fournisseurs</h2>
        {userRole === 'directeur' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedSupplier(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations du fournisseur
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de l'entreprise</Label>
                    <Input
                      id="name"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Personne de contact</Label>
                    <Input
                      id="contact_person"
                      value={supplierForm.contact_person}
                      onChange={(e) => setSupplierForm({...supplierForm, contact_person: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={supplierForm.city}
                      onChange={(e) => setSupplierForm({...supplierForm, city: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      value={supplierForm.postal_code}
                      onChange={(e) => setSupplierForm({...supplierForm, postal_code: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={supplierForm.category} onValueChange={(value) => setSupplierForm({...supplierForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Café">Café</SelectItem>
                        <SelectItem value="Produits laitiers">Produits laitiers</SelectItem>
                        <SelectItem value="Pâtisserie">Pâtisserie</SelectItem>
                        <SelectItem value="Épicerie">Épicerie</SelectItem>
                        <SelectItem value="Emballage">Emballage</SelectItem>
                        <SelectItem value="Équipement">Équipement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={supplierForm.status} onValueChange={(value) => setSupplierForm({...supplierForm, status: value as 'active' | 'inactive' | 'pending'})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_terms">Conditions de paiement</Label>
                    <Input
                      id="payment_terms"
                      value={supplierForm.payment_terms}
                      onChange={(e) => setSupplierForm({...supplierForm, payment_terms: e.target.value})}
                      placeholder="ex: 30 jours"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery_time">Délai de livraison</Label>
                    <Input
                      id="delivery_time"
                      value={supplierForm.delivery_time}
                      onChange={(e) => setSupplierForm({...supplierForm, delivery_time: e.target.value})}
                      placeholder="ex: 2-3 jours"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={supplierForm.notes}
                    onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {selectedSupplier ? 'Modifier' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4">
            {suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{supplier.name}</h3>
                        <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center text-sm text-gray-500">
                            <Mail className="h-4 w-4 mr-1" />
                            {supplier.email}
                          </span>
                          <span className="flex items-center text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-1" />
                            {supplier.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {supplier.total_orders} commandes
                        </div>
                        <div className="text-sm text-gray-500">
                          {supplier.total_spent.toFixed(2)} €
                        </div>
                      </div>
                      <Badge className={getStatusColor(supplier.status)}>
                        {getStatusIcon(supplier.status)}
                        <span className="ml-1">
                          {supplier.status === 'active' ? 'Actif' : 
                           supplier.status === 'inactive' ? 'Inactif' : 'En attente'}
                        </span>
                      </Badge>
                      {userRole === 'directeur' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Livraison</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.supplier}</TableCell>
                      <TableCell>{new Date(order.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm">{item}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{order.amount.toFixed(2)} €</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'delivered' ? 'Livré' :
                           order.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.delivery_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Fournisseurs Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suppliers.filter(s => s.status === 'active').length}
                </div>
                <p className="text-sm text-gray-600">
                  sur {suppliers.length} fournisseurs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Commandes ce mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-sm text-gray-600">
                  Total: {orders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)} €
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Meilleur Fournisseur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {suppliers.reduce((best, supplier) => 
                    supplier.rating > best.rating ? supplier : best
                  ).name}
                </div>
                <p className="text-sm text-gray-600">
                  Note: {suppliers.reduce((best, supplier) => 
                    supplier.rating > best.rating ? supplier : best
                  ).rating}/5
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}