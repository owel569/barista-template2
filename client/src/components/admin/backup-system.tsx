import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  HardDrive,
  Calendar,
  Settings
} from 'lucide-react';

interface BackupSystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function BackupSystem({ userRole = 'directeur' }: BackupSystemProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [backupForm, setBackupForm] = useState({
    name: '',
    type: 'manual',
    tables: [] as string[],
    description: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery({
    queryKey: ['/api/admin/backups'],
    enabled: userRole === 'directeur'
  });

  const createBackupMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/backups', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/backups'] });
      setIsCreateDialogOpen(false);
      setBackupForm({ name: '', type: 'manual', tables: [], description: '' });
      toast({
        title: "Succès",
        description: "Sauvegarde créée avec succès"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive"
      });
    }
  });

  const availableTables = ['users', 'reservations', 'orders', 'customers', 'menu_items', 'employees', 'work_shifts', 'contact_messages'];

  const handleCreateBackup = () => {
    if (!backupForm.name || backupForm.tables.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }
    createBackupMutation.mutate(backupForm);
  };

  const handleTableToggle = (table: string) => {
    setBackupForm(prev => ({
      ...prev,
      tables: prev.tables.includes(table)
        ? prev.tables.filter(t => t !== table)
        : [...prev.tables, table]
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Échec</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    }
  };

  if (userRole !== 'directeur') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Seuls les directeurs peuvent accéder au système de sauvegarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Système de Sauvegarde</h2>
          <p className="text-gray-600">Gérez et surveillez les sauvegardes de la base de données</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle sauvegarde
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle sauvegarde</DialogTitle>
              <DialogDescription>
                Configurez les paramètres de la sauvegarde de données
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la sauvegarde</Label>
                <Input
                  id="name"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm({ ...backupForm, name: e.target.value })}
                  placeholder="Ex: Sauvegarde mensuelle"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type de sauvegarde</Label>
                <Select value={backupForm.type} onValueChange={(value) => setBackupForm({ ...backupForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuelle</SelectItem>
                    <SelectItem value="auto">Automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tables à sauvegarder</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {availableTables.map((table) => (
                    <div key={table} className="flex items-center space-x-2">
                      <Checkbox
                        id={table}
                        checked={backupForm.tables.includes(table)}
                        onCheckedChange={() => handleTableToggle(table)}
                      />
                      <Label htmlFor={table} className="text-sm font-medium">
                        {table.replace('_', ' ').toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={backupForm.description}
                  onChange={(e) => setBackupForm({ ...backupForm, description: e.target.value })}
                  placeholder="Description de la sauvegarde"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateBackup} disabled={createBackupMutation.isPending}>
                  {createBackupMutation.isPending ? 'Création...' : 'Créer la sauvegarde'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sauvegardes totales</p>
                <p className="text-2xl font-bold">{backups?.length || 0}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taille totale</p>
                <p className="text-2xl font-bold">
                  {backups?.reduce((total: number, backup: any) => total + parseFloat(backup.size), 0).toFixed(1) || '0'} MB
                </p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dernière sauvegarde</p>
                <p className="text-2xl font-bold">
                  {backups?.[0]?.date ? new Date(backups[0].date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Automatiques</p>
                <p className="text-2xl font-bold">
                  {backups?.filter((backup: any) => backup.type === 'auto').length || 0}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Historique des sauvegardes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chargement des sauvegardes...</p>
            </div>
          ) : backups?.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune sauvegarde</h3>
              <p className="text-gray-600">Créez votre première sauvegarde pour sécuriser vos données.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups?.map((backup: any) => (
                <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{backup.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{backup.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {new Date(backup.date).toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        <HardDrive className="h-4 w-4 inline mr-1" />
                        {backup.size}
                      </span>
                      <span className="text-sm text-gray-500">
                        Type: {backup.type === 'auto' ? 'Automatique' : 'Manuelle'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(backup.status)}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}