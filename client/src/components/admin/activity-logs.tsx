import { useState, useEffect, useCallback } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Activity, 
  User, 
  Settings, 
  ShoppingCart, 
  AlertTriangle,
  CheckCircle,
  Search,
  Download,
  RefreshCw,
  Eye,
  Shield,
  Database,
  Trash2,
  Lock,
  Unlock,
  Calendar
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { 
  ActivityLog, 
  ActivityCategory, 
  ActivityFilter, 
  CategoryConfig, 
  SeverityConfig 
} from '@/types/activity';

const CATEGORY_CONFIG: Record<ActivityCategory, CategoryConfig> = {
  auth: { label: 'Authentification', icon: Lock, color: 'blue' },
  user_management: { label: 'Gestion Utilisateurs', icon: User, color: 'green' },
  menu: { label: 'Menu', icon: ShoppingCart, color: 'orange' },
  order: { label: 'Commandes', icon: ShoppingCart, color: 'purple' },
  reservation: { label: 'Réservations', icon: Calendar, color: 'indigo' },
  settings: { label: 'Paramètres', icon: Settings, color: 'gray' },
  security: { label: 'Sécurité', icon: Shield, color: 'red' },
  system: { label: 'Système', icon: Database, color: 'cyan' }
};

const SEVERITY_CONFIG: Record<ActivityLog['severity'], SeverityConfig> = {
  info: { label: 'Info', color: 'blue', icon: CheckCircle },
  success: { label: 'Succès', color: 'green', icon: CheckCircle },
  warning: { label: 'Attention', color: 'yellow', icon: AlertTriangle },
  error: { label: 'Erreur', color: 'red', icon: AlertTriangle }
};

export default function ActivityLogs(): JSX.Element {
  const { toast } = useToast();

  // États
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  const [filters, setFilters] = useState<ActivityFilter>({
    category: 'all',
    severity: 'all',
    userId: '',
    dateRange: {
      start: subDays(new Date(), 7),
      end: new Date()
    },
    searchTerm: ''
  });

  // Génération d'activité simulée
  const generateMockActivity = useCallback((): void => {
    const activities: Omit<ActivityLog, 'id' | 'timestamp'>[] = [
      {
        action: 'ORDER_CREATED',
        category: 'order' as ActivityCategory,
        description: 'Nouvelle commande créée',
        severity: 'info' as const,
        userId: 'customer-' + Math.floor(Math.random() * 1000),
        userName: 'Client ' + Math.floor(Math.random() * 1000),
        userRole: 'customer',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: '',
        metadata: {},
        affectedResource: '',
        previousValue: '',
        newValue: ''
      },
      {
        action: 'RESERVATION_CONFIRMED',
        category: 'reservation' as ActivityCategory,
        description: 'Réservation confirmée pour ce soir',
        severity: 'success' as const,
        userId: 'manager-' + Math.floor(Math.random() * 10),
        userName: 'Manager ' + Math.floor(Math.random() * 10),
        userRole: 'manager',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: '',
        metadata: {},
        affectedResource: '',
        previousValue: '',
        newValue: ''
      },
      {
        action: 'INVENTORY_LOW',
        category: 'system' as ActivityCategory,
        description: 'Stock faible détecté - Grains de café',
        severity: 'warning' as const,
        userId: 'system',
        userName: 'Système',
        userRole: 'system',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: '',
        metadata: {},
        affectedResource: '',
        previousValue: '',
        newValue: ''
      }
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      ...activity
    };

    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Garder seulement les 1000 derniers logs
  }, []);

  // Simulation de données en temps réel
  useEffect(() => {
    loadActivityLogs();

    if (isRealTimeEnabled) {
      const interval = setInterval(() => {
        generateMockActivity();
      }, 30000); // Nouvelle activité toutes les 30 secondes

      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled, generateMockActivity, loadActivityLogs]);

  // Filtrage des logs
  useEffect(() => {
    const filtered = logs.filter(log => {
      const matchesCategory = filters.category === 'all' || log.category === filters.category;
      const matchesSeverity = filters.severity === 'all' || log.severity === filters.severity;
      const matchesUser = !filters.userId || log.userId.includes(filters.userId);
      const matchesDate = log.timestamp >= startOfDay(filters.dateRange.start) && 
                         log.timestamp <= endOfDay(filters.dateRange.end);
      const matchesSearch = !filters.searchTerm || 
        log.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesCategory && matchesSeverity && matchesUser && matchesDate && matchesSearch;
    });

    setFilteredLogs(filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, [logs, filters]);

  // Initial load of activity logs
  const loadActivityLogs = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Simulation de données réelles
      const mockLogs: ActivityLog[] = [
        {
          id: '1',
          timestamp: new Date(),
          userId: 'admin-123',
          userName: 'Admin Système',
          userRole: 'admin',
          action: 'LOGIN',
          category: 'auth',
          description: 'Connexion administrateur réussie',
          severity: 'success',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          metadata: {},
          affectedResource: '',
          previousValue: '',
          newValue: ''
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000),
          userId: 'user-456',
          userName: 'Marie Dubois',
          userRole: 'manager',
          action: 'UPDATE_MENU',
          category: 'menu',
          description: 'Modification du prix du café expresso',
          severity: 'info',
          ipAddress: '192.168.1.101',
          affectedResource: 'menu_item_15',
          previousValue: '2.50€',
          newValue: '2.80€',
          userAgent: '',
          metadata: {}
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000),
          userId: 'user-789',
          userName: 'Jean Martin',
          userRole: 'employee',
          action: 'FAILED_LOGIN',
          category: 'security',
          description: 'Tentative de connexion échouée - mot de passe incorrect',
          severity: 'warning',
          ipAddress: '192.168.1.102',
          userAgent: '',
          metadata: {},
          affectedResource: '',
          previousValue: '',
          newValue: ''
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 900000),
          userId: 'system',
          userName: 'Système',
          userRole: 'system',
          action: 'BACKUP_COMPLETED',
          category: 'system',
          description: 'Sauvegarde automatique de la base de données terminée',
          severity: 'success',
          ipAddress: '127.0.0.1',
          userAgent: '',
          metadata: {},
          affectedResource: '',
          previousValue: '',
          newValue: ''
        }
      ];

      setLogs(mockLogs);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les journaux d'activité",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);



  const exportLogs = useCallback((): void => {
    try {
      if (filteredLogs.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucun journal à exporter",
          variant: "warning",
        });
        return;
      }

      const dataToExport = filteredLogs.map(log => ({
        Timestamp: format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        Utilisateur: log.userName,
        Rôle: log.userRole,
        Action: log.action,
        Catégorie: CATEGORY_CONFIG[log.category].label,
        Description: log.description,
        Sévérité: SEVERITY_CONFIG[log.severity].label,
        'Adresse IP': log.ipAddress
      }));

      if (dataToExport.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucun journal à exporter",
          variant: "warning",
        });
        return;
      }

      const csvContent = [
        Object.keys(dataToExport[0]!).join(','),
        ...dataToExport.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Les journaux ont été exportés avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les journaux",
        variant: "destructive",
      });
    }
  }, [filteredLogs, toast]);

  const clearOldLogs = useCallback(async (): Promise<void> => {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const filteredLogs = logs.filter(log => log.timestamp >= thirtyDaysAgo);
      setLogs(filteredLogs);

      toast({
        title: "Nettoyage effectué",
        description: `${logs.length - filteredLogs.length} anciens journaux supprimés`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de nettoyer les journaux",
        variant: "destructive",
      });
    }
  }, [logs, toast]);

  const getSeverityBadgeVariant = (severity: ActivityLog['severity']): "default" | "destructive" | "outline" | "secondary" => {
    switch (severity) {
      case 'success': return 'default';
      case 'info': return 'secondary';
      case 'warning': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Journaux d'Activité</h1>
          <p className="text-muted-foreground">
            Surveillance et audit des activités système
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isRealTimeEnabled ? "default" : "outline"}
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Temps réel {isRealTimeEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={loadActivityLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(SEVERITY_CONFIG).map(([severity, config]) => {
          const count = filteredLogs.filter(log => log.severity === severity).length;
          return (
            <Card key={severity}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <config.icon className={`h-8 w-8 text-${config.color}-600`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Journaux</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>

                <Select 
                  value={filters.category} 
                  onValueChange={(value: string) => 
                    setFilters(prev => ({ ...prev, category: value as ActivityCategory | 'all' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.severity} 
                  onValueChange={(value: string) => 
                    setFilters(prev => ({ ...prev, severity: value as ActivityLog['severity'] | 'all' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les sévérités</SelectItem>
                    {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="ID Utilisateur"
                  value={filters.userId}
                  onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                />

                <Button onClick={clearOldLogs} variant="outline">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Nettoyer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table des logs */}
          <Card>
            <CardHeader>
              <CardTitle>Journaux d'Activité ({filteredLogs.length})</CardTitle>
              <CardDescription>
                Activités récentes du système et des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.slice(0, 50).map((log) => {
                    const categoryConfig = CATEGORY_CONFIG[log.category];
                    const CategoryIcon = categoryConfig.icon;

                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {format(log.timestamp, 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-sm">
                            {format(log.timestamp, 'HH:mm:ss', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{log.userName}</div>
                              <div className="text-xs text-muted-foreground">{log.userRole}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{categoryConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {log.action}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm truncate" title={log.description}>
                            {log.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(log.severity)}>
                            {SEVERITY_CONFIG[log.severity].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyses d'Activité</CardTitle>
              <CardDescription>Tendances et statistiques des journaux</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Analyses avancées en cours de développement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Journaux</CardTitle>
              <CardDescription>Paramètres de rétention et d'archivage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Journaux en temps réel</h4>
                    <p className="text-sm text-muted-foreground">
                      Afficher les nouvelles activités automatiquement
                    </p>
                  </div>
                  <Button
                    variant={isRealTimeEnabled ? "default" : "outline"}
                    onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                  >
                    {isRealTimeEnabled ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog détails du log */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l\'Activité</DialogTitle>
            <DialogDescription>
              Informations complètes sur l\'événement sélectionné
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Timestamp</Label>
                  <p className="text-sm">{format(selectedLog.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="font-medium">Sévérité</Label>
                  <div className="mt-1">
                    <Badge variant={getSeverityBadgeVariant(selectedLog.severity)}>
                      {SEVERITY_CONFIG[selectedLog.severity].label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Utilisateur</Label>
                  <p className="text-sm">{selectedLog.userName} ({selectedLog.userRole})</p>
                </div>
                <div>
                  <Label className="font-medium">Catégorie</Label>
                  <p className="text-sm">{CATEGORY_CONFIG[selectedLog.category].label}</p>
                </div>
                <div>
                  <Label className="font-medium">Action</Label>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{selectedLog.action}</p>
                </div>
                <div>
                  <Label className="font-medium">Adresse IP</Label>
                  <p className="text-sm">{selectedLog.ipAddress}</p>
                </div>
              </div>
              <div>
                <Label className="font-medium">Description</Label>
                <p className="text-sm mt-1">{selectedLog.description}</p>
              </div>
              {selectedLog.affectedResource && (
                <div>
                  <Label className="font-medium">Ressource Affectée</Label>
                  <p className="text-sm mt-1">{selectedLog.affectedResource}</p>
                </div>
              )}
              {selectedLog.previousValue && selectedLog.newValue && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Ancienne Valeur</Label>
                    <p className="text-sm mt-1">{selectedLog.previousValue}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Nouvelle Valeur</Label>
                    <p className="text-sm mt-1">{selectedLog.newValue}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}