import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Database, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface BackupSystemProps {
  userRole: 'directeur' | 'employe';
}

interface Backup {
  id: number;
  name: string;
  type: 'auto' | 'manual';
  size: string;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export default function BackupSystem({ userRole }: BackupSystemProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        setAutoBackupEnabled(data.autoBackupEnabled || true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sauvegardes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createManualBackup = async () => {
    if (userRole !== 'directeur') return;
    
    setIsCreatingBackup(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'manual' })
      });
      
      if (response.ok) {
        await loadBackups();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const toggleAutoBackup = async () => {
    if (userRole !== 'directeur') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/backups/auto-settings', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled: !autoBackupEnabled })
      });
      
      if (response.ok) {
        setAutoBackupEnabled(!autoBackupEnabled);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
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
        a.download = `backup-${backupId}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement des sauvegardes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Système de Sauvegarde</h2>
          <p className="text-gray-600 dark:text-gray-300">Gestion des sauvegardes automatiques et manuelles</p>
        </div>
        {userRole === 'directeur' && (
          <Button 
            onClick={createManualBackup} 
            disabled={isCreatingBackup}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Database className="h-4 w-4 mr-2" />
            {isCreatingBackup ? 'Création...' : 'Nouvelle Sauvegarde'}
          </Button>
        )}
      </div>

      {/* Paramètres de sauvegarde automatique */}
      {userRole === 'directeur' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Sauvegarde Automatique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sauvegarde automatique quotidienne</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sauvegarde automatique tous les jours à 2h00
                </p>
              </div>
              <Button
                variant={autoBackupEnabled ? "default" : "outline"}
                onClick={toggleAutoBackup}
              >
                {autoBackupEnabled ? 'Activée' : 'Désactivée'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des sauvegardes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Sauvegardes</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Aucune sauvegarde disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(backup.status)}
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <span>{new Date(backup.createdAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                        <span>•</span>
                        <span>{backup.size}</span>
                        <Badge className={getStatusColor(backup.status)}>
                          {backup.type === 'auto' ? 'Automatique' : 'Manuel'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(backup.status)}>
                      {backup.status === 'completed' ? 'Terminée' : 
                       backup.status === 'in_progress' ? 'En cours' : 'Échouée'}
                    </Badge>
                    {backup.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {backups.filter(b => b.status === 'completed').length}
                </p>
                <p className="text-gray-600 dark:text-gray-300">Sauvegardes réussies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{backups.length}</p>
                <p className="text-gray-600 dark:text-gray-300">Total sauvegardes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {backups.length > 0 ? 
                    new Date(backups[0]?.createdAt).toLocaleDateString('fr-FR') : 
                    'Aucune'
                  }
                </p>
                <p className="text-gray-600 dark:text-gray-300">Dernière sauvegarde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}