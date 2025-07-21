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
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Settings, Users, Shield, Plus, Edit, Trash2, Save, UserPlus } from 'lucide-react';
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
  lastLogin: string;
  active: boolean;
}

interface UserPermission {
  userId: number;
  permissionId: number;
  granted: boolean;
  grantedBy: string;
  grantedAt: string;
}

export default function PermissionsManagement() : JSX.Element {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employe' as 'directeur' | 'employe'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
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
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPermission = async (userId: number, permissionId: number, granted: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      const targetUser = users.find(u => u.id === userId);
      
      // Vérifier si c'est un directeur (ne peut pas être modifié)
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
        // Mettre à jour l'état local IMMÉDIATEMENT
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
        
        // Émettre un événement pour notifier les autres composants
        window.dispatchEvent(new CustomEvent('permissions-updated', { 
          detail: { userId, permissionId, granted } 
        }));
        
        toast({
          title: "Permission mise à jour",
          description: `Permission ${granted ? 'accordée' : 'révoquée'} avec succès - Effet immédiat`
        });
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la permission",
        variant: "destructive"
      });
    }
  };

  const createUser = async () => {
    try {
      const token = localStorage.getItem('token');
      
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
          role: 'employe'
        });
        setShowAddUserDialog(false);
        
        toast({
          title: "Utilisateur créé",
          description: "L'utilisateur a été créé avec succès"
        });
      } else {
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: number, active: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
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
          description: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const modules = [
    'dashboard', 'reservations', 'orders', 'customers', 'menu', 
    'messages', 'employees', 'settings', 'statistics', 'reports'
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Gestion des Permissions</h2>
        </div>
        <div className="text-center py-8">Chargement...</div>
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
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="Nom d'utilisateur"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Mot de passe"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={newUser.role} onValueChange={(value: 'directeur' | 'employe') => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employe">Employé</SelectItem>
                    <SelectItem value="directeur">Directeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={createUser} 
                className="w-full"
                disabled={!newUser.username || !newUser.email || !newUser.password}
              >
                Créer l'utilisateur
              </Button>
            </div>
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
                          <div className="font-medium">{user.username}</div>
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
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.active}
                          onCheckedChange={(checked) => toggleUserStatus(user.id, checked)}
                        />
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
                {modules.map((module) => (
                  <Card key={module}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg capitalize">{module}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        {['view', 'create', 'edit', 'delete'].map((action) => (
                          <div key={action} className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">
                              {action}
                            </Badge>
                          </div>
                        ))}
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
                      {modules.map((module) => (
                        <TableHead key={module} className="capitalize">
                          {module}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username}
                        </TableCell>
                        {modules.map((module) => (
                          <TableCell key={module}>
                            <div className="space-y-1">
                              {['view', 'create', 'edit', 'delete'].map((action) => {
                                const permissionId = permissions.find(p => 
                                  p.module === module && p.actions.includes(action)
                                )?.id;
                                const hasPermission = permissionId && user.permissions?.includes(permissionId);
                                
                                return (
                                  <Switch
                                    key={action}
                                    checked={hasPermission || false}
                                    onCheckedChange={(checked) => 
                                      permissionId && updateUserPermission(user.id, permissionId, checked)
                                    }
                                    disabled={!permissionId}
                                  />
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
              <DialogTitle>Permissions de {selectedUser.username}</DialogTitle>
              <DialogDescription>
                Gérer les permissions spécifiques pour cet utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {modules.map((module) => (
                <Card key={module}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg capitalize">{module}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {['view', 'create', 'edit', 'delete'].map((action) => {
                        const permissionId = permissions.find(p => 
                          p.module === module && p.actions.includes(action)
                        )?.id;
                        const hasPermission = permissionId && selectedUser.permissions?.includes(permissionId);
                        
                        return (
                          <div key={action} className="flex items-center space-x-2">
                            <Switch
                              checked={hasPermission || false}
                              onCheckedChange={(checked) => 
                                permissionId && updateUserPermission(selectedUser.id, permissionId, checked)
                              }
                              disabled={!permissionId}
                            />
                            <Label className="capitalize">{action}</Label>
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