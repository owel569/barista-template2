import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  CheckCircle,
  Settings,
  TrendingUp,
  TrendingDown,
  Wrench
} from 'lucide-react';

interface Sensor {
  id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  lastUpdate: string;
  threshold?: {
    min: number;
    max: number;
  };
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'maintenance' | 'offline';
  healthScore: number;
  lastMaintenance: string;
  nextMaintenance: string;
  metrics: {
    temperature?: number;
    pressure?: number;
    usage?: number;
  };
}

const IoTDashboard: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchIoTData();
    // Actualisation toutes les 5 secondes
    const interval = setInterval(fetchIoTData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIoTData = async () => {
    try {
      const response = await fetch('/api/admin/advanced/iot/sensors');
      if (response.ok) {
        const data = await response.json();
        // Transformation des données pour le composant
        const sensorsData: Sensor[] = [
          {
            id: 'temp_kitchen',
            name: 'Température Cuisine',
            type: 'temperature',
            value: data?.kitchen?.temperature?.value ?? 22.5,
            unit: '°C',
            status: (data?.kitchen?.temperature?.status as Sensor['status']) ?? 'normal',
            lastUpdate: new Date().toISOString(),
            threshold: { min: 18, max: 25 }
          },
          {
            id: 'humidity_dining',
            name: 'Humidité Salle',
            type: 'humidity',
            value: data?.diningArea?.humidity ?? 45,
            unit: '%',
            status: 'normal',
            lastUpdate: new Date().toISOString(),
            threshold: { min: 40, max: 60 }
          },
          {
            id: 'occupancy',
            name: 'Occupation Salle',
            type: 'occupancy',
            value: data?.diningArea?.occupancy?.value ?? 18,
            unit: 'personnes',
            status: (data?.diningArea?.occupancy?.status as Sensor['status']) ?? 'normal',
            lastUpdate: new Date().toISOString(),
            threshold: { min: 0, max: 50 }
          }
        ];
        const equipmentData: Equipment[] = [
          {
            id: 'espresso_1',
            name: 'Machine Espresso #1',
            category: 'Cuisine',
            status: (data?.equipment?.espressoMachine1?.status === 'active' ? 'active' : 'maintenance'),
            healthScore: 95,
            lastMaintenance: '2025-01-01',
            nextMaintenance: '2025-03-01',
            metrics: {
              temperature: data?.equipment?.espressoMachine1?.temp ?? 93,
              pressure: data?.equipment?.espressoMachine1?.pressure ?? 9
            }
          },
          {
            id: 'espresso_2',
            name: 'Machine Espresso #2',
            category: 'Cuisine',
            status: (data?.equipment?.espressoMachine2?.status === 'maintenance_needed' ? 'maintenance' : 'active'),
            healthScore: 65,
            lastMaintenance: '2024-12-15',
            nextMaintenance: '2025-01-20',
            metrics: {
              temperature: data?.equipment?.espressoMachine2?.temp ?? 85,
              pressure: data?.equipment?.espressoMachine2?.pressure ?? 7
            }
          },
          {
            id: 'dishwasher',
            name: 'Lave-vaisselle',
            category: 'Nettoyage',
            status: 'active',
            healthScore: 88,
            lastMaintenance: '2025-01-05',
            nextMaintenance: '2025-02-05',
            metrics: {
              usage: 75
            }
          }
        ];
        setSensors(sensorsData);
        setEquipment(equipmentData);
      } else {
        setSensors([]);
        setEquipment([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données IoT:', error);
      setSensors([]);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'normal': 'default',
      'active': 'default',
      'warning': 'destructive',
      'maintenance': 'secondary',
      'critical': 'destructive',
      'offline': 'destructive'
    };
    return <Badge variant={(variants[status as keyof typeof variants] || 'default') as any}>{status}</Badge>;
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Droplets className="h-4 w-4" />;
      case 'pressure':
        return <Gauge className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord IoT</h2>
        <Button onClick={fetchIoTData} variant="outline">
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="sensors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sensors">Capteurs</TabsTrigger>
          <TabsTrigger value="equipment">Équipements</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="sensors">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sensors.map((sensor) => (
              <Card key={sensor.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{sensor.name}</CardTitle>
                  {getSensorIcon(sensor.type}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sensor.value} {sensor.unit}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(sensor.status}
                    {getStatusIcon(sensor.status}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernière mise à jour: {new Date(sensor.lastUpdate).toLocaleTimeString(}
                  </p>
                  {sensor.threshold && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground">
                        Seuils: {sensor.threshold.min} - {sensor.threshold.max} {sensor.unit}
                      </div>
                      <Progress 
                        value={(sensor.value / sensor.threshold.max) * 100} 
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );}
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {getStatusIcon(item.status}
                  </div>
                  <CardDescription>{item.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">État de santé</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={item.healthScore} className="w-16" />
                      <span className="text-sm font-medium">{item.healthScore}%</span>
                    </div>
                  </div>
                  
                  {getStatusBadge(item.status}
                  
                  {item.metrics && (
                    <div className="space-y-2">
                      {typeof item.metrics.temperature !== 'undefined' && (
                        <div className="flex justify-between text-sm">
                          <span>Température:</span>
                          <span>{item.metrics.temperature}°C</span>
                        </div>
                      )}
                      {typeof item.metrics.pressure !== 'undefined' && (
                        <div className="flex justify-between text-sm">
                          <span>Pression:</span>
                          <span>{item.metrics.pressure} bar</span>
                        </div>
                      )}
                      {typeof item.metrics.usage !== 'undefined' && (
                        <div className="flex justify-between text-sm">
                          <span>Utilisation:</span>
                          <span>{item.metrics.usage}%</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    <div>Dernière maintenance: {item.lastMaintenance}</div>
                    <div>Prochaine maintenance: {item.nextMaintenance}</div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <Wrench className="h-4 w-4 mr-2" />
                    Gérer
                  </Button>
                </CardContent>
              </Card>
            );}
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertes Système</CardTitle>
              <CardDescription>
                Notifications en temps réel des capteurs et équipements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Aucune alerte active</p>
                  <p className="text-sm">Tous les systèmes fonctionnent normalement</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Résoudre
                      </Button>
                    </div>
                  );}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IoTDashboard;