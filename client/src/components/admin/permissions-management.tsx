import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  Edit, 
  Trash2, 
  Plus, 
  Eye,
  UserCheck,
  Settings,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface User {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const modules = [
  { id: 'dashboard', name: 'Tableau de bord', icon: '📊' },
  { id: 'reservations', name: 'Réservations', icon: '📅' },
  { id: 'orders', name: 'Commandes', icon: '🛒' },
  { id: 'customers', name: 'Clients', icon: '👥' },
  { id: 'menu', name: 'Menu', icon: '🍽️' },
  { id: 'messages', name: 'Messages', icon: '💬' },
  { id: 'employees', name: 'Employés', icon: '👨‍💼' },
  { id: 'settings', name: 'Paramètres', icon: '⚙️' },
  { id: 'statistics', name: 'Statistiques', icon: '📈' },
  { id: 'logs', name: 'Logs', icon: '📋' }
];

interface PermissionsManagementProps {
  userRole?: 'directeur' | 'employe';
}

export default function PermissionsManagement({ userRole = 'directeur' }: PermissionsManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les utilisateurs
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Récupérer les permissions pour l'utilisateur sélectionné
  const { data: userPermissions = [] } = useQuery<Permission[]>({
    queryKey: ['/api/admin/permissions', selectedUser?.id],
    enabled: !!selectedUser,
  });

  // Mutation pour sauvegarder les permissions
  const savePermissionsMutation = useMutation({
    mutationFn: async (newPermissions: Permission[]) => {
      return await apiRequest(`/api/admin/permissions/${selectedUser?.id}`, {
        method: 'PUT',
        body: JSON.stringify(newPermissions),
      });
    },
    onSuccess: () => {
      toast({
        title: "Permissions sauvegardées",
        description: "Les permissions ont été mises à jour avec succès.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions'] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (selectedUser && userPermissions) {
      if (userPermissions.length > 0) {
        setPermissions(userPermissions);
      } else {
        // Créer des permissions par défaut pour tous les modules
        const defaultPermissions = modules.map(module => ({
          id: 0,
          userId: selectedUser.id,
          module: module.id,
          canView: selectedUser.role === 'directeur' || ['dashboard', 'reservations', 'orders', 'customers'].includes(module.id),
          canCreate: selectedUser.role === 'directeur' || ['reservations', 'orders'].includes(module.id),
          canUpdate: selectedUser.role === 'directeur' || ['reservations', 'orders'].includes(module.id),
          canDelete: selectedUser.role === 'directeur'
        }));
        setPermissions(defaultPermissions);
      }
    }
  }, [selectedUser?.id, userPermissions]);

  const updatePermission = (moduleId: string, field: keyof Permission, value: boolean) => {
    setPermissions(prev => 
      prev.map(perm => 
        perm.module === moduleId 
          ? { ...perm, [field]: value }
          : perm
      )
    );
  };

  const handleSavePermissions = () => {
    if (selectedUser) {
      savePermissionsMutation.mutate(permissions);
    }
  };

  const getPermissionLevel = (permission: Permission): string => {
    if (permission.canDelete) return 'Complet';
    if (permission.canUpdate) return 'Modification';
    if (permission.canCreate) return 'Création';
    if (permission.canView) return 'Lecture';
    return 'Aucun';
  };

  const getPermissionColor = (permission: Permission): string => {
    if (permission.canDelete) return 'bg-red-100 text-red-800';
    if (permission.canUpdate) return 'bg-orange-100 text-orange-800';
    if (permission.canCreate) return 'bg-blue-100 text-blue-800';
    if (permission.canView) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Gestion des Permissions</h1>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Système granulaire
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <Badge variant={user.role === 'directeur' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration des permissions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permissions
                {selectedUser && (
                  <Badge variant="outline">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Badge>
                )}
              </CardTitle>
              {selectedUser && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSavePermissions}
                        disabled={savePermissionsMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedUser ? (
              <div className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map(permission => {
                        const module = modules.find(m => m.id === permission.module);
                        return (
                          <Card key={permission.module}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <span>{module?.icon}</span>
                                {module?.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Voir</Label>
                                <Switch
                                  checked={permission.canView}
                                  onCheckedChange={(checked) => 
                                    updatePermission(permission.module, 'canView', checked)
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Créer</Label>
                                <Switch
                                  checked={permission.canCreate}
                                  onCheckedChange={(checked) => 
                                    updatePermission(permission.module, 'canCreate', checked)
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Modifier</Label>
                                <Switch
                                  checked={permission.canUpdate}
                                  onCheckedChange={(checked) => 
                                    updatePermission(permission.module, 'canUpdate', checked)
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Supprimer</Label>
                                <Switch
                                  checked={permission.canDelete}
                                  onCheckedChange={(checked) => 
                                    updatePermission(permission.module, 'canDelete', checked)
                                  }
                                />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {permissions.map(permission => {
                      const module = modules.find(m => m.id === permission.module);
                      return (
                        <div key={permission.module} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{module?.icon}</span>
                            <div>
                              <p className="font-medium">{module?.name}</p>
                              <p className="text-sm text-gray-500">{permission.module}</p>
                            </div>
                          </div>
                          <Badge className={getPermissionColor(permission)}>
                            {getPermissionLevel(permission)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez un utilisateur pour gérer ses permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}