
import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Clock,
  Mail,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ApiClient } from '@/lib/auth-utils';
import { toast } from '@/hooks/use-toast';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'predefined' | 'custom' | 'automated';
  category: string;
  lastGenerated?: string;
  nextScheduled?: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  size?: string;
  status: 'ready' | 'generating' | 'scheduled' | 'error';
}

const ComprehensiveReportsManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  // Chargement des rapports disponibles
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['comprehensive-reports'],
    queryFn: async () => {
      const response = await ApiClient.get('/api/advanced/reports');
      return response.reports || [];
    }
  });

  // Mutation pour générer un rapport
  const generateReportMutation = useMutation({
    mutationFn: async ({ reportId, params }: { reportId: string; params?: any }) => {
      return await ApiClient.post(`/api/advanced/reports/${reportId}/generate`, params);
    },
    onSuccess: (data, variables) => {
      setGeneratingReports(prev => {
        const next = new Set(prev);
        next.delete(variables.reportId);
        return next;
      });
      
      // Téléchargement automatique si prêt
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename;
        link.click();
      }
      
      toast({
        title: "Rapport généré",
        description: "Le rapport a été généré avec succès",
      });
      refetch();
    },
    onError: (error, variables) => {
      setGeneratingReports(prev => {
        const next = new Set(prev);
        next.delete(variables.reportId);
        return next;
      });
      
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = (reportId: string) => {
    setGeneratingReports(prev => new Set(prev).add(reportId));
    generateReportMutation.mutate({ reportId });
  };

  // Rapports prédéfinis complets
  const predefinedReports: Report[] = [
    {
      id: 'sales-daily',
      name: 'Rapport Ventes Quotidien',
      description: 'Analyse détaillée des ventes du jour avec comparaisons',
      type: 'predefined',
      category: 'sales',
      format: 'pdf',
      status: 'ready'
    },
    {
      id: 'inventory-stock',
      name: 'État des Stocks',
      description: 'Inventaire complet avec alertes et recommandations',
      type: 'predefined',
      category: 'inventory',
      format: 'excel',
      status: 'ready'
    },
    {
      id: 'customer-analytics',
      name: 'Analytics Clientèle',
      description: 'Segmentation et comportement des clients',
      type: 'predefined',
      category: 'customers',
      format: 'pdf',
      status: 'ready'
    },
    {
      id: 'staff-performance',
      name: 'Performance Personnel',
      description: 'Évaluation des employés et productivité',
      type: 'predefined',
      category: 'staff',
      format: 'excel',
      status: 'ready'
    },
    {
      id: 'financial-summary',
      name: 'Résumé Financier',
      description: 'Bilan financier complet avec projections',
      type: 'predefined',
      category: 'finance',
      format: 'pdf',
      status: 'ready'
    },
    {
      id: 'ai-insights-report',
      name: 'Rapport Insights IA',
      description: 'Compilation des recommandations IA du mois',
      type: 'automated',
      category: 'ai',
      format: 'pdf',
      status: 'scheduled',
      nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const allReports = [...predefinedReports, ...(reports || [])];
  
  const filteredReports = allReports.filter(report => 
    selectedCategory === 'all' || report.category === selectedCategory
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'generating': return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'scheduled': return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'generating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestionnaire de Rapports Complet</h1>
          <p className="text-muted-foreground mt-2">
            Génération automatique et personnalisée de tous vos rapports d'analyse
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Planifier
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Envoi Auto
          </Button>
        </div>
      </div>

      {/* Statistiques des rapports */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rapports</p>
                <p className="text-2xl font-bold">{allReports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prêts</p>
                <p className="text-2xl font-bold text-green-600">
                  {allReports.filter(r => r.status === 'ready').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Programmés</p>
                <p className="text-2xl font-bold text-orange-600">
                  {allReports.filter(r => r.status === 'scheduled').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {generatingReports.size}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          size="sm"
        >
          Tous
        </Button>
        <Button 
          variant={selectedCategory === 'sales' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('sales')}
          size="sm"
        >
          Ventes
        </Button>
        <Button 
          variant={selectedCategory === 'inventory' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('inventory')}
          size="sm"
        >
          Inventaire
        </Button>
        <Button 
          variant={selectedCategory === 'customers' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('customers')}
          size="sm"
        >
          Clients
        </Button>
        <Button 
          variant={selectedCategory === 'staff' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('staff')}
          size="sm"
        >
          Personnel
        </Button>
        <Button 
          variant={selectedCategory === 'finance' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('finance')}
          size="sm"
        >
          Finance
        </Button>
        <Button 
          variant={selectedCategory === 'ai' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('ai')}
          size="sm"
        >
          IA
        </Button>
      </div>

      {/* Liste des rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{report.name}</CardTitle>
                <Badge className={getStatusColor(report.status)}>
                  {getStatusIcon(report.status)}
                  <span className="ml-1">
                    {report.status === 'ready' ? 'Prêt' :
                     report.status === 'generating' ? 'Génération' :
                     report.status === 'scheduled' ? 'Programmé' : 'Erreur'}
                  </span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{report.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium uppercase">{report.format}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {report.type === 'predefined' ? 'Prédéfini' :
                   report.type === 'custom' ? 'Personnalisé' : 'Automatique'}
                </span>
              </div>

              {report.lastGenerated && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dernière génération:</span>
                  <span className="font-medium">
                    {new Date(report.lastGenerated).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {report.nextScheduled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prochaine génération:</span>
                  <span className="font-medium">
                    {new Date(report.nextScheduled).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}

              {generatingReports.has(report.id) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Génération en cours...</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              )}

              <Button
                onClick={() => handleGenerateReport(report.id)}
                disabled={generatingReports.has(report.id) || report.status === 'generating'}
                className="w-full"
                size="sm"
              >
                {generatingReports.has(report.id) ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes système */}
      <Alert>
        <Activity className="w-4 h-4" />
        <AlertDescription>
          Système de rapports entièrement opérationnel. 
          Génération automatique activée pour {allReports.filter(r => r.type === 'automated').length} rapports.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ComprehensiveReportsManager;
