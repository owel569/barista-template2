import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Shield,
  Archive,
  Trash2
} from 'lucide-react';

interface BackupSystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function BackupSystem({ userRole = 'directeur' }: BackupSystemProps) {
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const { toast } = useToast();

  // Données factices pour les sauvegardes
  const backups = [
    {
      id: 1,
      name: 'Sauvegarde automatique',
      date: '2025-07-09T14:30:00',
      size: '45.2 MB',
      type: 'auto',
      status: 'completed',
      tables: ['users', 'reservations', 'orders', 'customers', 'menu_items'],
      description: 'Sauvegarde quotidienne automatique'
    },
    {
      id: 2,
      name: 'Sauvegarde manuelle - Fin de mois',
      date: '2025-06-30T23:59:00',
      size: '42.8 MB',
      type: 'manual',
      status: 'completed',
      tables: ['users', 'reservations', 'orders', 'customers', 'menu_items', 'employees'],
      description: 'Sauvegarde de fin de mois avec toutes les données'
    },
    {
      id: 3,
      name: 'Sauvegarde avant migration',
      date: '2025-06-15T10:15:00',
      size: '38.9 MB',
      type: 'manual',
      status: 'completed',
      tables: ['users', 'reservations', 'orders'],
      description: 'Sauvegarde avant mise à jour système'
    },
    {
      id: 4,
      name: 'Sauvegarde partielle',
      date: '2025-06-01T16:45:00',
      size: '12.3 MB',
      type: 'partial',
      status: 'completed',
      tables: ['menu_items', 'categories'],
      description: 'Sauvegarde du menu uniquement'
    }
  ];

  const systemStats = {
    totalBackups: 15,
    totalSize: '650 MB',
    lastBackup: '2025-07-09T14:30:00',
    nextScheduled: '2025-07-10T02:00:00',
    retentionDays: 30,
    storageUsed: 68
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'auto': return 'default';
      case 'manual': return 'secondary';
      case 'partial': return 'outline';
      default: return 'secondary';
    }
  };

  const simulateBackup = () => {
    setIsBackupInProgress(true);
    setBackupProgress(0);

    const interval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackupInProgress(false);
          toast({
            title: "Sauvegarde terminée",
            description: "La sauvegarde a été créée avec succès.",
          });
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const simulateRestore = () => {
    setIsRestoreInProgress(true);
    
    setTimeout(() => {
      setIsRestoreInProgress(false);
      toast({
        title: "Restauration terminée",
        description: "Les données ont été restaurées avec succès.",
      });
    }, 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Système de Sauvegarde</h2>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-muted-foreground">Sécurisé</span>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total sauvegardes</p>
                <p className="text-2xl font-bold">{systemStats.totalBackups}</p>
              </div>
              <Archive className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Espace utilisé</p>
                <p className="text-2xl font-bold">{systemStats.totalSize}</p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                <p className="text-lg font-bold">
                  {new Date(systemStats.lastBackup).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stockage</p>
                <p className="text-2xl font-bold">{systemStats.storageUsed}%</p>
                <Progress value={systemStats.storageUsed} className="mt-2" />
              </div>
              <Database className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Actions de sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={simulateBackup}
              disabled={isBackupInProgress}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isBackupInProgress ? 'Sauvegarde en cours...' : 'Créer une sauvegarde'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => toast({ title: "Import de sauvegarde", description: "Fonctionnalité en développement" })}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer une sauvegarde
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => toast({ title: "Configuration", description: "Ouverture des paramètres de sauvegarde" })}
            >
              <Shield className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </div>

          {isBackupInProgress && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sauvegarde en cours... {backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations système */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration automatique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Les sauvegardes automatiques sont activées et s'exécutent tous les jours à 2h00.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Prochaine sauvegarde :</span>
                <span className="text-sm font-medium">
                  {new Date(systemStats.nextScheduled).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rétention :</span>
                <span className="text-sm font-medium">{systemStats.retentionDays} jours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Compression :</span>
                <span className="text-sm font-medium">Activée (gzip)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Chiffrement :</span>
                <span className="text-sm font-medium">AES-256</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tables sauvegardées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['users', 'reservations', 'orders', 'customers', 'menu_items', 'employees', 'settings'].map((table, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">{table}</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des sauvegardes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map(backup => (
              <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{backup.name}</h4>
                    <Badge variant={getStatusColor(backup.status)} className="flex items-center gap-1">
                      {getStatusIcon(backup.status)}
                      {backup.status === 'completed' ? 'Terminée' : backup.status}
                    </Badge>
                    <Badge variant={getTypeColor(backup.type)}>
                      {backup.type === 'auto' ? 'Auto' : backup.type === 'manual' ? 'Manuel' : 'Partiel'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span>📅 {new Date(backup.date).toLocaleString('fr-FR')}</span>
                      <span>💾 {backup.size}</span>
                      <span>📋 {backup.tables.length} tables</span>
                    </div>
                    <p>{backup.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {backup.tables.map((table, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={simulateRestore}
                    disabled={isRestoreInProgress}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {isRestoreInProgress ? 'Restauration...' : 'Restaurer'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}