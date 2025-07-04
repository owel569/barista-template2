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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Edit,
  Trash2,
  Search,
  Filter,
  Star,
  ShoppingBag,
  Calendar,
  Eye,
  Gift,
  TrendingUp,
  Award,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  preferredContactMethod: string;
  loyaltyPoints?: number;
  customerSegment?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  averageOrderValue?: number;
  favoriteItems?: string[];
}

interface CustomerOrder {
  id: number;
  date: string;
  total: number;
  status: string;
  items: number;
}

interface CustomerManagementProps {
  userRole: string;
}

export default function CustomerManagementComplete({ userRole }: CustomerManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filter, setFilter] = useState({ 
    search: "", 
    segment: "all", 
    status: "all",
    sortBy: "totalSpent" 
  });
  
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    preferredContactMethod: "email",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
  });

  const { data: customerOrders = [] } = useQuery<CustomerOrder[]>({
    queryKey: ['/api/customers', selectedCustomer?.id, 'orders'],
    enabled: !!selectedCustomer
  });

  const createCustomerMutation = useMutation({
    mutationFn: (customerData: any) => apiRequest('POST', '/api/customers', customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsDialogOpen(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        dateOfBirth: "",
        preferredContactMethod: "email",
        notes: ""
      });
      toast({ title: "Client créé avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le client",
        variant: "destructive" 
      });
    }
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PATCH', `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      toast({ title: "Client mis à jour avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le client",
        variant: "destructive" 
      });
    }
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/customers/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Client supprimé avec succès" });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer le client",
        variant: "destructive" 
      });
    }
  });

  const getCustomerSegment = (customer: Customer) => {
    if (customer.totalSpent >= 1000) return { label: "VIP", color: "bg-purple-100 text-purple-800" };
    if (customer.totalSpent >= 500) return { label: "Premium", color: "bg-blue-100 text-blue-800" };
    if (customer.totalSpent >= 100) return { label: "Régulier", color: "bg-green-100 text-green-800" };
    return { label: "Nouveau", color: "bg-gray-100 text-gray-800" };
  };

  const getLoyaltyStatus = (points: number = 0) => {
    if (points >= 1000) return { label: "Platine", color: "bg-purple-100 text-purple-800", icon: Award };
    if (points >= 500) return { label: "Or", color: "bg-yellow-100 text-yellow-800", icon: Star };
    if (points >= 200) return { label: "Argent", color: "bg-gray-100 text-gray-800", icon: Star };
    return { label: "Bronze", color: "bg-orange-100 text-orange-800", icon: Star };
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const filteredCustomers = customers
    .filter(customer => {
      const matchesSearch = !filter.search || 
        customer.firstName.toLowerCase().includes(filter.search.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(filter.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filter.search.toLowerCase()) ||
        customer.phone?.includes(filter.search);
      
      const segment = getCustomerSegment(customer).label.toLowerCase();
      const matchesSegment = filter.segment === 'all' || segment === filter.segment;
      
      const matchesStatus = filter.status === 'all' || 
        (filter.status === 'active' && customer.isActive) ||
        (filter.status === 'inactive' && !customer.isActive);
      
      return matchesSearch && matchesSegment && matchesStatus;
    })
    .sort((a, b) => {
      switch (filter.sortBy) {
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        case 'totalOrders':
          return b.totalOrders - a.totalOrders;
        case 'lastOrder':
          return new Date(b.lastOrderDate || 0).getTime() - new Date(a.lastOrderDate || 0).getTime();
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        default:
          return 0;
      }
    });

  const getCustomerStats = () => {
    return {
      total: customers.length,
      active: customers.filter(c => c.isActive).length,
      vip: customers.filter(c => getCustomerSegment(c).label === 'VIP').length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      averageOrderValue: customers.length > 0 
        ? customers.reduce((sum, c) => sum + (c.averageOrderValue || 0), 0) / customers.length 
        : 0,
      newThisMonth: customers.filter(c => {
        const created = new Date(c.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length
    };
  };

  const stats = getCustomerStats();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data: newCustomer });
    } else {
      createCustomerMutation.mutate(newCustomer);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 bg-amber-500 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Clients</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Base de données et analytics clients
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Modifier le Client' : 'Créer un Nouveau Client'}
              </DialogTitle>
            </DialogHeader>
            <CustomerForm
              customer={newCustomer}
              onChange={setNewCustomer}
              onSubmit={handleSubmit}
              isLoading={createCustomerMutation.isPending || updateCustomerMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Clients", value: stats.total, color: "bg-blue-500", icon: Users },
          { label: "Clients Actifs", value: stats.active, color: "bg-green-500", icon: UserCheck },
          { label: "Clients VIP", value: stats.vip, color: "bg-purple-500", icon: Star },
          { label: "Chiffre d'Affaires", value: `${stats.totalRevenue.toFixed(0)}€`, color: "bg-emerald-500", icon: TrendingUp },
          { label: "Panier Moyen", value: `${stats.averageOrderValue.toFixed(2)}€`, color: "bg-orange-500", icon: ShoppingBag },
          { label: "Nouveaux ce mois", value: stats.newThisMonth, color: "bg-indigo-500", icon: Calendar },
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

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filter.segment} onValueChange={(value) => setFilter(prev => ({ ...prev, segment: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les segments</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="régulier">Régulier</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filter.sortBy} onValueChange={(value) => setFilter(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSpent">Montant dépensé</SelectItem>
                <SelectItem value="totalOrders">Nombre de commandes</SelectItem>
                <SelectItem value="lastOrder">Dernière commande</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setFilter({ search: "", segment: "all", status: "all", sortBy: "totalSpent" })}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Clients ({filteredCustomers.length})</span>
            <Badge variant="secondary">{filteredCustomers.length} résultat(s)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Fidélité</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total Dépensé</TableHead>
                  <TableHead>Dernière Commande</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucun client trouvé</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer: Customer) => {
                    const segment = getCustomerSegment(customer);
                    const loyalty = getLoyaltyStatus(customer.loyaltyPoints);
                    const LoyaltyIcon = loyalty.icon;
                    
                    return (
                      <TableRow key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            {customer.dateOfBirth && (
                              <div className="text-sm text-gray-500">
                                {calculateAge(customer.dateOfBirth)} ans
                              </div>
                            )}
                            {!customer.isActive && (
                              <Badge variant="secondary" className="text-xs">Inactif</Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.address && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                {customer.address.substring(0, 20)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={segment.color}>
                            {segment.label}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={loyalty.color}>
                              <LoyaltyIcon className="h-3 w-3 mr-1" />
                              {loyalty.label}
                            </Badge>
                            {customer.loyaltyPoints && (
                              <span className="text-xs text-gray-500">
                                {customer.loyaltyPoints} pts
                              </span>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{customer.totalOrders}</div>
                            <div className="text-xs text-gray-500">commandes</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">{customer.totalSpent.toFixed(2)}€</div>
                            {customer.averageOrderValue && (
                              <div className="text-xs text-gray-500">
                                Moy: {customer.averageOrderValue.toFixed(2)}€
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {customer.lastOrderDate ? (
                            <div className="text-sm">
                              {format(new Date(customer.lastOrderDate), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Jamais</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedCustomer(customer)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <CustomerDetailsModal customer={customer} orders={customerOrders} />
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCustomer(customer);
                                setNewCustomer({
                                  firstName: customer.firstName,
                                  lastName: customer.lastName,
                                  email: customer.email,
                                  phone: customer.phone || "",
                                  address: customer.address || "",
                                  dateOfBirth: customer.dateOfBirth || "",
                                  preferredContactMethod: customer.preferredContactMethod,
                                  notes: customer.notes || ""
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {userRole === 'directeur' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteCustomerMutation.mutate(customer.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour le formulaire client
function CustomerForm({ customer, onChange, onSubmit, isLoading }: {
  customer: any;
  onChange: (customer: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={customer.firstName}
            onChange={(e) => onChange({ ...customer, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={customer.lastName}
            onChange={(e) => onChange({ ...customer, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={customer.email}
            onChange={(e) => onChange({ ...customer, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={customer.phone}
            onChange={(e) => onChange({ ...customer, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          value={customer.address}
          onChange={(e) => onChange({ ...customer, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date de naissance</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={customer.dateOfBirth}
            onChange={(e) => onChange({ ...customer, dateOfBirth: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="preferredContactMethod">Méthode de contact préférée</Label>
          <Select
            value={customer.preferredContactMethod}
            onValueChange={(value) => onChange({ ...customer, preferredContactMethod: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Téléphone</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={customer.notes}
          onChange={(e) => onChange({ ...customer, notes: e.target.value })}
          placeholder="Notes internes sur le client..."
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Composant pour les détails du client
function CustomerDetailsModal({ customer, orders }: { customer: Customer, orders: CustomerOrder[] }) {
  const segment = customer.totalSpent >= 1000 ? { label: "VIP", color: "bg-purple-100 text-purple-800" } :
                  customer.totalSpent >= 500 ? { label: "Premium", color: "bg-blue-100 text-blue-800" } :
                  customer.totalSpent >= 100 ? { label: "Régulier", color: "bg-green-100 text-green-800" } :
                  { label: "Nouveau", color: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Profil Client - {customer.firstName} {customer.lastName}</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}
            {customer.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {format(new Date(customer.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
            )}
            <div className="pt-2">
              <Badge className={segment.color}>{segment.label}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total commandes:</span>
              <span className="font-medium">{customer.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total dépensé:</span>
              <span className="font-medium">{customer.totalSpent.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Panier moyen:</span>
              <span className="font-medium">
                {customer.averageOrderValue?.toFixed(2) || '0.00'}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Points fidélité:</span>
              <span className="font-medium">{customer.loyaltyPoints || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Client depuis:</span>
              <span className="font-medium">
                {format(new Date(customer.createdAt), 'MM/yyyy', { locale: fr })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Préférences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Préférences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Contact préféré:</span>
              <span className="font-medium capitalize">{customer.preferredContactMethod}</span>
            </div>
            {customer.favoriteItems && customer.favoriteItems.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">Articles favoris:</span>
                <div className="mt-1 space-y-1">
                  {customer.favoriteItems.map((item, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique des commandes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des Commandes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Aucune commande trouvée</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>
                        {format(new Date(order.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>{order.items} article(s)</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{order.total.toFixed(2)}€</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">{customer.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}