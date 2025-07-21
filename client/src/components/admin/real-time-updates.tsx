
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Users, 
  ShoppingCart, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Signal,
  Zap,
  Eye,
  Bell
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RealTimeEvent {
  id: string;
  type: 'order' | 'reservation' | 'payment' | 'customer' | 'system' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  handled?: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  latency: number;
}

interface LiveMetrics {
  activeConnections: number;
  eventsPerMinute: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
}

export default function RealTimeUpdates() : void {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastHeartbeat: null,
    reconnectAttempts: 0,
    latency: 0
  });
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    activeConnections: 0,
    eventsPerMinute: 0,
    systemLoad: 0,
    responseTime: 0,
    errorRate: 0
  });
  const [filters, setFilters] = useState<{
    types: string[];
    priorities: string[];
    timeRange: string;
  }>({
    types: ['order', 'reservation', 'payment', 'customer', 'system', 'alert'],
    priorities: ['low', 'medium', 'high', 'critical'],
    timeRange: '1h'
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Simulation WebSocket pour développement
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    try {
      // En production, utiliser wss://votre-domaine/ws
      const wsUrl = window.location.protocol === 'https:' 
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.host}/ws`;

      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          lastHeartbeat: new Date(),
          reconnectAttempts: 0
        }));
        
        toast({
          title: "Connexion temps réel établie",
          description: "Réception des mises à jour en direct"
        });

        // Envoyer heartbeat toutes les 30 secondes
        const heartbeatInterval = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            const start = Date.now();
            websocket.send(JSON.stringify({ type: 'ping' }));
            
            // Mesurer la latence
            setTimeout(() => {
              setConnectionStatus(prev => ({
                ...prev,
                latency: Date.now() - start
              }));
            }, 100);
          }
        }, 30000);

        websocket.onclose = () => {
          clearInterval(heartbeatInterval);
        };
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Erreur parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false
        }));

        // Tentative de reconnexion automatique
        setTimeout(() => {
          setConnectionStatus(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }));
          
          if (connectionStatus.reconnectAttempts < 5) {
            connectWebSocket();
          }
        }, 5000);
      };

      websocket.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        toast({
          title: "Erreur de connexion",
          description: "Problème de connexion temps réel",
          variant: "destructive"
        });
      };

      setWs(websocket);

    } catch (error) {
      console.error('Erreur création WebSocket:', error);
      // Fallback vers polling si WebSocket échoue
      startPollingFallback();
    }
  }, [connectionStatus.reconnectAttempts]);

  const startPollingFallback = useCallback(() => {
    // Simulation polling pour développement
    const pollInterval = setInterval(() => {
      generateMockEvent();
      updateMockMetrics();
    }, 10000);

    setConnectionStatus({
      connected: true,
      lastHeartbeat: new Date(),
      reconnectAttempts: 0,
      latency: 150
    });

    return () => clearInterval(pollInterval);
  }, []);

  const handleWebSocketMessage = useCallback((data: Record<string, unknown>) => {
    switch (data.type) {
      case 'event':
        addNewEvent(data.event);
        break;
      case 'metrics':
        setLiveMetrics(data.metrics);
        break;
      case 'pong':
        setConnectionStatus(prev => ({
          ...prev,
          lastHeartbeat: new Date()
        }));
        break;
      default:
        console.log('Message WebSocket non géré:', data);
    }
  }, []);

  const addNewEvent = useCallback((event: RealTimeEvent) => {
    setEvents(prev => {
      const newEvents = [event, ...prev].slice(0, 100); // Limiter à 100 événements
      
      // Son de notification
      if (soundEnabled && event.priority === 'high' || event.priority === 'critical') {
        playNotificationSound(event.priority);
      }

      return newEvents;
    });

    // Notification toast pour événements critiques
    if (event.priority === 'critical') {
      toast({
        title: `🚨 ${event.title}`,
        description: event.description,
        variant: "destructive"
      });
    }
  }, [soundEnabled]);

  const generateMockEvent = useCallback(() => {
    const eventTypes = ['order', 'reservation', 'payment', 'customer', 'system'];
    const priorities = ['low', 'medium', 'high', 'critical'];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as any;
    const priority = priorities[Math.floor(Math.random() * priorities.length)] as any;

    const mockEvents = {
      order: [
        'Nouvelle commande reçue',
        'Commande prête',
        'Commande annulée',
        'Commande en préparation'
      ],
      reservation: [
        'Nouvelle réservation',
        'Réservation confirmée',
        'Réservation modifiée',
        'Client arrivé'
      ],
      payment: [
        'Paiement traité',
        'Paiement échoué',
        'Remboursement effectué',
        'Transaction en attente'
      ],
      customer: [
        'Nouveau client inscrit',
        'Feedback client reçu',
        'Réclamation client',
        'Client VIP identifié'
      ],
      system: [
        'Mise à jour système',
        'Sauvegarde effectuée',
        'Alerte de performance',
        'Maintenance programmée'
      ]
    };

    const titles = mockEvents[type];
    const title = titles[Math.floor(Math.random() * titles.length)];

    const event: RealTimeEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      description: `Description pour ${title.toLowerCase()}`,
      timestamp: new Date(),
      priority,
      data: {
        amount: type === 'payment' ? Math.floor(Math.random() * 100) + 10 : undefined,
        tableNumber: type === 'reservation' ? Math.floor(Math.random() * 20) + 1 : undefined,
        orderId: type === 'order' ? `ORD-${Math.floor(Math.random() * 1000)}` : undefined
      }
    };

    addNewEvent(event);
  }, [addNewEvent]);

  const updateMockMetrics = useCallback(() => {
    setLiveMetrics({
      activeConnections: Math.floor(Math.random() * 50) + 10,
      eventsPerMinute: Math.floor(Math.random() * 20) + 5,
      systemLoad: Math.floor(Math.random() * 30) + 40,
      responseTime: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 2
    });
  }, []);

  const playNotificationSound = (priority: string) => {
    // Simulation son de notification
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        priority === 'critical' ? 'Alerte critique' : 'Nouvelle notification'
      );
      utterance.rate = 2;
      utterance.volume = 0.3;
      speechSynthesis.speak(utterance);
    }
  };

  const markEventAsHandled = useCallback((eventId: string) => {
    setEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, handled: true } : event
      )
    );
  }, []);

  const filteredEvents = events.filter(event => {
    const typeMatch = filters.types.includes(event.type);
    const priorityMatch = filters.priorities.includes(event.priority);
    
    let timeMatch = true;
    if (filters.timeRange !== 'all') {
      const now = new Date();
      const timeLimit = new Date();
      
      switch (filters.timeRange) {
        case '15m':
          timeLimit.setMinutes(now.getMinutes() - 15);
          break;
        case '1h':
          timeLimit.setHours(now.getHours() - 1);
          break;
        case '6h':
          timeLimit.setHours(now.getHours() - 6);
          break;
        case '24h':
          timeLimit.setDate(now.getDate() - 1);
          break;
      }
      
      timeMatch = event.timestamp >= timeLimit;
    }
    
    return typeMatch && priorityMatch && timeMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'reservation': return Calendar;
      case 'payment': return TrendingUp;
      case 'customer': return Users;
      case 'system': return Activity;
      case 'alert': return AlertTriangle;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Activity className="h-8 w-8" />
          <span>Mises à jour temps réel</span>
        </h1>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {connectionStatus.connected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Connecté
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <Badge variant="destructive">
                  Déconnecté
                </Badge>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            <Bell className={`h-4 w-4 ${soundEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={generateMockEvent}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Event
          </Button>
        </div>
      </div>

      {/* Métriques temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connexions</p>
                <p className="text-2xl font-bold">{liveMetrics.activeConnections}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Événements/min</p>
                <p className="text-2xl font-bold">{liveMetrics.eventsPerMinute}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Charge système</p>
                <p className="text-2xl font-bold">{liveMetrics.systemLoad}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Latence</p>
                <p className="text-2xl font-bold">{connectionStatus.latency}ms</p>
              </div>
              <Signal className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux erreur</p>
                <p className="text-2xl font-bold">{liveMetrics.errorRate.toFixed(1)}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="filters">Filtres</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {!connectionStatus.connected && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Connexion temps réel indisponible. Fonctionnement en mode dégradé.
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectWebSocket}
                  className="ml-2"
                >
                  Reconnecter
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun événement à afficher</p>
                </CardContent>
              </Card>
            ) : (
              filteredEvents.map(event => {
                const TypeIcon = getTypeIcon(event.type);
                return (
                  <Card key={event.id} className={`${event.handled ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority)} mt-2`} />
                          <TypeIcon className="h-5 w-5 mt-1 text-gray-500" />
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {event.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{event.timestamp.toLocaleTimeString()}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {event.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {!event.handled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markEventAsHandled(event.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtres d'événements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Types d'événements</label>
                <div className="grid grid-cols-3 gap-2">
                  {['order', 'reservation', 'payment', 'customer', 'system', 'alert'].map(type => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              types: [...prev.types, type]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              types: prev.types.filter(t => t !== type)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priorités</label>
                <div className="grid grid-cols-2 gap-2">
                  {['low', 'medium', 'high', 'critical'].map(priority => (
                    <label key={priority} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              priorities: [...prev.priorities, priority]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              priorities: prev.priorities.filter(p => p !== priority)
                            }));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Période</label>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="15m">15 dernières minutes</option>
                  <option value="1h">1 dernière heure</option>
                  <option value="6h">6 dernières heures</option>
                  <option value="24h">24 dernières heures</option>
                  <option value="all">Tous</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres temps réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications sonores</p>
                  <p className="text-sm text-gray-600">Son pour les alertes importantes</p>
                </div>
                <Button
                  variant={soundEnabled ? "default" : "outline"}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? 'Activé' : 'Désactivé'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Défilement automatique</p>
                  <p className="text-sm text-gray-600">Affichage automatique des nouveaux événements</p>
                </div>
                <Button
                  variant={autoScroll ? "default" : "outline"}
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  {autoScroll ? 'Activé' : 'Désactivé'}
                </Button>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Statut de connexion</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>État:</span>
                    <span className={connectionStatus.connected ? 'text-green-600' : 'text-red-600'}>
                      {connectionStatus.connected ? 'Connecté' : 'Déconnecté'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dernier heartbeat:</span>
                    <span>
                      {connectionStatus.lastHeartbeat
                        ? connectionStatus.lastHeartbeat.toLocaleTimeString()
                        : 'Jamais'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tentatives de reconnexion:</span>
                    <span>{connectionStatus.reconnectAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latence:</span>
                    <span>{connectionStatus.latency}ms</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
