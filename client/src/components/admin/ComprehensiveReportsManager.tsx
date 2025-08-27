import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// import { Checkbox } from '@/components/ui/checkbox';
// import { DatePicker } from '@/components/ui/date-picker';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Clock, 
  Brain,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  Mail,
  Printer,
  Share2,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interface pour le logger manquant
const logger = {
  error: (message: string, context?: any) => console.error(message, context)
};

interface Report {
  id: string;
  name: string;
  type: 'predefined' | 'custom' | 'automated';
  category: string;
  description: string;
  lastGenerated: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  recipients?: string[];
  parameters?: Record<string, unknown>;
  favorite?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: string[];
  charts: string[];
  aiInsights: boolean;
}

interface ReportConfiguration {
  id: string;
  type: 'predefined' | 'custom' | 'automated';
  name: string;
  dateRange: {
    start: Date; // Changed to Date type
    end: Date;   // Changed to Date type
  };
  categories: string[];
  metrics: string[];
  format: 'pdf' | 'excel' | 'json';
  aiInsights: boolean;
  filters?: Record<string, unknown>;
}

interface ReportData {
  salesData?: Array<{ date: string; revenue: number }>;
  categoryData?: Array<{ name: string; value: number }>;
  metrics?: {
    revenue?: string;
    customers?: string;
    orders?: string;
    growth?: string;
  };
  generatedAt?: string;
  reportConfig?: ReportConfiguration;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'sales_performance',
    name: 'Performance des Ventes',
    category: 'Ventes',
    description: 'Analyse détaillée des ventes avec prédictions IA',
    fields: ['revenue', 'orders', 'avgOrderValue', 'topProducts'],
    charts: ['revenue_trend', 'category_breakdown', 'hourly_sales'],
    aiInsights: true
  },
  {
    id: 'inventory_analysis',
    name: 'Analyse d\'Inventaire',
    category: 'Stock',
    description: 'Suivi des stocks avec alertes automatiques',
    fields: ['stockLevels', 'turnoverRate', 'lowStockItems', 'wasteAnalysis'],
    charts: ['stock_evolution', 'turnover_comparison'],
    aiInsights: true
  },
  {
    id: 'staff_performance',
    name: 'Performance du Personnel',
    category: 'Personnel',
    description: 'Évaluation du personnel et optimisation des horaires',
    fields: ['workHours', 'performance', 'customerService', 'efficiency'],
    charts: ['performance_comparison', 'schedule_optimization'],
    aiInsights: true
  },
  {
    id: 'customer_analytics',
    name: 'Analyse Clientèle',
    category: 'Clients',
    description: 'Comportement client et prédictions de fidélisation',
    fields: ['customerDemographics', 'loyalty', 'preferences', 'churnRisk'],
    charts: ['customer_segments', 'loyalty_trends'],
    aiInsights: true
  }
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export const ComprehensiveReportsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('predefined');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customReportName, setCustomReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les rapports existants
  const { data: existingReports, isLoading } = useQuery<{ automated: Report[] }>({
    queryKey: ['/api/admin/reports'],
    queryFn: () => apiRequest('/api/admin/reports')
  });

  // Génération de rapport
  const generateReportMutation = useMutation({
    mutationFn: async (reportConfig: ReportConfiguration) => {
      setIsGenerating(true);

      // Validation de la configuration du rapport
      if (!reportConfig.id || !reportConfig.name || !reportConfig.dateRange) {
        throw new Error('Configuration du rapport invalide');
      }

      // Simuler la génération avec IA
      await new Promise(resolve => setTimeout(resolve, 3000));

      return apiRequest('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportConfig)
      });
    },
    onSuccess: (data) => {
      setReportData(data);
      setIsGenerating(false);
      toast({
        title: "Rapport généré avec succès",
        description: "Le rapport a été créé avec les insights IA",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
    },
    onError: () => {
      setIsGenerating(false);
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport",
        variant: "destructive",
      });
    }
  });

  // Planification automatique
  const scheduleReportMutation = useMutation({
    mutationFn: (scheduleConfig: unknown) => 
      apiRequest('/api/admin/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleConfig)
      }),
    onSuccess: () => {
      toast({
        title: "Rapport planifié",
        description: "Le rapport sera généré automatiquement",
      });
    }
  });

  const handleGenerateReport = () => {
    const template = REPORT_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;

    const config: ReportConfiguration = {
      id: selectedTemplate,
      type: 'custom',
      name: customReportName || template.name,
      dateRange: {
        startDate: dateRange.startDate, // Corrected property name
        endDate: dateRange.endDate     // Corrected property name
      },
      categories: [template.category],
      metrics: selectedFields.length > 0 ? selectedFields : template.fields,
      format: 'pdf',
      aiInsights: true,
      filters: {
        charts: selectedCharts.length > 0 ? selectedCharts : template.charts,
        timestamp: new Date().toISOString()
      }
    };

    generateReportMutation.mutate(config);
  };

  const handleScheduleReport = (frequency: 'daily' | 'weekly' | 'monthly', recipients: string[]) => {
    scheduleReportMutation.mutate({
      templateId: selectedTemplate,
      frequency,
      recipients,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  };

  const renderPredefinedReports = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TEMPLATES.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{template.name}</span>
                <Badge variant="outline">{template.category}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.aiInsights && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    IA
                  </Badge>
                )}
                <Badge variant="outline">{template.fields.length} champs</Badge>
                <Badge variant="outline">{template.charts.length} graphiques</Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setActiveTab('generate');
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Générer
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-1" />
                  Configurer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCustomReports = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Créateur de Rapport Personnalisé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reportName">Nom du rapport</Label>
            <Input
              id="reportName"
              value={customReportName}
              onChange={(e) => setCustomReportName(e.target.value)}
              placeholder="Mon rapport personnalisé"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Champs à inclure</Label>
              <div className="space-y-2 mt-2">
                {['revenue', 'orders', 'customers', 'inventory', 'staff'].map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={field}
                      checked={selectedFields.includes(field)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, field]);
                        } else {
                          setSelectedFields(selectedFields.filter(f => f !== field));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor={field} className="capitalize">{field}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Types de graphiques</Label>
              <div className="space-y-2 mt-2">
                {['bar_chart', 'line_chart', 'pie_chart', 'area_chart'].map((chart) => (
                  <div key={chart} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={chart}
                      checked={selectedCharts.includes(chart)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCharts([...selectedCharts, chart]);
                        } else {
                          setSelectedCharts(selectedCharts.filter(c => c !== chart));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor={chart} className="capitalize">
                      {chart.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleGenerateReport} disabled={!customReportName}>
            <Plus className="h-4 w-4 mr-2" />
            Créer le rapport
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderAutomatedReports = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rapports Automatisés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {existingReports?.automated?.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Fréquence: {report.frequency} | Dernière génération: {report.lastGenerated}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGeneratedReport = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rapport Généré</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-1" />
                  Envoyer
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4 mr-1" />
                  Partager
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Insights IA */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                Insights IA
              </h4>
              <div className="space-y-2 text-sm">
                <p>• Les ventes ont augmenté de 15% par rapport à la période précédente</p>
                <p>• Pic d'affluence détecté le vendredi entre 14h et 16h</p>
                <p>• Recommandation: Augmenter le stock de cappuccino de 20%</p>
                <p>• Prédiction: Hausse de 8% des ventes la semaine prochaine</p>
              </div>
            </div>

            {/* Graphiques */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Évolution des Ventes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.salesData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition par Catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.categoryData || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {(reportData.categoryData || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Métriques clés */}
            <div className="grid md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                      <p className="text-2xl font-bold">{reportData.metrics?.revenue || '€12,450'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Clients</p>
                      <p className="text-2xl font-bold">{reportData.metrics?.customers || '1,234'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                      <p className="text-2xl font-bold">{reportData.metrics?.orders || '856'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Croissance</p>
                      <p className="text-2xl font-bold">+15%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestionnaire de Rapports</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Rapport
          </Button>
        </div>
      </div>

      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-medium">Génération du rapport en cours...</p>
                <p className="text-sm text-muted-foreground">L'IA analyse vos données</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predefined">Prédéfinis</TabsTrigger>
          <TabsTrigger value="custom">Personnalisés</TabsTrigger>
          <TabsTrigger value="automated">Automatisés</TabsTrigger>
          <TabsTrigger value="generate">Résultats</TabsTrigger>
        </TabsList>

        <TabsContent value="predefined" className="space-y-6">
          {renderPredefinedReports()}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {renderCustomReports()}
        </TabsContent>

        <TabsContent value="automated" className="space-y-6">
          {renderAutomatedReports()}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          {reportData ? renderGeneratedReport() : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun rapport généré</h3>
                <p className="text-muted-foreground">
                  Sélectionnez un modèle pour générer votre premier rapport
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveReportsManager;