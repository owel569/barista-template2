import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingButton } from '@/components/ui/loading-button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Heart, Clock, Star, MapPin, Phone, Mail, 
  Calendar, CreditCard, Bell, Shield, Settings,
  Trash2, Edit, Plus, Gift, Search, Filter,
  Download, QrCode, Printer, Trophy, Crown,
  ChevronLeft, ChevronRight, Eye, EyeOff, Users, DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import QRCode from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { exportCustomerProfiles } from '@/lib/excel-export';

// Schéma de validation amélioré
const userProfileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().regex(/^(\+?\d{8,15})$/, "Numéro de téléphone invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  birthDate: z.string().refine((date) => {
    if (!date) return true;
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 0 && age <= 120;
  }, "Date de naissance invalide"),
  preferences: z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    promotionalEmails: z.boolean(),
    favoriteTable: z.number().optional(),
    dietaryRestrictions: z.array(z.string()),
    allergens: z.array(z.string()),
    language: z.string(),
    currency: z.string(),
  }),
});

const addressSchema = z.object({
  street: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postalCode: z.string().min(1, "Le code postal est requis"),
  country: z.string().min(1, "Le pays est requis"),
  type: z.enum(["home", "work", "other"]),
});

// Interfaces TypeScript améliorées
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string;
  avatar?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    promotionalEmails: boolean;
    favoriteTable?: number;
    dietaryRestrictions: string[];
    allergens: string[];
    language: string;
    currency: string;
  };
  loyalty: {
    points: number;
    level: string;
    nextLevelPoints: number;
    totalSpent: number;
    visitsCount: number;
    joinDate: string;
  };
  paymentMethods: PaymentMethod[];
  addresses: Address[];
  orderHistory: OrderHistory[];
  isActive: boolean;
  lastActivity?: string;
}

interface PaymentMethod {
  id: number;
  type: 'card' | 'paypal' | 'cash';
  last4?: string;
  expiryDate?: string;
  isDefault: boolean;
}

interface Address {
  id: number;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  type: 'home' | 'work' | 'other';
  isDefault: boolean;
}

interface OrderHistory {
  id: number;
  date: string;
  amount: number;
  status: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export default function UserProfileEnhanced(): JSX.Element {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const permissions = usePermissions();
  const printRef = React.useRef<HTMLDivElement>(null);
  
  // États locaux pour la gestion UI
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'joinDate' | 'points' | 'totalSpent' | 'name'>('joinDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const usersPerPage = 12;

  // Récupération des utilisateurs avec gestion d'erreur améliorée
  const { data: users = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/user-profiles');
        return response.json();
      } catch (error) {
        toast.error('Échec du chargement des profils');
        console.error(error);
        return [];
      }
    },
  });

  // Formulaires avec validation
  const profileForm = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      birthDate: '',
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        promotionalEmails: true,
        dietaryRestrictions: [],
        allergens: [],
        language: 'fr',
        currency: 'EUR',
      },
    },
  });

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France',
      type: 'home',
    },
  });

  // Mutations pour les opérations CRUD
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<UserProfile> }) => {
      const response = await apiRequest(`/api/admin/user-profiles/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data.updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Profil mis à jour avec succès');
      setIsEditDialogOpen(false);
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: { userId: number; address: Omit<Address, 'id'> }) => {
      const response = await apiRequest(`/api/admin/user-profiles/${data.userId}/addresses`, {
        method: 'POST',
        body: JSON.stringify(data.address),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Adresse ajoutée avec succès');
      setIsAddressDialogOpen(false);
      addressForm.reset();
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: number) => {
      const response = await apiRequest(`/api/admin/addresses/${addressId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast.success('Adresse supprimée avec succès');
      setAddressToDelete(null);
    },
  });

  // Fonction d'export Excel optimisée
  const handleExportExcel = useCallback(async () => {
    try {
      setExporting(true);
      const exportData = users.map((profile) => ({
        'Prénom': profile.firstName,
        'Nom': profile.lastName,
        'Email': profile.email,
        'Téléphone': profile.phone,
        'Niveau Fidélité': profile.loyalty?.level || '',
        'Points Fidélité': profile.loyalty?.points || 0,
        'Total Dépensé (€)': profile.loyalty?.totalSpent || 0,
        'Commandes': profile.orderHistory?.length || 0,
        'Panier Moyen (€)': profile.loyalty?.totalSpent / (profile.orderHistory?.length || 1),
        'Dernière Visite': profile.lastActivity || '',
        'Date d\'Inscription': profile.loyalty?.joinDate || '',
        'Statut': profile.isActive ? 'Actif' : 'Inactif',
      }));

      await exportCustomerProfiles(exportData);
      toast.success('Export Excel généré avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast.error('Échec de l\'export Excel');
    } finally {
      setExporting(false);
    }
  }, [users, toast]);

  // Filtrage et tri des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = showInactive ? true : user.isActive;
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, showInactive]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'points':
          return (b.loyalty?.points || 0) - (a.loyalty?.points || 0);
        case 'totalSpent':
          return (b.loyalty?.totalSpent || 0) - (a.loyalty?.totalSpent || 0);
        case 'joinDate':
        default:
          return new Date(b.loyalty?.joinDate || '').getTime() - new Date(a.loyalty?.joinDate || '').getTime();
      }
    });
  }, [filteredUsers, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getLoyaltyLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des profils...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Erreur lors du chargement des profils</p>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profils Clients</h1>
          <p className="text-muted-foreground">
            Gérez et analysez les profils de vos clients fidèles
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleExportExcel} 
            variant="outline"
            disabled={!permissions.canExport || exporting}
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Export...' : 'Export Excel'}
          </Button>
          
          {permissions.canCreate && (
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Profil
            </Button>
          )}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="joinDate">Date d'inscription</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="points">Points fidélité</SelectItem>
            <SelectItem value="totalSpent">Total dépensé</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          onClick={() => setShowInactive(!showInactive)}
        >
          <Filter className="w-4 h-4 mr-2" />
          {showInactive ? 'Masquer inactifs' : 'Afficher inactifs'}
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Clients</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Clients Actifs</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Points Moyens</p>
                <p className="text-2xl font-bold">
                  {Math.round(users.reduce((sum, u) => sum + (u.loyalty?.points || 0), 0) / users.length)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Revenus Totaux</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(users.reduce((sum, u) => sum + (u.loyalty?.totalSpent || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grille des profils */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Niveau</span>
                  <Badge className={getLoyaltyLevelColor(user.loyalty?.level || '')}>
                    {user.loyalty?.level || 'Nouveau'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Points</span>
                  <span className="text-sm font-medium">{user.loyalty?.points || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total dépensé</span>
                  <span className="text-sm font-medium">{formatCurrency(user.loyalty?.totalSpent || 0)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Visites</span>
                  <span className="text-sm font-medium">{user.loyalty?.visitsCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Statut</span>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex space-x-1 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(user)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
                {permissions.canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Aucun résultat */}
      {paginatedUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun client trouvé</h3>
          <p className="text-muted-foreground">
            Aucun client ne correspond à vos critères de recherche.
          </p>
        </div>
      )}
    </div>
  );
} 