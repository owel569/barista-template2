import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, Users, Settings, Eye, Edit, Plus, Trash2, Save
} from 'lucide-react';

interface Permission {
  id: number;
  userId: number;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface User {
  id: number;
  username: string;
  role: string;
}

export default function PermissionsManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const modules = [
    'dashboard', 'reservations', 'orders', 'customers', 'menu',
    'messages', 'employees', 'inventory', 'loyalty', 'statistics',
    'logs', 'settings', 'accounting', 'backup', 'reports'
  ];

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
        
        setPermissions(permissionsData);
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (userId: number, module: string, field: string, value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          module,
          [field]: value
        })
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const getUserPermissions = (userId: number) => {
    return permissions.filter(p => p.userId === userId);
  };

  const getModulePermission = (userId: number, module: string) => {
    return permissions.find(p => p.userId === userId && p.module === module) || {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false
    };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Permissions
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Contrôle d'accès granulaire par utilisateur et module
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {users.length} utilisateurs
          </span>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="permissions">Permissions par Module</TabsTrigger>
          <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {/* Sélection utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sélectionner un Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant={selectedUser === user.id ? "default" : "outline"}
                    onClick={() => setSelectedUser(user.id)}
                    className="h-auto p-4 justify-start"
                  >
                    <div className="text-left">
                      <p className="font-medium">{user.username}</p>
                      <Badge variant={user.role === 'directeur' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'directeur' ? 'Directeur' : 'Employé'}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permissions par module */}
          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Permissions - {users.find(u => u.id === selectedUser)?.username}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {modules.map((module) => {
                    const permission = getModulePermission(selectedUser, module);
                    
                    return (
                      <div key={module} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold capitalize">{module}</h3>
                          <Badge variant="outline">{module}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${module}-view`}>Voir</Label>
                            <Switch
                              id={`${module}-view`}
                              checked={permission.canView}
                              onCheckedChange={(checked) => 
                                updatePermission(selectedUser, module, 'canView', checked)
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${module}-create`}>Créer</Label>
                            <Switch
                              id={`${module}-create`}
                              checked={permission.canCreate}
                              onCheckedChange={(checked) => 
                                updatePermission(selectedUser, module, 'canCreate', checked)
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${module}-edit`}>Modifier</Label>
                            <Switch
                              id={`${module}-edit`}
                              checked={permission.canEdit}
                              onCheckedChange={(checked) => 
                                updatePermission(selectedUser, module, 'canEdit', checked)
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`${module}-delete`}>Supprimer</Label>
                            <Switch
                              id={`${module}-delete`}
                              checked={permission.canDelete}
                              onCheckedChange={(checked) => 
                                updatePermission(selectedUser, module, 'canDelete', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs et Rôles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {user.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'directeur' ? 'default' : 'secondary'}>
                        {user.role === 'directeur' ? 'Directeur' : 'Employé'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total utilisateurs:</span>
                    <span className="font-semibold">{users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Directeurs:</span>
                    <span className="font-semibold">
                      {users.filter(u => u.role === 'directeur').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employés:</span>
                    <span className="font-semibold">
                      {users.filter(u => u.role === 'employe').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Modules:</span>
                    <span className="font-semibold">{modules.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Accès Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Utilisateur
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Permissions Globales
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  Audit des Accès
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modules Critiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['employees', 'accounting', 'backup', 'settings'].map((module) => (
                    <div key={module} className="flex items-center justify-between">
                      <span className="capitalize text-sm">{module}</span>
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}