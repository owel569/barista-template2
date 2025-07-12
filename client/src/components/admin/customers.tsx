import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Users, Mail, Phone, Calendar, Euro, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePermissions } from '@/hooks/usePermissions';
// import { PhoneInput } from '@/components/ui/phone-input'; // Remplacé par Input standard
import { Customer, User } from '../../../types/admin';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomersProps {
  userRole: 'directeur' | 'employe';
  user: User | null;
}

export default function Customers({ userRole, user }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { hasPermission } = usePermissions(userRole);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferredContactMethod: 'email',
    notes: ''
  });
  const { toast } = useToast();
  
  // Initialiser WebSocket pour les notifications temps réel
  useWebSocket();

  const isReadOnly = !hasPermission('customers', 'create');

  useEffect(() => {
    fetchCustomers();
    
    // Actualisation automatique toutes les 20 secondes
    const interval = setInterval(() => {
      fetchCustomers();
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm))
      );
    }

    // Sort by total spent (highest first)
    filtered.sort((a, b) => {
      const aSpent = typeof a.totalSpent === 'string' ? parseFloat(a.totalSpent) : (a.totalSpent || 0);
      const bSpent = typeof b.totalSpent === 'string' ? parseFloat(b.totalSpent) : (b.totalSpent || 0);
      return bSpent - aSpent;
    });

    setFilteredCustomers(filtered);
  };

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    // Validation côté client
    if (!newCustomer.firstName.trim() || !newCustomer.lastName.trim() || !newCustomer.email.trim()) {
      toast({
        title: "Erreur",
        description: "Prénom, nom et email sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const customerData = {
        ...newCustomer,
        firstName: newCustomer.firstName.trim(),
        lastName: newCustomer.lastName.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
        dateOfBirth: newCustomer.dateOfBirth || undefined,
        notes: newCustomer.notes.trim() || undefined
      };
      
      console.log('Données envoyées:', customerData);
      
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const customer = await response.json();
        setCustomers(prev => [customer, ...prev]);
        setNewCustomer({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          preferredContactMethod: 'email',
          notes: ''
        });
        setIsAddDialogOpen(false);
        toast({
          title: "Succès",
          description: "Client ajouté avec succès",
        });
      } else {
        const errorData = await response.json();
        console.error('Erreur détaillée:', errorData);
        toast({
          title: "Erreur",
          description: errorData.message || "Erreur lors de l'ajout du client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le client",
        variant: "destructive",
      });
    }
  };

  const deleteCustomer = async (id: number) => {
    if (isReadOnly) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions pour supprimer des clients",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(customer => customer.id !== id));
        toast({
          title: "Succès",
          description: "Client supprimé avec succès",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Erreur",
          description: errorData.error || "Impossible de supprimer le client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Erreur de connexion lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const getCustomerTier = (totalSpent: string | number) => {
    const spent = typeof totalSpent === 'string' ? parseFloat(totalSpent) : totalSpent;
    if (spent >= 500) return { name: 'VIP', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
    if (spent >= 200) return { name: 'Fidèle', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' };
    if (spent >= 50) return { name: 'Régulier', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
    return { name: 'Nouveau', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Clients
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredCustomers.length} client(s) trouvé(s)
            {isReadOnly && " (lecture seule)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
            {userRole === 'directeur' ? 'Directeur' : 'Employé'}
          </Badge>
          {!isReadOnly && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un nouveau client</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau profil client avec les informations de base
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={addCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={newCustomer.firstName}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={newCustomer.lastName}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone (optionnel)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ex: +33612345678"
                    />
                    <p className="text-xs text-gray-500">📞 Exemple : +33612345678</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse (optionnelle)</Label>
                    <Input
                      id="address"
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date de naissance (optionnelle)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newCustomer.dateOfBirth}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Ajouter</Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Nom, email, téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setSearchTerm('')} variant="outline">
              Effacer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun client trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Aucun client ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => {
            const tier = getCustomerTier(customer.totalSpent);
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <Badge className={tier.color}>
                          {tier.name}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4" />
                          <span className="font-semibold">{typeof customer.totalSpent === 'string' ? parseFloat(customer.totalSpent).toFixed(2) : (customer.totalSpent || 0).toFixed(2)}€ dépensés</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{customer.totalOrders} commande(s)</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {customer.lastVisit ? (
                          <>
                            <span>Dernière visite: </span>
                            <span className="font-medium">
                              {format(new Date(customer.lastVisit), 'dd/MM/yyyy', { locale: fr })}
                            </span>
                            <span className="ml-4">Client depuis: </span>
                          </>
                        ) : (
                          <span>Client depuis: </span>
                        )}
                        <span className="font-medium">
                          {format(new Date(customer.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                      
                      {customer.notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <span className="font-medium">Note:</span> {customer.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Profil de {selectedCustomer?.firstName} {selectedCustomer?.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedCustomer && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Nom complet</Label>
                                  <p className="text-sm font-medium">
                                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                                  </p>
                                </div>
                                <div>
                                  <Label>Statut</Label>
                                  <Badge className={getCustomerTier(selectedCustomer.totalSpent).color}>
                                    {getCustomerTier(selectedCustomer.totalSpent).name}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p className="text-sm">{selectedCustomer.email}</p>
                                </div>
                                {selectedCustomer.phone && (
                                  <div>
                                    <Label>Téléphone</Label>
                                    <p className="text-sm">{selectedCustomer.phone}</p>
                                  </div>
                                )}
                                <div>
                                  <Label>Total dépensé</Label>
                                  <p className="text-sm font-semibold">{typeof selectedCustomer.totalSpent === 'number' ? selectedCustomer.totalSpent.toFixed(2) : parseFloat(selectedCustomer.totalSpent || '0').toFixed(2)}€</p>
                                </div>
                                <div>
                                  <Label>Nombre de commandes</Label>
                                  <p className="text-sm">{selectedCustomer.totalOrders}</p>
                                </div>
                                <div>
                                  <Label>Dernière visite</Label>
                                  <p className="text-sm">
                                    {selectedCustomer.lastVisit ? 
                                      format(new Date(selectedCustomer.lastVisit), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 
                                      'Jamais'
                                    }
                                  </p>
                                </div>
                                <div>
                                  <Label>Client depuis</Label>
                                  <p className="text-sm">{format(new Date(selectedCustomer.createdAt), 'dd/MM/yyyy', { locale: fr })}</p>
                                </div>
                              </div>
                              {selectedCustomer.notes && (
                                <div>
                                  <Label>Notes</Label>
                                  <p className="text-sm">{selectedCustomer.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {!isReadOnly && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}