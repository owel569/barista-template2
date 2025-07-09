import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  User, 
  Calendar, 
  Clock, 
  Filter, 
  Search,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

interface ActivityLogsProps {
  userRole?: 'directeur' | 'employe';
}

export default function ActivityLogs({ userRole = 'directeur' }: ActivityLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Fetch activity logs
  const { data: activityLogs = [], refetch, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/admin/logs'],
  });

  // Mock data for demonstration
  const mockLogs: ActivityLog[] = [
    {
      id: 1,
      userId: 1,
      username: 'admin',
      action: 'LOGIN',
      target: 'Système',
      details: 'Connexion réussie depuis l\'interface admin',
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      severity: 'success'
    },
    {
      id: 2,
      userId: 1,
      username: 'admin',
      action: 'CREATE_MENU_ITEM',
      target: 'Menu',
      details: 'Création d\'un nouvel article: Latte Macchiato',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      severity: 'info'
    },
    {
      id: 3,
      userId: 2,
      username: 'employe',
      action: 'UPDATE_RESERVATION',
      target: 'Réservations',
      details: 'Mise à jour du statut de la réservation #123',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0...',
      severity: 'info'
    },
    {
      id: 4,
      userId: 1,
      username: 'admin',
      action: 'DELETE_CUSTOMER',
      target: 'Clients',
      details: 'Suppression du client: Jean Dupont',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      severity: 'warning'
    },
    {
      id: 5,
      userId: 1,
      username: 'admin',
      action: 'FAILED_LOGIN',
      target: 'Système',
      details: 'Tentative de connexion échouée - mot de passe incorrect',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0...',
      severity: 'error'
    },
    {
      id: 6,
      userId: 2,
      username: 'employe',
      action: 'CREATE_ORDER',
      target: 'Commandes',
      details: 'Création d\'une nouvelle commande #456',
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0...',
      severity: 'success'
    }
  ];

  const logsToDisplay = activityLogs.length > 0 ? activityLogs : mockLogs;

  // Filter logs
  const filteredLogs = logsToDisplay.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser = filterUser === 'all' || log.username === filterUser;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;

    return matchesSearch && matchesUser && matchesAction && matchesSeverity;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR')
    };
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const uniqueUsers = Array.from(new Set(logsToDisplay.map(log => log.username)));
  const uniqueActions = Array.from(new Set(logsToDisplay.map(log => log.action)));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Historique des Actions
          </h1>
          <p className="text-muted-foreground">Suivi des activités et actions système</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="Utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Gravité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setFilterUser('all');
                setFilterAction('all');
                setFilterSeverity('all');
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Actions</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Succès</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLogs.filter(log => log.severity === 'success').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Avertissements</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredLogs.filter(log => log.severity === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Erreurs</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredLogs.filter(log => log.severity === 'error').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Journal d'Activité</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gravité</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Détails</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun journal d'activité trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const { date, time } = formatTimestamp(log.timestamp);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(log.severity)}
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {log.username}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.action}
                          </code>
                        </TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={log.details}>
                            {log.details}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            {date}
                            <Clock className="h-3 w-3" />
                            {time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg max-h-96 overflow-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Détails de l'Action
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="font-medium">ID:</label>
                <p>{selectedLog.id}</p>
              </div>
              <div>
                <label className="font-medium">Utilisateur:</label>
                <p>{selectedLog.username} (ID: {selectedLog.userId})</p>
              </div>
              <div>
                <label className="font-medium">Action:</label>
                <p>{selectedLog.action}</p>
              </div>
              <div>
                <label className="font-medium">Cible:</label>
                <p>{selectedLog.target}</p>
              </div>
              <div>
                <label className="font-medium">Détails:</label>
                <p>{selectedLog.details}</p>
              </div>
              <div>
                <label className="font-medium">Adresse IP:</label>
                <p>{selectedLog.ipAddress}</p>
              </div>
              <div>
                <label className="font-medium">Navigateur:</label>
                <p className="text-xs break-all">{selectedLog.userAgent}</p>
              </div>
              <div>
                <label className="font-medium">Horodatage:</label>
                <p>{new Date(selectedLog.timestamp).toLocaleString('fr-FR')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}