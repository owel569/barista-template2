
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Search, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Shield,
  Database,
  Settings,
  Eye,
  Trash2
} from "lucide-react";
import { format, subDays, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: number;
  userId: number;
  userName?: string;
  userRole?: string;
  action: string;
  module: string;
  details?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

interface LogFilter {
  search: string;
  action: string;
  module: string;
  user: string;
  severity: string;
  startDate?: Date;
  endDate?: Date;
}

interface LogStats {
  totalLogs: number;
  todayLogs: number;
  criticalAlerts: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  severityDistribution: Record<string, number>;
}

// Configuration des styles et icônes par type d'action
const actionConfig: Record<string, { 
  color: string; 
  icon: React.ComponentType<{ className?: string }>; 
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}> = {
  LOGIN: { 
    color: 'bg-green-100 text-green-800', 
    icon: User, 
    label: 'Connexion',
    severity: 'low'
  },
  LOGOUT: { 
    color: 'bg-gray-100 text-gray-800', 
    icon: User, 
    label: 'Déconnexion',
    severity: 'low'
  },
  CREATE: { 
    color: 'bg-blue-100 text-blue-800', 
    icon: CheckCircle, 
    label: 'Création',
    severity: 'medium'
  },
  UPDATE: { 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Settings, 
    label: 'Modification',
    severity: 'medium'
  },
  DELETE: { 
    color: 'bg-red-100 text-red-800', 
    icon: Trash2, 
    label: 'Suppression',
    severity: 'high'
  },
  VIEW: { 
    color: 'bg-purple-100 text-purple-800', 
    icon: Eye, 
    label: 'Consultation',
    severity: 'low'
  },
  ERROR: { 
    color: 'bg-red-100 text-red-800', 
    icon: AlertTriangle, 
    label: 'Erreur',
    severity: 'critical'
  },
  SECURITY: { 
    color: 'bg-orange-100 text-orange-800', 
    icon: Shield, 
    label: 'Sécurité',
    severity: 'critical'
  },
  BACKUP: { 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: Database, 
    label: 'Sauvegarde',
    severity: 'medium'
  }
};

const MODULES = [
  'Auth', 'Users', 'Orders', 'Menu', 'Inventory', 
  'Reports', 'Settings', 'Payments', 'Analytics', 'System'
];

const SEVERITIES = [
  { value: 'low', label: 'Faible', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Moyen', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Élevé', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critique', color: 'bg-red-100 text-red-800' }
];

export default function ActivityLogs(): JSX.Element {
  const [filters, setFilters] = useState<LogFilter>({
    search: '',
    action: 'all',
    module: 'all',
    user: 'all',
    severity: 'all',
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des données
  const { 
    data: logsResponse, 
    isLoading: logsLoading, 
    error: logsError 
  } = useQuery({
    queryKey: ['/api/admin/activity-logs', filters, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: filters.search,
        action: filters.action,
        module: filters.module,
        user: filters.user,
        severity: filters.severity,
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() })
      });

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des logs');
      return response.json();
    },
    retry: 2,
    staleTime: 30000
  });

  const { data: stats } = useQuery<LogStats>({
    queryKey: ['/api/admin/activity-logs/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activity-logs/stats');
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      return response.json();
    },
    refetchInterval: 60000
  });

  // Mutation pour l'export
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'excel' | 'json') => {
      const params = new URLSearchParams({
        format,
        ...filters,
        startDate: filters.startDate?.toISOString() || '',
        endDate: filters.endDate?.toISOString() || ''
      });
      
      const response = await fetch(`/api/admin/activity-logs/export?${params}`);
      if (!response.ok) throw new Error('Erreur lors de l\'export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export réussi",
        description: "Le fichier a été téléchargé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur d'export",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Gestionnaires d'événements optimisés
  const handleFilterChange = useCallback((key: keyof LogFilter, value: string | Date) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset à la première page
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedLogs.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner des logs",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/activity-logs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, logIds: selectedLogs })
      });

      if (!response.ok) throw new Error('Erreur lors de l\'action groupée');

      toast({
        title: "Action réussie",
        description: `${action} appliqué à ${selectedLogs.length} logs`,
      });

      setSelectedLogs([]);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-logs'] });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Action échouée",
        variant: "destructive",
      });
    }
  }, [selectedLogs, toast, queryClient]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/activity-logs'] });
    toast({
      title: "Actualisation",
      description: "Données mises à jour",
    });
  }, [queryClient, toast]);

  // Formatage de date sécurisé
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'Date invalide';
    const date = new Date(dateString);
    if (!isValid(date)) return 'Date invalide';
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr });
  }, []);

  // Données dérivées
  const logs = logsResponse?.data || [];
  const total = logsResponse?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredStats = useMemo(() => {
    if (!stats) return null;
    return {
      ...stats,
      filteredCount: total
    };
  }, [stats, total]);

  if (logsError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des logs: {logsError instanceof Error ? logsError.message : 'Erreur inconnue'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs d'activité
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={logsLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate('excel')}
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {filteredStats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{filteredStats.totalLogs.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total logs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{filteredStats.todayLogs}</p>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{filteredStats.criticalAlerts}</p>
                <p className="text-sm text-muted-foreground">Critiques</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{filteredStats.uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Logs d'activité</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtres avancés */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-8"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>

                <Select 
                  value={filters.action} 
                  onValueChange={(val) => handleFilterChange('action', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    {Object.entries(actionConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.module} 
                  onValueChange={(val) => handleFilterChange('module', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modules</SelectItem>
                    {MODULES.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={filters.severity} 
                  onValueChange={(val) => handleFilterChange('severity', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gravité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes gravités</SelectItem>
                    {SEVERITIES.map((severity) => (
                      <SelectItem key={severity.value} value={severity.value}>
                        {severity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DatePicker
                  date={filters.startDate}
                  onDateChange={(date) => handleFilterChange('startDate', date || new Date())}
                  placeholder="Date début"
                />

                <DatePicker
                  date={filters.endDate}
                  onDateChange={(date) => handleFilterChange('endDate', date || new Date())}
                  placeholder="Date fin"
                />
              </div>

              {selectedLogs.length > 0 && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-blue-50 rounded">
                  <span className="text-sm">{selectedLogs.length} logs sélectionnés</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                    Archiver
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600"
                  >
                    Supprimer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tableau des logs */}
          <Card>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-2">Chargement...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Aucun log trouvé</p>
                  <p className="text-muted-foreground">
                    Essayez de modifier vos filtres de recherche
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLogs(logs.map(log => log.id));
                            } else {
                              setSelectedLogs([]);
                            }
                          }}
                          checked={selectedLogs.length === logs.length && logs.length > 0}
                        />
                      </TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>Gravité</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const config = actionConfig[log.action] || actionConfig.VIEW;
                      const severityConfig = SEVERITIES.find(s => s.value === log.severity) || SEVERITIES[0];
                      const IconComponent = config.icon;
                      
                      return (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedLogs.includes(log.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLogs([...selectedLogs, log.id]);
                                } else {
                                  setSelectedLogs(selectedLogs.filter(id => id !== log.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.userName || `User ${log.userId}`}</p>
                              {log.userRole && (
                                <Badge variant="outline" className="text-xs">
                                  {log.userRole}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              <div className="flex items-center gap-1">
                                <IconComponent className="h-3 w-3" />
                                <span>{config.label}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.module}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={log.details}>
                              {log.details || "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={severityConfig.color}>
                              {severityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.ipAddress || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, total)} sur {total} logs
                    </span>
                    <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + Math.max(1, page - 2);
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions les plus fréquentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.topActions?.map((item, index) => (
                    <div key={item.action} className="flex items-center justify-between p-2 rounded bg-muted">
                      <span className="font-medium">{actionConfig[item.action]?.label || item.action}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par gravité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats?.severityDistribution && Object.entries(stats.severityDistribution).map(([severity, count]) => {
                    const config = SEVERITIES.find(s => s.value === severity);
                    return (
                      <div key={severity} className="flex items-center justify-between p-2 rounded bg-muted">
                        <Badge className={config?.color}>{config?.label}</Badge>
                        <span className="font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Alertes de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.filter(log => log.severity === 'critical' || log.action === 'SECURITY').map((log) => (
                  <Alert key={log.id} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.details}</p>
                          <p className="text-sm">
                            Utilisateur: {log.userName} - {formatDate(log.createdAt)}
                          </p>
                        </div>
                        <Badge variant="destructive">Critique</Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
