import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Cpu, 
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Zap,
  Thermometer,
  Wifi,
  Shield,
  RefreshCw,
  Bell,
  Settings,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SystemMonitoringProps {
  userRole: 'directeur' | 'employe';
}

export default function SystemMonitoring({ userRole }: SystemMonitoringProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Données factices pour le monitoring système
  const systemStats = {
    cpu: {
      usage: 45,
      temperature: 58,
      cores: 4,
      frequency: 2.4,
      status: 'healthy'
    },
    memory: {
      used: 3.2,
      total: 8.0,
      percentage: 40,
      status: 'healthy'
    },
    disk: {
      used: 125,
      total: 250,
      percentage: 50,
      status: 'healthy'
    },
    network: {
      uploadSpeed: 15.2,
      downloadSpeed: 89.5,
      latency: 23,
      status: 'healthy'
    }
  };

  const services = [
    {
      name: 'Serveur Web',
      status: 'running',
      uptime: '7j 12h 45m',
      port: 5000,
      cpu: 12,
      memory: 256,
      version: '1.0.0'
    },
    {
      name: 'Base de données',
      status: 'running',
      uptime: '7j 12h 45m',
      port: 5432,
      cpu: 8,
      memory: 512,
      version: '13.7'
    },
    {
      name: 'WebSocket',
      status: 'running',
      uptime: '7j 12h 45m',
      port: 5000,
      cpu: 3,
      memory: 64,
      version: '1.0.0'
    },
    {
      name: 'Cache Redis',
      status: 'warning',
      uptime: '2j 8h 12m',
      port: 6379,
      cpu: 5,
      memory: 128,
      version: '6.2'
    }
  ];

  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Utilisation mémoire élevée',
      message: 'La mémoire utilisée a dépassé 85% pendant 5 minutes',
      timestamp: '2025-07-09T16:30:00Z',
      resolved: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Redémarrage du service Cache',
      message: 'Le service Redis a été redémarré automatiquement',
      timestamp: '2025-07-09T14:15:00Z',
      resolved: true
    },
    {
      id: 3,
      type: 'error',
      title: 'Connexion base de données temporairement interrompue',
      message: 'Reconnexion automatique réussie après 30 secondes',
      timestamp: '2025-07-09T12:00:00Z',
      resolved: true
    }
  ];

  const logs = [
    {
      id: 1,
      timestamp: '2025-07-09T16:45:23Z',
      level: 'info',
      service: 'web-server',
      message: 'GET /api/admin/dashboard 200 - 45ms'
    },
    {
      id: 2,
      timestamp: '2025-07-09T16:45:20Z',
      level: 'info',
      service: 'database',
      message: 'Query executed successfully: SELECT * FROM reservations'
    },
    {
      id: 3,
      timestamp: '2025-07-09T16:45:18Z',
      level: 'warn',
      service: 'web-server',
      message: 'Slow query detected: 1.2s for analytics endpoint'
    },
    {
      id: 4,
      timestamp: '2025-07-09T16:45:15Z',
      level: 'info',
      service: 'websocket',
      message: 'Client connected from 192.168.1.100'
    },
    {
      id: 5,
      timestamp: '2025-07-09T16:45:12Z',
      level: 'error',
      service: 'redis',
      message: 'Connection timeout, retrying...'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefresh(new Date());
      toast({
        title: "Données actualisées",
        description: "Les informations système ont été mises à jour.",
      });
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
      case 'stopped':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'stopped':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-blue-600';
      case 'warn':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderSystemOverview = () => (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CPU</p>
                <p className="text-2xl font-bold">{systemStats.cpu.usage}%</p>
                <p className="text-sm text-gray-500">{systemStats.cpu.temperature}°C</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={systemStats.cpu.usage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mémoire</p>
                <p className="text-2xl font-bold">{systemStats.memory.percentage}%</p>
                <p className="text-sm text-gray-500">{systemStats.memory.used}GB / {systemStats.memory.total}GB</p>
              </div>
              <Monitor className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={systemStats.memory.percentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disque</p>
                <p className="text-2xl font-bold">{systemStats.disk.percentage}%</p>
                <p className="text-sm text-gray-500">{systemStats.disk.used}GB / {systemStats.disk.total}GB</p>
              </div>
              <HardDrive className="h-8 w-8 text-purple-600" />
            </div>
            <Progress value={systemStats.disk.percentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réseau</p>
                <p className="text-2xl font-bold">{systemStats.network.latency}ms</p>
                <p className="text-sm text-gray-500">↓ {systemStats.network.downloadSpeed} Mbps</p>
              </div>
              <Network className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="mt-3 text-sm text-gray-500">
              ↑ {systemStats.network.uploadSpeed} Mbps
            </div>
          </CardContent>
        </Card>
      </div>

      {/* État des services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Services système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">
                      Port {service.port} • Uptime: {service.uptime}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    CPU: {service.cpu}% • RAM: {service.memory}MB
                  </div>
                  <Badge variant={service.status === 'running' ? 'default' : 'secondary'}>
                    {service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 3).map(alert => (
              <Alert key={alert.id} className={cn(
                "border-l-4",
                alert.type === 'error' && "border-l-red-500",
                alert.type === 'warning' && "border-l-yellow-500",
                alert.type === 'info' && "border-l-blue-500"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    {alert.type === 'info' && <Info className="h-4 w-4 text-blue-500" />}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString('fr-FR')}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLogs = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Logs système
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className={getLogLevelColor(log.level)}>
                  {log.level}
                </Badge>
                <div>
                  <div className="font-medium text-sm">{log.service}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{log.message}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performances en temps réel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Processeur</span>
                  <span>{systemStats.cpu.usage}%</span>
                </div>
                <Progress value={systemStats.cpu.usage} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Mémoire</span>
                  <span>{systemStats.memory.percentage}%</span>
                </div>
                <Progress value={systemStats.memory.percentage} />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Disque</span>
                  <span>{systemStats.disk.percentage}%</span>
                </div>
                <Progress value={systemStats.disk.percentage} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques réseau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Latence</span>
                <span className="font-medium">{systemStats.network.latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Débit descendant</span>
                <span className="font-medium">{systemStats.network.downloadSpeed} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Débit montant</span>
                <span className="font-medium">{systemStats.network.uploadSpeed} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Connexions actives</span>
                <span className="font-medium">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Monitoring système</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Dernière MAJ: {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderSystemOverview()}
        </TabsContent>

        <TabsContent value="logs">
          {renderLogs()}
        </TabsContent>

        <TabsContent value="performance">
          {renderPerformance()}
        </TabsContent>
      </Tabs>
    </div>
  );
}