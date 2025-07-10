import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Server, 
  Database, 
  Wifi, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  HardDrive as Memory,
  Network,
  Thermometer,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface SystemMonitoringProps {
  userRole?: 'directeur' | 'employe';
}

export default function SystemMonitoring({ userRole = 'directeur' }: SystemMonitoringProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const systemMetrics = {
    cpu: {
      usage: 45,
      temperature: 65,
      cores: 4,
      status: 'optimal'
    },
    memory: {
      used: 3.2,
      total: 8.0,
      usage: 40,
      status: 'optimal'
    },
    storage: {
      used: 250,
      total: 500,
      usage: 50,
      status: 'optimal'
    },
    network: {
      download: 125.5,
      upload: 45.2,
      ping: 15,
      status: 'optimal'
    }
  };

  const services = [
    {
      name: 'Serveur Web',
      status: 'running',
      uptime: '99.9%',
      port: 5000,
      responseTime: 45,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Base de données',
      status: 'running',
      uptime: '99.8%',
      port: 5432,
      responseTime: 12,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'WebSocket',
      status: 'running',
      uptime: '99.7%',
      port: 5000,
      responseTime: 8,
      lastCheck: new Date().toISOString()
    },
    {
      name: 'Redis Cache',
      status: 'warning',
      uptime: '98.5%',
      port: 6379,
      responseTime: 156,
      lastCheck: new Date().toISOString()
    }
  ];

  const performanceData = [
    { time: '10:00', cpu: 25, memory: 35, network: 45 },
    { time: '10:15', cpu: 32, memory: 38, network: 52 },
    { time: '10:30', cpu: 45, memory: 40, network: 48 },
    { time: '10:45', cpu: 38, memory: 42, network: 55 },
    { time: '11:00', cpu: 52, memory: 45, network: 60 },
    { time: '11:15', cpu: 48, memory: 43, network: 58 },
    { time: '11:30', cpu: 55, memory: 48, network: 65 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'optimal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'optimal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date());
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Monitoring Système</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processeur</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.cpu.usage}%</div>
                <Progress value={systemMetrics.cpu.usage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {systemMetrics.cpu.cores} cœurs • {systemMetrics.cpu.temperature}°C
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mémoire</CardTitle>
                <Memory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.memory.usage}%</div>
                <Progress value={systemMetrics.memory.usage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {systemMetrics.memory.used} Go / {systemMetrics.memory.total} Go
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stockage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.storage.usage}%</div>
                <Progress value={systemMetrics.storage.usage} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {systemMetrics.storage.used} Go / {systemMetrics.storage.total} Go
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réseau</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.network.ping}ms</div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>↓ {systemMetrics.network.download} Mbps</span>
                  <span>↑ {systemMetrics.network.upload} Mbps</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>État des Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-gray-500">Port {service.port}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{service.uptime}</div>
                        <div className="text-xs text-gray-500">{service.responseTime}ms</div>
                      </div>
                      <Badge variant={service.status === 'running' ? 'default' : 'destructive'}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance en Temps Réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Mémoire %" />
                    <Line type="monotone" dataKey="network" stroke="#ffc658" name="Réseau %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertes Système</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-4 border rounded-lg bg-yellow-50">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-medium">Cache Redis lent</h4>
                    <p className="text-sm text-gray-600">
                      Temps de réponse élevé détecté (156ms)
                    </p>
                  </div>
                  <Badge variant="secondary">Warning</Badge>
                </div>
                
                <div className="flex items-center p-4 border rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div className="flex-1">
                    <h4 className="font-medium">Tous les services opérationnels</h4>
                    <p className="text-sm text-gray-600">
                      Serveur web et base de données fonctionnent normalement
                    </p>
                  </div>
                  <Badge variant="default">OK</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}