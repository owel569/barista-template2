import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  ChevronLeft, ChevronRight, Eye, EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import QRCode from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';

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

export default function UserProfileEnhanced() {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
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

  // Récupération des utilisateurs
  const { data: users = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/user-profiles');
      return response.json();
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
      toast({
        title: "Profil mis à jour",
        description: "Le profil utilisateur a été mis à jour avec succès",
      });
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
      toast({
        title: "Adresse ajoutée",
        description: "L'adresse a été ajoutée avec succès",
      });
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
      toast({
        title: "Adresse supprimée",
        description: "L'adresse a été supprimée avec succès",
      });
      setAddressToDelete(null);
    },
  });

  // Filtrage et tri des utilisateurs (mémorisé)
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesActiveFilter = showInactive || user.isActive;
      
      return matchesSearch && matchesActiveFilter;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'joinDate':
          return new Date(b.loyalty.joinDate).getTime() - new Date(a.loyalty.joinDate).getTime();
        case 'points':
          return b.loyalty.points - a.loyalty.points;
        case 'totalSpent':
          return b.loyalty.totalSpent - a.loyalty.totalSpent;
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, searchTerm, showInactive, sortBy]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredAndSortedUsers, currentPage, usersPerPage]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);

  // Fonctions utilitaires
  const calculateAge = useCallback((birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  }, []);

  const getLoyaltyBadge = useCallback((level: string, points: number) => {
    const badges = {
      'Bronze': { icon: Trophy, color: 'bg-amber-100 text-amber-800' },
      'Silver': { icon: Trophy, color: 'bg-gray-100 text-gray-800' },
      'Gold': { icon: Crown, color: 'bg-yellow-100 text-yellow-800' },
      'Platinum': { icon: Crown, color: 'bg-purple-100 text-purple-800' },
      'Diamond': { icon: Crown, color: 'bg-blue-100 text-blue-800' },
    };
    
    const badge = badges[level as keyof typeof badges] || badges['Bronze'];
    const IconComponent = badge.icon;
    
    return (
      <Badge className={`${badge.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {level} ({points} pts)
      </Badge>
    );
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Gestion des formulaires
  const handleEditUser = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      birthDate: user.birthDate,
      preferences: user.preferences,
    });
    setIsEditDialogOpen(true);
  }, [profileForm]);

  const handleUpdateUser = useCallback(async (data: z.infer<typeof userProfileSchema>) => {
    if (!selectedUser) return;
    
    await updateUserMutation.mutateAsync({
      id: selectedUser.id,
      updates: data,
    });
  }, [selectedUser, updateUserMutation]);

  const handleAddAddress = useCallback(async (data: z.infer<typeof addressSchema>) => {
    if (!selectedUser) return;
    
    await addAddressMutation.mutateAsync({
      userId: selectedUser.id,
      address: { ...data, id: 0, isDefault: false },
    });
  }, [selectedUser, addAddressMutation]);

  // Fonctions d'impression et export
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Profil-${selectedUser?.firstName}-${selectedUser?.lastName}`,
  });

  const handleExportProfile = useCallback(async () => {
    if (!selectedUser) return;
    
    setExporting(true);
    try {
      const profileData = {
        'Informations personnelles': {
          'Prénom': selectedUser.firstName,
          'Nom': selectedUser.lastName,
          'Email': selectedUser.email,
          'Téléphone': selectedUser.phone,
          'Âge': calculateAge(selectedUser.birthDate || '') || 'Non renseigné',
          'Date d\'inscription': new Date(selectedUser.loyalty.joinDate).toLocaleDateString('fr-FR'),
          'Dernière activité': selectedUser.lastActivity ? new Date(selectedUser.lastActivity).toLocaleDateString('fr-FR') : 'Inconnue',
          'Statut': selectedUser.isActive ? 'Actif' : 'Inactif',
        },
        'Fidélité': {
          'Niveau': selectedUser.loyalty.level,
          'Points': selectedUser.loyalty.points,
          'Total dépensé': formatCurrency(selectedUser.loyalty.totalSpent),
          'Nombre de visites': selectedUser.loyalty.visitsCount,
        },
        'Historique des commandes': selectedUser.orderHistory.map(order => ({
          'Date': new Date(order.date).toLocaleDateString('fr-FR'),
          'Montant': formatCurrency(order.amount),
          'Statut': order.status,
          'Articles': order.items.map(item => `${item.name} (${item.quantity})`).join(', '),
        })),
      };

      const wb = XLSX.utils.book_new();
      
      // Feuille informations personnelles
      const personalWS = XLSX.utils.json_to_sheet([profileData['Informations personnelles']]);
      XLSX.utils.book_append_sheet(wb, personalWS, 'Informations personnelles');
      
      // Feuille fidélité
      const loyaltyWS = XLSX.utils.json_to_sheet([profileData['Fidélité']]);
      XLSX.utils.book_append_sheet(wb, loyaltyWS, 'Fidélité');
      
      // Feuille commandes
      const ordersWS = XLSX.utils.json_to_sheet(profileData['Historique des commandes']);
      XLSX.utils.book_append_sheet(wb, ordersWS, 'Commandes');
      
      const fileName = `profil-${selectedUser.firstName}-${selectedUser.lastName}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Export réussi",
        description: `Le profil a été exporté dans ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le profil",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [selectedUser, calculateAge, formatCurrency, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des profils utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erreur lors du chargement des profils utilisateurs</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['user-profiles'] })}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              Profils Utilisateurs
            </h2>
            <p className="text-gray-600">
              Gestion avancée des profils clients ({filteredAndSortedUsers.length} utilisateurs)
            </p>
          </div>
        </div>
        
        {/* Barre de recherche et filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par nom, prénom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    aria-label="Rechercher un utilisateur"
                  />
                </div>
              </div>
              
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joinDate">Date d'inscription</SelectItem>
                  <SelectItem value="points">Points de fidélité</SelectItem>
                  <SelectItem value="totalSpent">Total dépensé</SelectItem>
                  <SelectItem value="name">Nom alphabétique</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <label htmlFor="show-inactive" className="text-sm">
                  Afficher les utilisateurs inactifs
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grille des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedUsers.map((user) => (
          <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {user.isActive ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {getLoyaltyBadge(user.loyalty.level, user.loyalty.points)}
                <div className="flex justify-between text-sm">
                  <span>Dépenses:</span>
                  <span className="font-semibold">{formatCurrency(user.loyalty.totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Visites:</span>
                  <span className="font-semibold">{user.loyalty.visitsCount}</span>
                </div>
                {user.birthDate && (
                  <div className="flex justify-between text-sm">
                    <span>Âge:</span>
                    <span className="font-semibold">{calculateAge(user.birthDate)} ans</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setSelectedUser(user)}
              >
                Voir le profil
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-4 py-2 text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialog de détail utilisateur */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {selectedUser?.firstName[0]}{selectedUser?.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              Profil détaillé du client
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div ref={printRef} className="space-y-4">
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditUser(selectedUser)}
                  aria-label="Modifier le profil"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQRCode(true)}
                  aria-label="Générer QR Code"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  aria-label="Imprimer le profil"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </Button>
                <LoadingButton
                  variant="outline"
                  size="sm"
                  loading={exporting}
                  loadingText="Export..."
                  onClick={handleExportProfile}
                  aria-label="Exporter le profil"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </LoadingButton>
              </div>

              {/* Contenu du profil avec accordéon */}
              <Accordion type="multiple" defaultValue={["profile", "loyalty", "orders"]}>
                <AccordionItem value="profile">
                  <AccordionTrigger className="text-lg font-semibold">
                    Informations personnelles
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedUser.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedUser.phone}</span>
                        </div>
                        {selectedUser.birthDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{calculateAge(selectedUser.birthDate)} ans</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedUser.address || 'Adresse non renseignée'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Dernière activité: {selectedUser.lastActivity ? 
                              new Date(selectedUser.lastActivity).toLocaleDateString('fr-FR') : 
                              'Inconnue'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="loyalty">
                  <AccordionTrigger className="text-lg font-semibold">
                    Programme de fidélité
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        {getLoyaltyBadge(selectedUser.loyalty.level, selectedUser.loyalty.points)}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total dépensé:</span>
                            <span className="font-semibold">{formatCurrency(selectedUser.loyalty.totalSpent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nombre de visites:</span>
                            <span className="font-semibold">{selectedUser.loyalty.visitsCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Points actuels:</span>
                            <span className="font-semibold">{selectedUser.loyalty.points}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Prochain niveau:</span>
                            <span className="font-semibold">{selectedUser.loyalty.nextLevelPoints - selectedUser.loyalty.points} pts</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Membre depuis:</span>
                          <span className="font-semibold">
                            {new Date(selectedUser.loyalty.joinDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Panier moyen:</span>
                          <span className="font-semibold">
                            {formatCurrency(selectedUser.loyalty.totalSpent / selectedUser.loyalty.visitsCount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="orders">
                  <AccordionTrigger className="text-lg font-semibold">
                    Historique des commandes ({selectedUser.orderHistory.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {selectedUser.orderHistory.slice(0, 5).map((order) => (
                        <div key={order.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold">
                                Commande #{order.id}
                              </div>
                              <div className="text-sm text-gray-600">
                                {new Date(order.date).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(order.amount)}</div>
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm">
                            {order.items.map((item, index) => (
                              <span key={item.id}>
                                {item.quantity}x {item.name}
                                {index < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {selectedUser.orderHistory.length > 5 && (
                        <p className="text-sm text-gray-600 text-center">
                          ... et {selectedUser.orderHistory.length - 5} autres commandes
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="addresses">
                  <AccordionTrigger className="text-lg font-semibold">
                    Adresses ({selectedUser.addresses.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="border rounded-lg p-3 flex justify-between items-start">
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {address.type === 'home' ? 'Domicile' : 
                               address.type === 'work' ? 'Travail' : 'Autre'}
                              {address.isDefault && <Badge variant="secondary">Par défaut</Badge>}
                            </div>
                            <div className="text-sm text-gray-600">
                              {address.street}<br />
                              {address.postalCode} {address.city}<br />
                              {address.country}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddressToDelete(address)}
                            aria-label="Supprimer l'adresse"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddressDialogOpen(true)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter une adresse
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog QR Code */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Client</DialogTitle>
            <DialogDescription>
              Code QR pour le profil de {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            <QRCode 
              value={`barista-cafe-user-${selectedUser?.id}`} 
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition du profil */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleUpdateUser)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h4 className="font-semibold">Préférences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="preferences.emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notifications email</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="preferences.smsNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notifications SMS</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
                <LoadingButton
                  type="submit"
                  loading={updateUserMutation.isPending}
                  loadingText="Mise à jour..."
                >
                  Mettre à jour
                </LoadingButton>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajout d'adresse */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une adresse</DialogTitle>
          </DialogHeader>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(handleAddAddress)} className="space-y-4">
              <FormField
                control={addressForm.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Domicile</SelectItem>
                          <SelectItem value="work">Travail</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                  Annuler
                </Button>
                <LoadingButton
                  type="submit"
                  loading={addAddressMutation.isPending}
                  loadingText="Ajout..."
                >
                  Ajouter
                </LoadingButton>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression d'adresse */}
      <ConfirmationDialog
        open={!!addressToDelete}
        onOpenChange={() => setAddressToDelete(null)}
        title="Supprimer l'adresse"
        description="Êtes-vous sûr de vouloir supprimer cette adresse ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={() => addressToDelete && deleteAddressMutation.mutate(addressToDelete.id)}
        loading={deleteAddressMutation.isPending}
        variant="destructive"
      />

      {/* Message si aucun utilisateur */}
      {filteredAndSortedUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun utilisateur trouvé</p>
          <p className="text-sm text-gray-500">
            Essayez de modifier vos critères de recherche ou de filtrage
          </p>
        </div>
      )}
    </div>
  );
}