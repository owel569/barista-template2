import React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { LoadingButton } from '../ui/loading-button';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { 
  AlertCircle, 
  Edit2, 
  Plus, 
  Search, 
  Shield, 
  Trash2, 
  User, 
  Users,
  Filter,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

// Enums et constantes pour meilleure type safety
enum UserRole {
  DIRECTEUR = 'directeur',
  EMPLOYE = 'employe'
}

enum ModuleName {
  DASHBOARD = 'dashboard',
  RESERVATIONS = 'reservations',
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  MENU = 'menu',
  MESSAGES = 'messages',
  EMPLOYEES = 'employees',
  SETTINGS = 'settings'
}

const MODULE_LABELS: Record<ModuleName, string> = {
  [ModuleName.DASHBOARD]: 'Tableau de bord',
  [ModuleName.RESERVATIONS]: 'Réservations',
  [ModuleName.ORDERS]: 'Commandes',
  [ModuleName.CUSTOMERS]: 'Clients',
  [ModuleName.MENU]: 'Menu',
  [ModuleName.MESSAGES]: 'Messages',
  [ModuleName.EMPLOYEES]: 'Employés',
  [ModuleName.SETTINGS]: 'Paramètres'
};

interface UserFormData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface FormErrors {
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  permissions?: Record<string, { view?: boolean; edit?: boolean; admin?: boolean }>;
}

export function PermissionsManagementImproved(): JSX.Element {
  const { user: currentUser } = useAuth();
  const { 
    users, 
    isLoading, 
    createUser, 
    updateUser, 
    deleteUser, 
    updatePermission, 
    toggleUserStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingPermission,
    isTogglingStatus
  } = useUsers();
  const { toast } = useToast();

  // État local pour UI
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // État du formulaire avec validation
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: UserRole.EMPLOYE
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Validation des données du formulaire
  const validateForm = useCallback((data: UserFormData): FormErrors => {
    const errors: FormErrors = {};

    // Validation username
    if (!data.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
    } else if (data.username.length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    // Validation password
    if (!data.password.trim()) {
      errors.password = 'Le mot de passe est requis';
    } else if (data.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    // Validation email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Format d\'email invalide';
    }

    // Validation téléphone
    if (data.phone && !/^(\+33|0)[1-9](\d{8})$/.test(data.phone)) {
      errors.phone = 'Format téléphone invalide (ex: +33612345678 ou 0612345678)';
    }

    // Validation champs requis
    if (!data.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }

    if (!data.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }

    return errors;
  }, []);

  // Filtrage et recherche des utilisateurs (mémorisé pour performance)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !searchTerm || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);

      const matchesVisibility = showInactiveUsers || user.isActive;

      return matchesSearch && matchesRole && matchesStatus && matchesVisibility;
    });
  }, [users, searchTerm, roleFilter, statusFilter, showInactiveUsers]);

  // Gestion des changements de formulaire
  const handleFormChange = useCallback((field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Effacer l'erreur du champ modifié
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Créer un utilisateur
  const handleCreateUser = useCallback(async () => {
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await createUser(formData);
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${formData.username} a été créé avec succès.`,
      });

      // Reset form
      setFormData({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: UserRole.EMPLOYE
      });
      setFormErrors({});
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur. Vérifiez les données saisies.",
        variant: "destructive",
      });
    }
  }, [formData, validateForm, createUser, toast]);

  // Supprimer un utilisateur
  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      toast({
        title: "Utilisateur supprimé",
        description: `L'utilisateur ${userToDelete.username} a été supprimé.`,
      });
      setUserToDelete(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    }
  }, [userToDelete, deleteUser, toast]);

  // Activer/désactiver un utilisateur
  const handleToggleUserStatus = useCallback(async (userId: number, isActive: boolean) => {
    try {
      await toggleUserStatus({ userId, isActive });
      toast({
        title: "Statut modifié",
        description: `L'utilisateur a été ${isActive ? 'activé' : 'désactivé'}.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'utilisateur.",
        variant: "destructive",
      });
    }
  }, [toggleUserStatus, toast]);

  // Mettre à jour une permission
  const handleUpdatePermission = useCallback(async (
    userId: number, 
    module: ModuleName, 
    permission: string, 
    value: boolean
  ) => {
    try {
      await updatePermission({
        userId,
        module,
        [permission]: value
      });

      toast({
        title: "Permission mise à jour",
        description: `Permission ${permission} pour le module ${MODULE_LABELS[module]} mise à jour.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la permission.",
        variant: "destructive",
      });
    }
  }, [updatePermission, toast]);

  // Vérifier si l'utilisateur actuel peut effectuer une action
  const canPerform = useCallback((action: string) => {
    return currentUser?.role === UserRole.DIRECTEUR;
  }, [currentUser]);

  const toggleUserExpansion = (userId: number) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Jamais connecté";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gestion des Permissions
          </h2>
          <p className="text-gray-600">
            Gérez les utilisateurs et leurs permissions d\'accès aux modules
          </p>
        </div>

        {canPerform('create') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleFormChange('firstName', e.target.value)}
                      placeholder="Prénom"
                      className={formErrors.firstName ? 'border-red-500' : ''}
                    />
                    {formErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleFormChange('lastName', e.target.value)}
                      placeholder="Nom"
                      className={formErrors.lastName ? 'border-red-500' : ''}
                    />
                    {formErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="username">Nom d'utilisateur *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    placeholder="Nom d'utilisateur"
                    className={formErrors.username ? 'border-red-500' : ''}
                  />
                  {formErrors.username && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    placeholder="Mot de passe (8 caractères minimum)"
                    className={formErrors.password ? 'border-red-500' : ''}
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="email@exemple.com"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    placeholder="+33612345678"
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleFormChange('role', value as UserRole)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.EMPLOYE}>Employé</SelectItem>
                      <SelectItem value={UserRole.DIRECTEUR}>Directeur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <LoadingButton
                    loading={isCreating}
                    loadingText="Création..."
                    onClick={handleCreateUser}
                  >
                    Créer l'utilisateur
                  </LoadingButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value={UserRole.DIRECTEUR}>Directeur</SelectItem>
                <SelectItem value={UserRole.EMPLOYE}>Employé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactiveUsers}
                onCheckedChange={setShowInactiveUsers}
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Afficher les utilisateurs inactifs
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Utilisateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.username} • {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === UserRole.DIRECTEUR ? "default" : "secondary"}>
                          {user.role === UserRole.DIRECTEUR ? "Directeur" : "Employé"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => handleToggleUserStatus(user.id, checked)}
                            disabled={isTogglingStatus || String(user.id) === String(currentUser?.id)}
                          />
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? formatDate(user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserExpansion(user.id)}
                          >
                            {expandedUserId === user.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          {canPerform('update') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(user as any)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canPerform('delete') && String(user.id) !== String(currentUser?.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUserToDelete(user as any)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === user.id && (
                      <TableRow>
                        <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-800 p-4">
                          <div className="space-y-4">
                            <h4 className="font-medium">Permissions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {Object.entries(MODULE_LABELS).map(([module, label]) => (
                                <Card key={module}>
                                  <CardHeader className="p-4">
                                    <CardTitle className="text-sm font-medium">
                                      {label}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-0 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`${module}-view`}>Voir</Label>
                                      <Switch
                                        id={`${module}-view`}
                                        checked={false}
                                        onCheckedChange={(checked) => 
                                          handleUpdatePermission(user.id, module as ModuleName, 'view', checked)
                                        }
                                        disabled={!canPerform('update')}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor={`${module}-edit`}>Modifier</Label>
                                      <Switch
                                        id={`${module}-edit`}
                                        checked={false}
                                        onCheckedChange={(checked) => 
                                          handleUpdatePermission(user.id, module as ModuleName, 'edit', checked)
                                        }
                                        disabled={!canPerform('update')}
                                      />
                                    </div>
                                    {user.role === UserRole.DIRECTEUR && (
                                      <div className="flex items-center justify-between">
                                        <Label htmlFor={`${module}-admin`}>Admin</Label>
                                        <Switch
                                          id={`${module}-admin`}
                                          checked={false}
                                          onCheckedChange={(checked) => 
                                            handleUpdatePermission(user.id, module as ModuleName, 'admin', checked)
                                          }
                                          disabled={!canPerform('update')}
                                        />
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun utilisateur trouvé</p>
              <p className="text-sm text-gray-500">
                Essayez de modifier vos critères de recherche ou de filtrage
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <ConfirmationDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
        title="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete?.username} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteUser}
        loading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}