import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, Download, Upload, RefreshCw, Shield, AlertTriangle, CheckCircle, Settings
} from 'lucide-react';

interface Backup {
  id: number;
  name: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'in_progress' | 'failed';
  size: number;
  createdAt: string;
  tables: string[];
}

interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: string;
  retentionDays: number;
  compressionEnabled: boolean;
}

export default function BackupSystem() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [backupsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/backups', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/backups/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (backupsRes.ok && settingsRes.ok) {
        const [backupsData, settingsData] = await Promise.all([
          backupsRes.json(),
          settingsRes.json()
        ]);
        
        setBackups(backupsData);
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sauvegardes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'failed': return 'Échec';
      default: return 'Inconnu';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createBackup = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'manual',
          name: `Sauvegarde_${new Date().toISOString().split('T')[0]}`
        })
      });

      if (response.ok) {
        await fetchBackupData();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const downloadBackup = async (backupId: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/backups/${backupId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${backupId}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const completedBackups = backups.filter(b => b.status === 'completed').length;
  const totalSize = backups.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.size, 0);
  const lastBackup = backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
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
            Système de Sauvegarde
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des sauvegardes et restauration des données
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBackupData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={createBackup} disabled={isCreating}>
            {isCreating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Nouvelle Sauvegarde
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sauvegardes Totales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedBackups}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Taille Totale
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatFileSize(totalSize)}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Dernière Sauvegarde
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {lastBackup ? new Date(lastBackup.createdAt).toLocaleDateString('fr-FR') : 'Aucune'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sauvegarde Auto
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {settings?.autoBackupEnabled ? 'Activée' : 'Désactivée'}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="backups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="backups">Sauvegardes</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="restore">Restauration</TabsTrigger>
          <TabsTrigger value="schedule">Planification</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-6">
          <div className="space-y-4">
            {backups.map((backup) => (
              <Card key={backup.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {backup.name}
                          </h3>
                          <Badge className={getStatusColor(backup.status)}>
                            {getStatusIcon(backup.status)}
                            <span className="ml-1">{getStatusText(backup.status)}</span>
                          </Badge>
                          <Badge variant="outline">
                            {backup.type === 'manual' ? 'Manuelle' : 'Automatique'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Taille:</span>
                            <p className="font-medium">{formatFileSize(backup.size)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                            <p className="font-medium">
                              {new Date(backup.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Heure:</span>
                            <p className="font-medium">
                              {new Date(backup.createdAt).toLocaleTimeString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Tables:</span>
                            <p className="font-medium">{backup.tables.length} tables</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {backup.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Automatique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Sauvegarde automatique:</span>
                    <Badge className={settings?.autoBackupEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {settings?.autoBackupEnabled ? 'Activée' : 'Désactivée'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fréquence:</span>
                    <span className="font-semibold">{settings?.backupFrequency || 'Quotidienne'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rétention:</span>
                    <span className="font-semibold">{settings?.retentionDays || 30} jours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Compression:</span>
                    <Badge className={settings?.compressionEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                      {settings?.compressionEnabled ? 'Activée' : 'Désactivée'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Chiffrement:</span>
                    <Badge className="bg-green-100 text-green-800">AES-256</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vérification d'intégrité:</span>
                    <Badge className="bg-blue-100 text-blue-800">SHA-256</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stockage sécurisé:</span>
                    <Badge className="bg-purple-100 text-purple-800">Local + Cloud</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="restore" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Restauration de Données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Importer une Sauvegarde</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Glissez-déposez un fichier de sauvegarde ou cliquez pour sélectionner
                  </p>
                  <Button variant="outline">
                    Sélectionner un Fichier
                  </Button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Attention
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        La restauration remplacera toutes les données actuelles. 
                        Assurez-vous d'avoir une sauvegarde récente avant de procéder.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Planification Actuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Sauvegarde Quotidienne</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tous les jours à 02:00
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Sauvegarde Hebdomadaire</span>
                      <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tous les dimanches à 01:00
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Nettoyage Automatique</span>
                      <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Suppression des sauvegardes &gt; 30 jours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prochaines Sauvegardes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: 'Quotidienne', date: 'Aujourd hui 02:00', status: 'scheduled' },
                    { type: 'Hebdomadaire', date: 'Dimanche 01:00', status: 'scheduled' },
                    { type: 'Nettoyage', date: 'Dans 7 jours', status: 'scheduled' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{item.type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.date}</p>
                      </div>
                      <Badge variant="outline">Planifiée</Badge>
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