import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface SuppliersManagementProps {
  userRole?: 'directeur' | 'employe';
}

export default function SuppliersManagement({ userRole = 'directeur' }: SuppliersManagementProps) {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    category: '',
    contact: {
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    products: [] as string[],
    paymentTerms: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['/api/admin/suppliers'],
    enabled: userRole === 'directeur'
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/suppliers'] });
      setIsCreateDialogOpen(false);
      setSupplierForm({
        name: '',
        category: '',
        contact: { name: '', email: '', phone: '', address: '' },
        products: [],
        paymentTerms: ''
      });
      toast({
        title: "Succès",
        description: "Fournisseur ajouté avec succès"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le fournisseur",
        variant: "destructive"
      });
    }
  });

  const handleCreateSupplier = () => {
    if (!supplierForm.name || !supplierForm.category || !supplierForm.contact.name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }
    createSupplierMutation.mutate(supplierForm);
  };

  const categories = ['Café', 'Pâtisserie', 'Équipement', 'Lait et produits laitiers', 'Vaisselle', 'Nettoyage', 'Autres'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Inactif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 90) return 'text-green-600';
    if (reliability >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (userRole !== 'directeur') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Seuls les directeurs peuvent gérer les fournisseurs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Fournisseurs</h2>
          <p className="text-gray-600">Gérez vos partenaires et fournisseurs</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
              <DialogDescription>
                Enregistrez un nouveau partenaire fournisseur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de l'entreprise</Label>
                  <Input
                    id="name"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder="Ex: Café Premium Import"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={supplierForm.category} onValueChange={(value) => setSupplierForm({ ...supplierForm, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Nom du contact</Label>
                  <Input
                    id="contactName"
                    value={supplierForm.contact.name}
                    onChange={(e) => setSupplierForm({ 
                      ...supplierForm, 
                      contact: { ...supplierForm.contact, name: e.target.value } 
                    })}
                    placeholder="Ex: Marie Dubois"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={supplierForm.contact.email}
                    onChange={(e) => setSupplierForm({ 
                      ...supplierForm, 
                      contact: { ...supplierForm.contact, email: e.target.value } 
                    })}
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Téléphone</Label>
                  <Input
                    id="contactPhone"
                    value={supplierForm.contact.phone}
                    onChange={(e) => setSupplierForm({ 
                      ...supplierForm, 
                      contact: { ...supplierForm.contact, phone: e.target.value } 
                    })}
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Conditions de paiement</Label>
                  <Select value={supplierForm.paymentTerms} onValueChange={(value) => setSupplierForm({ ...supplierForm, paymentTerms: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 jours">15 jours</SelectItem>
                      <SelectItem value="30 jours">30 jours</SelectItem>
                      <SelectItem value="45 jours">45 jours</SelectItem>
                      <SelectItem value="60 jours">60 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={supplierForm.contact.address}
                  onChange={(e) => setSupplierForm({ 
                    ...supplierForm, 
                    contact: { ...supplierForm.contact, address: e.target.value } 
                  })}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateSupplier} disabled={createSupplierMutation.isPending}>
                  {createSupplierMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total fournisseurs</p>
                <p className="text-2xl font-bold">{suppliers?.length || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fournisseurs actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {suppliers?.filter((s: any) => s.status === 'active').length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commandes totales</p>
                <p className="text-2xl font-bold">
                  {suppliers?.reduce((total: number, s: any) => total + s.totalOrders, 0) || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fiabilité moyenne</p>
                <p className="text-2xl font-bold text-orange-600">
                  {suppliers?.length > 0 ? (suppliers.reduce((total: number, s: any) => total + s.reliability, 0) / suppliers.length).toFixed(0) : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Liste des fournisseurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Chargement des fournisseurs...</p>
                </div>
              ) : suppliers?.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun fournisseur</h3>
                  <p className="text-gray-600">Ajoutez votre premier fournisseur pour commencer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suppliers?.map((supplier: any) => (
                    <div key={supplier.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                            {getStatusBadge(supplier.status)}
                            <Badge variant="outline">{supplier.category}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                <Phone className="h-4 w-4 inline mr-1" />
                                {supplier.contact.phone}
                              </p>
                              <p className="text-sm text-gray-600">
                                <Mail className="h-4 w-4 inline mr-1" />
                                {supplier.contact.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">
                                <MapPin className="h-4 w-4 inline mr-1" />
                                {supplier.contact.address}
                              </p>
                              <p className="text-sm text-gray-600">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Dernier: {supplier.lastOrder ? new Date(supplier.lastOrder).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              {supplier.rating.toFixed(1)}
                            </div>
                            <div>
                              <Package className="h-4 w-4 inline mr-1" />
                              {supplier.totalOrders} commandes
                            </div>
                            <div>
                              <Clock className="h-4 w-4 inline mr-1" />
                              {supplier.averageDelivery}
                            </div>
                            <div className={`font-medium ${getReliabilityColor(supplier.reliability)}`}>
                              Fiabilité: {supplier.reliability}%
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Produits: {supplier.products.join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-1" />
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance des fournisseurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers?.map((supplier: any) => (
                  <div key={supplier.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{supplier.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Fiabilité</p>
                        <p className={`font-bold ${getReliabilityColor(supplier.reliability)}`}>
                          {supplier.reliability}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Délai moyen</p>
                        <p className="font-medium">{supplier.averageDelivery}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Conditions</p>
                        <p className="font-medium">{supplier.paymentTerms}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Historique des commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers?.map((supplier: any) => (
                  <div key={supplier.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{supplier.name}</h4>
                        <p className="text-sm text-gray-600">{supplier.totalOrders} commandes passées</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Dernière commande</p>
                        <p className="font-medium">
                          {supplier.lastOrder ? new Date(supplier.lastOrder).toLocaleDateString() : 'Aucune'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}