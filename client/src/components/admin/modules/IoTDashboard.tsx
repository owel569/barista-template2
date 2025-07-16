
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Thermometer, 
  Droplets, 
  Zap, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Wrench
} from 'lucide-react';

const IoTDashboard = () => {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['/api/admin/advanced/iot/devices'],
    refetchInterval: 5000
  });

  const { data: maintenance } = useQuery({
    queryKey: ['/api/admin/advanced/maintenance/schedule'],
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement des capteurs IoT...</p>
        </div>
      </div>
    );
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'humidity': return <Droplets className="h-4 w-4" />;
      case 'energy': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'warning': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard IoT & Maintenance</h1>
          <p className="text-gray-600">Surveillance en temps réel des équipements connectés</p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <Wifi className="h-4 w-4 mr-2" />
          {devices?.filter((d: any) => d.status === 'online').length || 0} connectés
        </Badge>
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Capteurs IoT</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="energy">Énergie</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices?.map((device: any) => (
              <Card key={device.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {getDeviceIcon(device.type)}
                    {device.name}
                  </CardTitle>
                  <Badge variant={device.status === 'online' ? 'default' : 'destructive'}>
                    {device.status === 'online' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {device.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{device.value} {device.unit}</div>
                  <p className="text-xs text-muted-foreground">{device.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernière MAJ: {new Date(device.lastUpdate).toLocaleTimeString()}
                  </p>
                  {device.alerts?.length > 0 && (
                    <div className="mt-2">
                      {device.alerts.map((alert: any, idx: number) => (
                        <Alert key={idx} className="mt-1">
                          <AlertDescription className="text-xs">
                            {alert.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Planning de Maintenance Prédictive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenance?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.equipment}</div>
                      <div className="text-sm text-gray-600">
                        {item.type} - {item.estimatedDuration}
                      </div>
                      <div className="text-xs text-gray-500">
                        Technicien: {item.technician}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.nextDate}</div>
                      <Badge variant={
                        item.priority === 'haute' ? 'destructive' : 
                        item.priority === 'moyenne' ? 'default' : 'secondary'
                      }>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consommation Actuelle</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24.5 kWh</div>
                <p className="text-xs text-muted-foreground">
                  -8% vs mois dernier
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Économies CO₂</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">124 kg</div>
                <p className="text-xs text-muted-foreground">
                  CO₂ économisé ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficacité</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">
                  Optimisation énergétique
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IoTDashboard;
