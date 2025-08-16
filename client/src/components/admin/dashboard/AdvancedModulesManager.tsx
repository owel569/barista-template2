/**
 * Gestionnaire des modules avancés - Logique métier professionnelle et sécurisée
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Settings,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText
} from 'lucide-react';

// Types sécurisés pour les données
interface ModuleMetrics {
  performance: number;
  usage: number;
  satisfaction: number;
  uptime?: number;
  errors?: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'error' | 'updating';
  category: 'ai' | 'mobile' | 'digital' | 'fintech' | 'sustainability' | 'iot' | 'marketing' | 'security' | 'multisite' | 'analytics' | 'tech';
  priority: 'high' | 'medium' | 'low';
  metrics: ModuleMetrics;
  data: Record<string, string>;
}

interface ModuleCardProps {
  module: Module;
  onToggle: (moduleId: string) => void;
  onConfigure: (moduleId: string) => void;
}

// Fonction de validation sécurisée
const isValidModule = (module: unknown): module is Module => {
  if (typeof module !== 'object' || module === null) return false;
  const obj = module as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.priority === 'string' &&
    typeof obj.metrics === 'object' &&
    typeof obj.data === 'object'
  );
};

// Composant pour une carte de module
const ModuleCard: React.FC<ModuleCardProps> = ({ module, onToggle, onConfigure }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'updating': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'updating': return <RefreshCw className="w-4 h-4 animate-spin" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {module.icon}
            <div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {module.category.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Badge className={getStatusColor(module.status)}>
            {getStatusIcon(module.status)}
            <span className="ml-1 capitalize">{module.status}</span>
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{module.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métriques de performance */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Performance</span>
            <div className="flex items-center gap-2">
              <Progress value={module.metrics.performance} className="h-2 flex-1" />
              <span className="font-medium">{module.metrics.performance}%</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Usage</span>
            <div className="flex items-center gap-2">
              <Progress value={module.metrics.usage} className="h-2 flex-1" />
              <span className="font-medium">{module.metrics.usage}%</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Satisfaction</span>
            <div className="flex items-center gap-2">
              <Progress value={module.metrics.satisfaction} className="h-2 flex-1" />
              <span className="font-medium">{module.metrics.satisfaction}%</span>
            </div>
          </div>
        </div>

        {/* Données du module */}
        <div className="space-y-2">
          {Object.entries(module.data).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{key}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onToggle(module.id)}
            variant={module.status === 'active' ? 'destructive' : 'default'}
            size="sm"
            className="flex-1"
          >
            {module.status === 'active' ? 'Désactiver' : 'Activer'}
          </Button>
          <Button
            onClick={() => onConfigure(module.id)}
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Données par défaut sécurisées
const getDefaultModules = (): Module[] => [
  {
    id: 'ai-chatbot',
    title: 'Chatbot IA',
    description: 'Assistant virtuel pour réservations et commandes',
    icon: <Brain className="w-6 h-6 text-purple-600" />,
    status: 'active',
    category: 'ai',
    priority: 'high',
    metrics: { performance: 92, usage: 78, satisfaction: 85 },
    data: { 'Utilisateurs actifs': '156', 'Conversations/jour': '89', 'Taux de satisfaction': '92%' }
  },
  {
    id: 'predictive-analytics',
    title: 'Analytics Prédictives',
    description: 'Prédictions IA pour stock et demande',
    icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
    status: 'active',
    category: 'ai',
    priority: 'high',
    metrics: { performance: 95, usage: 85, satisfaction: 88 },
    data: { 'Précision': '94%', 'Prédictions/jour': '245', 'Économies générées': '€2,450' }
  },
  {
    id: 'real-time-kpi',
    title: 'KPI en Temps Réel',
    description: 'Revenus, commandes, satisfaction client',
    icon: <BarChart3 className="w-6 h-6 text-green-600" />,
    status: 'active',
    category: 'analytics',
    priority: 'high',
    metrics: { performance: 91, usage: 89, satisfaction: 87 },
    data: { 'Mise à jour': 'Temps réel', 'Métriques': '15', 'Alertes actives': '3' }
  },
  {
    id: 'automated-reports',
    title: 'Rapports Automatiques',
    description: 'Génération et envoi automatique',
    icon: <FileText className="w-6 h-6 text-orange-600" />,
    status: 'active',
    category: 'analytics',
    priority: 'medium',
    metrics: { performance: 94, usage: 82, satisfaction: 90 },
    data: { 'Rapports/jour': '12', 'Destinataires': '8', 'Formats': 'PDF, Excel' }
  }
];

// Fonction sécurisée pour récupérer les modules
const fetchModulesStatus = async (): Promise<Module[]> => {
  try {
    const token = localStorage.getItem('barista_token');

    if (!token) {
      console.warn('Token d\'authentification manquant');
      return getDefaultModules();
    }

    const response = await fetch('/api/advanced-features/modules-status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();

      // Validation de la réponse
      if (result.success && Array.isArray(result.data)) {
        const validModules = result.data.filter(isValidModule);
        return validModules.length > 0 ? validModules : getDefaultModules();
      } else {
        console.warn('Réponse API invalide:', result);
        return getDefaultModules();
      }
    } else {
      console.error(`Erreur API ${response.status}:`, await response.text());
      return getDefaultModules();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des modules:', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    });
    return getDefaultModules();
  }
};

export default function AdvancedModulesManager(): JSX.Element {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query pour récupérer les modules
  const { data: modulesData, isLoading, refetch } = useQuery({
    queryKey: ['modules-status'],
    queryFn: fetchModulesStatus,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
    retry: 3
  });

  // Effet pour gérer les changements de données
  useEffect(() => {
    if (modulesData) {
      setModules(modulesData);
      setLoading(false);
      setError(null);
    }
  }, [modulesData]);

  // Mutation pour activer/désactiver un module
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ moduleId, status }: { moduleId: string; status: string }) => {
      const token = localStorage.getItem('barista_token');
      const response = await fetch(`/api/advanced-features/modules/${moduleId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules-status'] });
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la modification du module:', error);
      setError(error.message);
    }
  });

  const handleToggleModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      const newStatus = module.status === 'active' ? 'inactive' : 'active';
      toggleModuleMutation.mutate({ moduleId, status: newStatus });
    }
  };

  const handleConfigureModule = (moduleId: string) => {
    // Logique de configuration du module
    console.log('Configuration du module:', moduleId);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Chargement des modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des modules: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de Modules Avancés</h1>
          <p className="text-muted-foreground">
            Gérez et surveillez les modules avancés de votre système
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tous les modules</TabsTrigger>
          <TabsTrigger value="ai">Intelligence Artificielle</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="active">Actifs</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onToggle={handleToggleModule}
                onConfigure={handleConfigureModule}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules
              .filter(module => module.category === 'ai')
              .map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onToggle={handleToggleModule}
                  onConfigure={handleConfigureModule}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules
              .filter(module => module.category === 'analytics')
              .map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onToggle={handleToggleModule}
                  onConfigure={handleConfigureModule}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules
              .filter(module => module.status === 'active')
              .map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onToggle={handleToggleModule}
                  onConfigure={handleConfigureModule}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}