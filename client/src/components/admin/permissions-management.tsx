import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Settings, 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  UserPlus,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  actions: string[];
  enabled: boolean;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: 'directeur' | 'employe';
  permissions: number[];
  lastLogin?: string;
  active: boolean;
  firstName?: string;
  lastName?: string;
}

interface UserPermission {
  userId: number;
  permissionId: number;
  granted: boolean;
  grantedBy: string;
  grantedAt: string;
}

const MODULES = [
  'dashboard', 'reservations', 'orders', 'customers', 'menu', 
  'messages', 'employees', 'settings', 'statistics', 'reports'
] as const;

const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export default function PermissionsManagement(): JSX.Element {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employe' as const,
    firstName: '',
    lastName: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      const [permissionsRes, usersRes] = await Promise.all([
        fetch('/api/admin/permissions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (permissionsRes.ok && usersRes.ok) {
        const [permissionsData, usersData] = await Promise.all([
          permissionsRes.json(),
          usersRes.json()
        ]);

        setPermissions(permissionsData || []);
        setUsers(usersData || []);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateUserForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newUser.username.trim()) {
      errors.username = "Le nom d'utilisateur est requis";
    } else if (newUser.username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }

    if (!newUser.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = "Format d'email invalide";
    }

    if (!newUser.password) {
      errors.password = "Le mot de passe est requis";
    } else if (newUser.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateUserPermission = async (userId: number, permissionId: number, granted: boolean) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const targetUser = users.find(u => u.id === userId);
      
      if (targetUser?.role === 'directeur') {
        toast({
          title: "Modification interdite",
          description: "Les permissions du directeur ne peuvent pas être modifiées",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          permissionId,
          granted,
          module: permissions.find(p => p.id === permissionId)?.module,
          action: permissions.find(p => p.id === permissionId)?.actions[0]
        })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? {
                ...user,
                permissions: granted 
                  ? [...user.permissions, permissionId]
                  : user.permissions.filter(p => p !== permissionId)
              }
            : user
        ));
        
        toast({
          title: "Permission mise à jour",
          description: `Permission ${granted ? 'accordée' : 'révoquée'} avec succès`,
          action: <CheckCircle className="h-5 w-5 text-green-500" />
        });
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la permission",
        variant: "destructive",
        action: <XCircle className="h-5 w-5 text-red-500" />
      });
    }
  };

  const createUser = async () => {
    if (!validateUserForm()) return;

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const userData = await response.json();
        setUsers([...users, userData]);
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'employe',
          firstName: '',
          lastName: ''
        });
        setShowAddUserDialog(false);
        setFormErrors({});
        
        toast({
          title: "Utilisateur créé",
          description: "L'utilisateur a été créé avec succès",
          action: <CheckCircle className="h-5 w-5 text-green-500" />
        });
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
        variant: "destructive",
        action: <XCircle className="h-5 w-5 text-red-500" />
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleUserStatus = async (userId: number, active: boolean) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active })
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, active } : user
        ));
        
        toast({
          title: "Statut mis à jour",
          description: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`,
          action: <CheckCircle className="h-5 w-5 text-green-500" />
        });
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
        action: <XCircle className="h-5 w-5 text-red-500" />
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserName = (user: User) => {
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Gestion des Permissions</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Gestion des Permissions</h2>
        </div>
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Créer un compte utilisateur avec des permissions spécifiques
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Nom d'utilisateur *</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Nom d'utilisateur"
                  className={formErrors.username ? 'border-red-500' : ''}
                />
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@example.com"
                  className={formErrors.email ? 'border-red-500' : ''}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Mot de passe"
                  className={formErrors.password ? 'border-red-500' : ''}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: string) => setNewUser({...newUser, role: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employe">Employé</SelectItem>
                    <SelectItem value="directeur">Directeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={createUser} 
                disabled={isProcessing || !newUser.username || !newUser.email || !newUser.password}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer l'utilisateur"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="matrix">Matrice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs du système</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getUserName(user)}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'directeur' ? 'default' : 'secondary'}>
                          {user.role === 'directeur' ? 'Directeur' : 'Employé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.permissions?.length || 0} permissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.active}
                            onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                            disabled={user.role === 'directeur'}
                          />
                          <Badge variant={user.active ? 'default' : 'secondary'}>
                            {user.active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {MODULES.map((module) => (
                  <Card key={module}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg capitalize">{module}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {ACTIONS.map((action) => {
                          const permission = permissions.find(p => 
                            p.module === module && p.actions.includes(action)
                          );
                          
                          return (
                            <div key={action} className="flex items-center space-x-2">
                              <Badge variant="outline" className="capitalize">
                                {action}
                              </Badge>
                              {permission ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matrice des permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      {MODULES.map((module) => (
                        <TableHead key={module} className="capitalize text-center">
                          {module}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {getUserName(user)}
                        </TableCell>
                        {MODULES.map((module) => (
                          <TableCell key={module}>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {ACTIONS.map((action) => {
                                const permission = permissions.find(p => 
                                  p.module === module && p.actions.includes(action)
                                );
                                const hasPermission = permission && user.permissions?.includes(permission.id);
                                
                                return (
                                  <div key={action} className="flex flex-col items-center">
                                    <Switch
                                      checked={hasPermission || false}
                                      onCheckedChange={(checked) => 
                                        permission && updateUserPermission(user.id, permission.id, checked)
                                      }
                                      disabled={!permission || user.role === 'directeur'}
                                    />
                                    <span className="text-xs mt-1 capitalize">{action}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Permissions de {getUserName(selectedUser)}</DialogTitle>
              <DialogDescription>
                Gérer les permissions spécifiques pour cet utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {MODULES.map((module) => (
                <Card key={module}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg capitalize">{module}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {ACTIONS.map((action) => {
                        const permission = permissions.find(p => 
                          p.module === module && p.actions.includes(action)
                        );
                        const hasPermission = permission && selectedUser.permissions?.includes(permission.id);
                        
                        return (
                          <div key={action} className="flex items-center space-x-2">
                            <Switch
                              checked={hasPermission || false}
                              onCheckedChange={(checked) => 
                                permission && updateUserPermission(selectedUser.id, permission.id, checked)
                              }
                              disabled={!permission || selectedUser.role === 'directeur'}
                            />
                            <Label className="capitalize">{action}</Label>
                            {!permission && (
                              <Badge variant="outline" className="text-xs">
                                Non configuré
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}