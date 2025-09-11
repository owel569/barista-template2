
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface EndpointStatus {
  url: string;
  name: string;
  status: 'online' | 'offline' | 'checking';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
}

export default function DashboardHealthCheck(): JSX.Element {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { url: '/api/dashboard/real-time-stats', name: 'Statistiques Temps Réel', status: 'checking', lastCheck: new Date() },
    { url: '/api/dashboard/statistics', name: 'Statistiques Dashboard', status: 'checking', lastCheck: new Date() },
    { url: '/api/admin/dashboard-stats', name: 'Stats Admin', status: 'checking', lastCheck: new Date() },
    { url: '/api/menu', name: 'Menu Data', status: 'checking', lastCheck: new Date() },
    { url: '/api/orders/recent', name: 'Commandes Récentes', status: 'checking', lastCheck: new Date() },
    { url: '/api/reservations/today', name: 'Réservations Aujourd\'hui', status: 'checking', lastCheck: new Date() }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkEndpoint = async (endpoint: EndpointStatus): Promise<EndpointStatus> => {
    const startTime = Date.now();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('barista_auth_token');
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      
      return {
        ...endpoint,
        status: response.ok ? 'online' : 'offline',
        responseTime,
        lastCheck: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        ...endpoint,
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    console.log('🔍 Vérification de la santé des endpoints dashboard...');
    
    const updatedEndpoints = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(endpoint))
    );
    
    setEndpoints(updatedEndpoints);
    setIsChecking(false);
    
    // Log des résultats
    updatedEndpoints.forEach(endpoint => {
      const status = endpoint.status === 'online' ? '✅' : '❌';
      console.log(`${status} ${endpoint.name}: ${endpoint.status} (${endpoint.responseTime}ms)`);
      if (endpoint.error) {
        console.error(`   Error: ${endpoint.error}`);
      }
    });
  };

  useEffect(() => {
    checkAllEndpoints();
    // Vérification automatique toutes les 30 secondes
    const interval = setInterval(checkAllEndpoints, 30000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = endpoints.filter(e => e.status === 'online').length;
  const offlineCount = endpoints.filter(e => e.status === 'offline').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            État des Données Dashboard
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={checkAllEndpoints}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Vérification...' : 'Actualiser'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">En ligne: {onlineCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm">Hors ligne: {offlineCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm">
              Données réelles: {onlineCount > 0 ? 'Disponibles' : 'Indisponibles'}
            </span>
          </div>
        </div>

        {/* Liste des endpoints */}
        <div className="space-y-2">
          {endpoints.map((endpoint) => (
            <div 
              key={endpoint.url} 
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {endpoint.status === 'online' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {endpoint.status === 'offline' && <XCircle className="h-4 w-4 text-red-600" />}
                {endpoint.status === 'checking' && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
                
                <div>
                  <span className="font-medium">{endpoint.name}</span>
                  <p className="text-xs text-gray-500">{endpoint.url}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={
                  endpoint.status === 'online' ? 'default' : 
                  endpoint.status === 'offline' ? 'destructive' : 'secondary'
                }>
                  {endpoint.status}
                </Badge>
                {endpoint.responseTime && (
                  <span className="text-xs text-gray-500">
                    {endpoint.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommandations */}
        {offlineCount > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Recommandations
              </span>
            </div>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Vérifiez que le serveur backend est démarré</li>
              <li>• Contrôlez la connectivité réseau</li>
              <li>• Vérifiez l'authentification (token valide)</li>
              <li>• Les dashboards utilisent des données de fallback si nécessaire</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
