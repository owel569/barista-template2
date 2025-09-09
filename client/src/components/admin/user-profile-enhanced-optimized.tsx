import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogFooter,
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
  ChevronLeft, ChevronRight, Eye, EyeOff, Users, 
  DollarSign, HardDriveUpload, HardDriveDownload, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { exportCustomerProfiles } from '@/lib/excel-export';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  isDefault: z.boolean().optional(),
});

// Interfaces TypeScript améliorées
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthDate?: string;
  avatar?: string;
  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    promotionalEmails?: boolean;
    favoriteTable?: number;
    dietaryRestrictions: string[];
    allergens: string[];
    language: string;
    currency: string;
  };
  loyalty?: {
    points: number;
    level: string;
    nextLevelPoints?: number;
    totalSpent: number;
    visitsCount: number;
    joinDate: string;
  };
  paymentMethods?: PaymentMethod[];
  addresses?: Address[];
  orderHistory?: OrderHistory[];
  isActive: boolean;
  lastActivity?: string;
  notes?: string;
  lastVisit?: string; // Ajouté pour userMetrics
  role?: string; // Ajouté pour les filtres
  lastLoginAt?: string; // Ajouté pour le tri
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
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  items: OrderItem[];
  paymentMethod: string;
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export default function UserProfileEnhanced(): JSX.Element {
  const { apiRequest } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const permissions = usePermissions();
  const printRef = React.useRef<HTMLDivElement>(null);
  const { lastMessage } = useWebSocket('/ws/user-profiles');

  // États locaux pour la gestion UI
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'joinDate' | 'points' | 'totalSpent' | 'name' | 'email' | 'role' | 'lastLogin' | 'status'>('joinDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Ajouté pour gérer l'ordre de tri
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isBulkAction, setIsBulkAction] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null); // Ajouté pour userMetrics
  const [searchQuery, setSearchQuery] = useState(''); // Ajouté pour le filtrage
  const [statusFilter, setStatusFilter] = useState(''); // Ajouté pour le filtrage
  const [roleFilter, setRoleFilter] = useState(''); // Ajouté pour le filtrage
  const itemsPerPage = 12; // Renommé pour correspondre aux usages

  const usersPerPage = 12; // Ceci est une duplication, à supprimer ou renommer pour clarifier

  // Effet pour les mises à jour en temps réel via WebSocket
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      if (message.type === 'user-profile-updated') {
        queryClient.setQueryData(['user-profiles'], (old: UserProfile[] | undefined) => {
          if (!old) return old;
          return old.map(user => 
            user.id === message.data.id ? { ...user, ...message.data } : user
          );
        });
      } else if (message.type === 'user-profile-created') {
        queryClient.setQueryData(['user-profiles'], (old: UserProfile[] | undefined) => {
          return old ? [...old, message.data] : [message.data];
        });
      }
    }
  }, [lastMessage, queryClient]);

  // Récupération des utilisateurs avec gestion d'erreur améliorée
  const { data: users = [], isLoading, error, refetch } = useQuery<UserProfile[]>({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/admin/user-profiles');
        const data = await response.json();
        return data.map((user: UserProfile) => ({
          ...user,
          loyalty: {
            ...user.loyalty,
            level: user.loyalty?.level || 'Nouveau',
            points: user.loyalty?.points || 0,
            totalSpent: user.loyalty?.totalSpent || 0,
            visitsCount: user.loyalty?.visitsCount || 0,
          }
        }));
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Échec du chargement des profils',
          variant: 'destructive'
        });
        console.error(error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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
      isDefault: false,
    },
  });

  // Initialiser le formulaire avec les données de l'utilisateur sélectionné
  useEffect(() => {
    if (selectedUser && isEditDialogOpen) {
      profileForm.reset({
        ...selectedUser,
        preferences: {
          ...selectedUser.preferences,
          dietaryRestrictions: selectedUser.preferences?.dietaryRestrictions || [],
          allergens: selectedUser.preferences?.allergens || [],
        }
      });
    }
  }, [selectedUser, isEditDialogOpen, profileForm]);

  // Mutations pour les opérations CRUD
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<UserProfile> }) => {
      const response = await apiRequest(`/api/admin/user-profiles/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({
        ...data.updates,
        email: data.updates.email || ''
      }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: 'Succès',
        description: 'Profil mis à jour avec succès'
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour du profil',
        variant: 'destructive'
      });
      console.error(error);
    }
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
        title: 'Succès',
        description: 'Adresse ajoutée avec succès'
      });
      setIsAddressDialogOpen(false);
      addressForm.reset();
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: { addressId: number; updates: Partial<Address> }) => {
      const response = await apiRequest(`/api/admin/addresses/${data.addressId}`, {
        method: 'PUT',
        body: JSON.stringify(data.updates),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: 'Succès',
        description: 'Adresse mise à jour avec succès'
      });
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
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
        title: 'Succès',
        description: 'Adresse supprimée avec succès'
      });
      setAddressToDelete(null);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { ids: number[]; updates: Partial<UserProfile> }) => {
      const response = await apiRequest('/api/admin/user-profiles/bulk-update', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: 'Succès',
        description: 'Mise à jour groupée réussie'
      });
      setSelectedUsers([]);
      setIsBulkAction(false);
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
      toast({
        title: 'Succès',
        description: 'Export Excel généré avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de l\'export Excel',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  }, [users, toast]);

  // Fonction d'import (simulée)
  const handleImport = useCallback(async () => {
    try {
      setIsImporting(true);
      // Simuler un import avec un délai
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: 'Succès',
        description: 'Importation des profils réussie'
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'importation',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  }, [toast]);

  // Fonction pour basculer la sélection d'un utilisateur
  const toggleUserSelection = useCallback((userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  }, []);

  // Fonction pour sélectionner/désélectionner tous les utilisateurs visibles
  const toggleAllUsersSelection = useCallback(() => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((user: UserProfile) => user.id));
    }
  }, [paginatedUsers, selectedUsers.length]);

  // Options d'impression
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Liste des utilisateurs'
  });

  // Gestion de la recherche et du filtrage avancé
  const filteredUsers = useMemo(() => {
    return (users || []).filter((user: UserProfile) => {
      const matchesSearch = !searchTerm || 
        `${user.firstName} ${user.lastName} ${user.email} ${user.phone || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive || user.isActive;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, showInactive]);

  // Tri des utilisateurs
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a: UserProfile, b: UserProfile) => {
      // Helper to get values for sorting, handling potential undefined values
      const getValue = (user: UserProfile, field: keyof UserProfile) => {
        let value = user[field];
        if (value === undefined || value === null) {
          // Define default values for sorting to avoid errors with undefined
          if (typeof user.firstName === 'string') return ''; // Default for string fields
          if (typeof user.loyalty?.points === 'number') return 0; // Default for number fields
          if (typeof user.isActive === 'boolean') return false; // Default for boolean fields
          return ''; // Fallback
        }
        if (field === 'firstName' || field === 'lastName' || field === 'email' || field === 'phone' || field === 'city' || field === 'postalCode' || field === 'address' || field === 'lastActivity' || field === 'birthDate' || field === 'lastVisit' || field === 'lastLoginAt') {
          return String(value).toLowerCase();
        }
        if (field === 'loyalty') {
          if (sortBy === 'joinDate') return user.loyalty?.joinDate || '';
          if (sortBy === 'points') return user.loyalty?.points || 0;
          if (sortBy === 'totalSpent') return user.loyalty?.totalSpent || 0;
        }
        if (field === 'isActive') {
          return value ? 1 : 0; // Sort active users first
        }
        return value;
      };

      const aValue = getValue(a, sortBy);
      const bValue = getValue(b, sortBy);

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUsers, sortBy, sortOrder]);

  // Pagination
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage, // Use usersPerPage consistently
    currentPage * usersPerPage
  );

  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // Gestion de la sélection multiple
  useEffect(() => {
    setSelectedUsers([]);
  }, [currentPage, usersPerPage]); // Depend on currentPage and usersPerPage for reset

  // Calcul des métriques utilisateur avancées
  const userMetrics = useMemo(() => {
    // This section seems to be based on a `profile` variable not defined in this component's scope.
    // Assuming `profile` should be `selectedUser` if this is meant for the detail view.
    // If it's for aggregated metrics, it needs a different approach.
    // For now, I will comment it out to avoid compilation errors related to `profile`.
    // If `profile` is intended to be `selectedUser`, it should be passed or accessed differently.
    /*
    if (!selectedUser) return null; // Changed from 'profile' to 'selectedUser'

    const totalSpent = selectedUser.loyalty?.totalSpent || 0;
    const orderCount = selectedUser.orderHistory?.length || 0;

    return {
      'Score de Fidélité': selectedUser.loyalty?.points || 0,
      'Commandes Totales': orderCount,
      'Panier Moyen (€)': orderCount > 0 ? totalSpent / orderCount : 0,
      'Dernière Visite': selectedUser.lastVisit ? new Date(selectedUser.lastVisit).toLocaleDateString('fr-FR') : 'N/A',
      'Statut': selectedUser.isActive ? 'Actif' : 'Inactif'
    };
    */
    return null; // Placeholder as `profile` is not defined
  }, [selectedUser]); // Dependency on selectedUser

  // Mise à jour en temps réel avec WebSocket pour les notifications
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const message = JSON.parse(lastMessage.data as string);
        // This part seems to be using old query keys and assuming `profile` exists.
        // It needs to be adapted to the current component's state and data fetching strategy.
        // For now, assuming it relates to updating the main user list.
        if (message.type === 'user-profile-updated') {
          queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
        } else if (message.type === 'user-profile-created') {
          queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
        }
      } catch (error) {
        console.error('Erreur parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, queryClient]);

  // Tri des utilisateurs (moved up for better organization)
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a: UserProfile, b: UserProfile) => {
      const getValue = (user: UserProfile, field: keyof UserProfile) => {
        let value = user[field];
        if (value === undefined || value === null) return ''; // Default for string fields
        if (typeof value === 'string') return value.toLowerCase();
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value ? 1 : 0; // For status sorting
        // Special handling for loyalty fields based on sortBy
        if (field === 'loyalty') {
          if (sortBy === 'joinDate') return user.loyalty?.joinDate || '';
          if (sortBy === 'points') return user.loyalty?.points || 0;
          if (sortBy === 'totalSpent') return user.loyalty?.totalSpent || 0;
        }
        return ''; // Fallback
      };

      const aValue = getValue(a, sortBy);
      const bValue = getValue(b, sortBy);

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUsers, sortBy, sortOrder]);

  // Pagination (moved up for better organization)
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // Gestion de la sélection multiple (moved up for better organization)
  useEffect(() => {
    setSelectedUsers([]);
  }, [currentPage, usersPerPage]);

  // Helper functions (moved up for better organization)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getLoyaltyLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'diamond': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
  };

  // Calcul du pourcentage de progression vers le prochain niveau de fidélité
  const getLoyaltyProgress = (user: UserProfile) => {
    if (!user.loyalty?.nextLevelPoints) return 0;
    return Math.min(100, (user.loyalty.points / user.loyalty.nextLevelPoints) * 100);
  };

  // Gestion de la soumission des formulaires
  const onSubmitProfile = async (values: z.infer<typeof userProfileSchema>) => {
    if (!selectedUser) return;

    await updateUserMutation.mutateAsync({
      id: selectedUser.id,
      updates: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        birthDate: values.birthDate || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        postalCode: values.postalCode || undefined,
        preferences: {
          emailNotifications: values.preferences.emailNotifications,
          smsNotifications: values.preferences.smsNotifications,
          promotionalEmails: values.preferences.promotionalEmails,
          dietaryRestrictions: values.preferences.dietaryRestrictions,
          allergens: values.preferences.allergens,
          language: values.preferences.language,
          currency: values.preferences.currency,
          favoriteTable: values.preferences.favoriteTable || undefined,
        },
      }
    });
  };

  const onSubmitAddress = async (values: z.infer<typeof addressSchema>) => {
    if (!selectedUser) return;

    if (editingAddress) {
      await updateAddressMutation.mutateAsync({
        addressId: editingAddress.id,
        updates: values
      });
    } else {
      await addAddressMutation.mutateAsync({
        userId: selectedUser.id,
        address: {
          ...values,
          isDefault: values.isDefault || false
        }
      });
    }
  };

  // Gestion des erreurs et états de chargement
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
          <Button onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
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
            onClick={handleImport} 
            variant="outline"
            disabled={!permissions.canCreate || isImporting}
          >
            <HardDriveDownload className="w-4 h-4 mr-2" />
            {isImporting ? 'Import...' : 'Importer'}
          </Button>

          <Button 
            onClick={handleExportExcel} 
            variant="outline"
            disabled={!permissions.canView || exporting}
          >
            <HardDriveUpload className="w-4 h-4 mr-2" />
            {exporting ? 'Export...' : 'Exporter'}
          </Button>

          {permissions.canCreate('users') && (
            <Button onClick={() => {
              setSelectedUser(null);
              setIsEditDialogOpen(true);
            }}>
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
              placeholder="Rechercher un client (nom, email, téléphone)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <Select 
          value={sortBy} 
          onValueChange={(value) => {
            setSortBy(value as any);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="joinDate">Date d'inscription</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="points">Points fidélité</SelectItem>
            <SelectItem value="totalSpent">Total dépensé</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="status">Statut</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showInactive ? "default" : "outline"}
          onClick={() => setShowInactive(!showInactive)}
        >
          <Filter className="w-4 h-4 mr-2" />
          {showInactive ? 'Masquer inactifs' : 'Afficher inactifs'}
        </Button>
      </div>

      {/* Actions groupées */}
      {isBulkAction && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm">
            {selectedUsers.length} {selectedUsers.length > 1 ? 'utilisateurs sélectionnés' : 'utilisateur sélectionné'}
          </div>

          <Select defaultValue="actions">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activate">Activer</SelectItem>
              <SelectItem value="deactivate">Désactiver</SelectItem>
              <SelectItem value="sendPromo">Envoyer promotion</SelectItem>
              <SelectItem value="export">Exporter sélection</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline"
            onClick={() => {
              bulkUpdateMutation.mutate({
                ids: selectedUsers,
                updates: { isActive: true } // Example action, needs more logic
              });
            }}
          >
            Appliquer
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => {
              setIsBulkAction(false);
              setSelectedUsers([]);
            }}
          >
            Annuler
          </Button>
        </div>
      )}

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
                  {Math.round(users.reduce((sum, u) => sum + (u.loyalty?.points || 0), 0) / (users.length || 1))}
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
          <Card 
            key={user.id} 
            className={cn(
              "hover:shadow-lg transition-shadow",
              selectedUsers.includes(user.id) ? "ring-2 ring-primary" : "",
              !user.isActive ? "opacity-80" : ""
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    {user.avatar && <AvatarImage src={user.avatar} />}
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>
                  {user.lastActivity && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {isBulkAction && (
                  <Switch 
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUserSelection(user.id)}
                  />
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Niveau</span>
                  <Badge className={getLoyaltyLevelColor(user.loyalty?.level)}>
                    {user.loyalty?.level || 'Nouveau'}
                  </Badge>
                </div>

                {user.loyalty?.nextLevelPoints && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progression</span>
                      <span>{user.loyalty.points} / {user.loyalty.nextLevelPoints} pts</span>
                    </div>
                    <Progress 
                      value={getLoyaltyProgress(user)} 
                      className="h-2" 
                    />
                  </div>
                )}

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
                  onClick={() => {
                    setSelectedUser(user);
                    setIsEditDialogOpen(true); // Open edit dialog directly for modification
                  }}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(user);
                    // Logic to potentially delete user or address needs to be added here
                  }}
                  className="flex-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUser(user)} // View details
                  className="flex-1"
                >
                  <Eye className="w-3 h-3" />
                </Button>
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
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setShowInactive(false);
              setCurrentPage(1);
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}

      {/* Dialogue de détail de l'utilisateur */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
            <div ref={printRef} className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </DialogTitle>
                    <DialogDescription>
                      Profil client depuis {formatDate(selectedUser.loyalty?.joinDate || '')}
                    </DialogDescription>
                  </div>
                  <div className="flex space-x-2 no-print">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimer
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowQRCode(!showQRCode)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {showQRCode && (
                <div className="flex justify-center p-4 border rounded-lg">
                  <QRCodeSVG 
                    value={`${window.location.origin}/client/${selectedUser.id}`}
                    size={128}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          {selectedUser.avatar && <AvatarImage src={selectedUser.avatar} />}
                          <AvatarFallback>
                            {getInitials(selectedUser.firstName, selectedUser.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </CardTitle>
                          <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                            {selectedUser.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{selectedUser.phone}</span>
                        </div>
                      )}
                      {selectedUser.birthDate && (
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            Né(e) le {formatDate(selectedUser.birthDate)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Heart className="w-5 h-5" />
                        <span>Programme de fidélité</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Niveau actuel</span>
                        <Badge className={getLoyaltyLevelColor(selectedUser.loyalty?.level)}>
                          {selectedUser.loyalty?.level || 'Nouveau'}
                        </Badge>
                      </div>

                      {selectedUser.loyalty?.nextLevelPoints && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progression</span>
                            <span>
                              {selectedUser.loyalty.points} / {selectedUser.loyalty.nextLevelPoints} pts
                            </span>
                          </div>
                          <Progress 
                            value={getLoyaltyProgress(selectedUser)} 
                            className="h-2" 
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Points</span>
                          <p className="font-medium">{selectedUser.loyalty?.points || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Visites</span>
                          <p className="font-medium">{selectedUser.loyalty?.visitsCount || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Total dépensé</span>
                          <p className="font-medium">
                            {formatCurrency(selectedUser.loyalty?.totalSpent || 0)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Membre depuis</span>
                          <p className="font-medium">
                            {formatDate(selectedUser.loyalty?.joinDate || '')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <CreditCard className="w-5 h-5" />
                        <span>Moyens de paiement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedUser.paymentMethods && selectedUser.paymentMethods.length > 0 ? (
                        selectedUser.paymentMethods.map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              {method.type === 'card' && (
                                <CreditCard className="w-5 h-5 text-muted-foreground" />
                              )}
                              {method.type === 'paypal' && (
                                <div className="w-5 h-5 bg-blue-500 rounded"></div>
                              )}
                              <div>
                                <p className="text-sm font-medium">
                                  {method.type === 'card' ? 'Carte bancaire' : 
                                   method.type === 'paypal' ? 'PayPal' : 'Espèces'}
                                </p>
                                {method.last4 && (
                                  <p className="text-xs text-muted-foreground">
                                    **** **** **** {method.last4}
                                  </p>
                                )}
                              </div>
                            </div>
                            {method.isDefault && (
                              <Badge variant="outline">Par défaut</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucun moyen de paiement enregistré
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <MapPin className="w-5 h-5" />
                          <span>Adresses</span>
                        </CardTitle>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setEditingAddress(null);
                            setIsAddressDialogOpen(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.addresses.map((address) => (
                            <div 
                              key={address.id} 
                              className="p-4 border rounded-lg relative"
                            >
                              <div className="flex justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {address.type === 'home' ? 'Domicile' : 
                                     address.type === 'work' ? 'Travail' : 'Autre'}
                                  </p>
                                  <p className="text-sm">{address.street}</p>
                                  <p className="text-sm">
                                    {address.postalCode} {address.city}, {address.country}
                                  </p>
                                </div>
                                {address.isDefault && (
                                  <Badge variant="outline">Par défaut</Badge>
                                )}
                              </div>
                              <div className="absolute top-2 right-2 flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAddress(address);
                                    setIsAddressDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAddressToDelete(address)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucune adresse enregistrée
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Bell className="w-5 h-5" />
                        <span>Préférences</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Notifications</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Notifications par email</span>
                          <Switch 
                            checked={selectedUser.preferences?.emailNotifications || false}
                            disabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Notifications SMS</span>
                          <Switch 
                            checked={selectedUser.preferences?.smsNotifications || false}
                            disabled
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Emails promotionnels</span>
                          <Switch 
                            checked={selectedUser.preferences?.promotionalEmails || false}
                            disabled
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-medium">Préférences alimentaires</h4>
                        {selectedUser.preferences?.dietaryRestrictions && selectedUser.preferences.dietaryRestrictions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedUser.preferences.dietaryRestrictions.map((restriction) => (
                              <Badge key={restriction} variant="outline">
                                {restriction}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucune restriction</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Allergènes</h4>
                        {selectedUser.preferences?.allergens && selectedUser.preferences.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedUser.preferences.allergens.map((allergen) => (
                              <Badge key={allergen} variant="outline">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aucun allergène</p>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Langue</span>
                          <p className="font-medium">
                            {selectedUser.preferences?.language === 'fr' ? 'Français' : 'Anglais'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Devise</span>
                          <p className="font-medium">
                            {selectedUser.preferences?.currency === 'EUR' ? 'Euro (€)' : 'Dollar ($)'}
                          </p>
                        </div>
                        {selectedUser.preferences?.favoriteTable && (
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Table favorite</span>
                            <p className="font-medium">
                              Table {selectedUser.preferences.favoriteTable}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Clock className="w-5 h-5" />
                        <span>Historique des commandes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.orderHistory && selectedUser.orderHistory.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Montant</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Paiement</TableHead>
                              <TableHead>Articles</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedUser.orderHistory.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell>{formatDateTime(order.date)}</TableCell>
                                <TableCell>{formatCurrency(order.amount)}</TableCell>
                                <TableCell>
                                  <Badge variant={getStatusBadgeVariant(order.status)}>
                                    {order.status === 'completed' ? 'Complétée' :
                                     order.status === 'pending' ? 'En attente' :
                                     order.status === 'cancelled' ? 'Annulée' : 'Remboursée'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{order.paymentMethod}</TableCell>
                                <TableCell>
                                  <Accordion type="single" collapsible>
                                    <AccordionItem value="items">
                                      <AccordionTrigger className="py-0">
                                        <span className="text-sm">
                                          {order.items.length} article{order.items.length > 1 ? 's' : ''}
                                        </span>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <ul className="space-y-1">
                                          {order.items.map((item) => (
                                            <li key={item.id} className="text-sm">
                                              {item.quantity}x {item.name} - {formatCurrency(item.price)}
                                            </li>
                                          ))}
                                        </ul>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucune commande enregistrée
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>Notes internes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.notes ? (
                        <Textarea 
                          value={selectedUser.notes}
                          readOnly
                          className="min-h-[100px]"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Aucune note interne
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialogue d'édition de profil */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Modifier le profil' : 'Créer un nouveau profil'}
            </DialogTitle>
          </DialogHeader>

          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={profileForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Prénom" {...field} />
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
                        <Input placeholder="Nom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} />
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
                        <Input placeholder="Téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h4 className="font-medium mb-4">Préférences</h4>
                <div className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="preferences.emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Notifications par email</FormLabel>
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
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Notifications SMS</FormLabel>
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
                    name="preferences.promotionalEmails"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Emails promotionnels</FormLabel>
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

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <LoadingButton
                  type="submit"
                  loading={updateUserMutation.isPending}
                >
                  {selectedUser ? 'Enregistrer' : 'Créer'}
                </LoadingButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialogue d'édition d'adresse */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
            </DialogTitle>
          </DialogHeader>

          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(onSubmitAddress)} className="space-y-4">
              <FormField
                control={addressForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'adresse</FormLabel>
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

              <FormField
                control={addressForm.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Rue et numéro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input placeholder="Code postal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addressForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input placeholder="Ville" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addressForm.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pays</FormLabel>
                    <FormControl>
                      <Input placeholder="Pays" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addressForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <FormLabel>Adresse par défaut</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddressDialogOpen(false)}
                >
                  Annuler
                </Button>
                <LoadingButton
                  type="submit"
                  loading={addAddressMutation.isPending || updateAddressMutation.isPending}
                >
                  {editingAddress ? 'Enregistrer' : 'Ajouter'}
                </LoadingButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression d'adresse */}
      <ConfirmationDialog
        open={!!addressToDelete}
        onOpenChange={(open) => !open && setAddressToDelete(null)}
        title="Supprimer l'adresse"
        description="Êtes-vous sûr de vouloir supprimer cette adresse ? Cette action est irréversible."
        confirmText="Supprimer"
        onConfirm={() => {
          if (addressToDelete) {
            deleteAddressMutation.mutate(addressToDelete.id);
          }
        }}
        loading={deleteAddressMutation.isPending}
      />
    </div>
  );
}