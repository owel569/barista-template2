import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Download, Calendar, Users, DollarSign, TrendingUp, FileText, Filter,
  Loader2, ChevronDown, Plus, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
// import { createIconWrapper } from '@/types/icons';

interface Report {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: 'sales' | 'customers' | 'inventory' | 'financial' | 'performance';
  format: 'PDF' | 'Excel' | 'CSV';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastGenerated?: string;
}

interface ReportData {
  totalSales: number;
  totalCustomers: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; sales: number }>;
  salesTrend: Array<{ date: string; amount: number }>;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRun: string;
  status: 'active' | 'paused';
}

export default function ReportsSystem() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    reportType: 'sales' as Report['type']
  });

  useEffect(() => {
    fetchReportData();
    fetchScheduledReports();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/reports/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        throw new Error('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de rapport:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des rapports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reports/scheduled', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledReports(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports programmés:', error);
    }
  };

  const reports: Report[] = [
    {
      id: 'sales-monthly',
      name: 'Rapport de Ventes Mensuel',
      type: 'sales',
      description: 'Analyse détaillée des ventes du mois avec tendances et comparaisons',
      lastGenerated: new Date().toISOString(),
      format: 'PDF',
      icon: BarChart3
    },
    {
      id: 'customers-analysis',
      name: 'Analyse Clients',
      type: 'customers',
      description: 'Profil des clients, fidélité et comportements d\'achat',
      lastGenerated: new Date(Date.now() - 86400000).toISOString(),
      format: 'Excel',
      icon: Users
    },
    {
      id: 'inventory-status',
      name: 'État des Stocks',
      type: 'inventory',
      description: 'Niveau des stocks, alertes et prévisions de réapprovisionnement',
      lastGenerated: new Date().toISOString(),
      format: 'CSV',
      icon: FileText
    },
    {
      id: 'financial-summary',
      name: 'Résumé Financier',
      type: 'financial',
      description: 'Bilan financier avec revenus, dépenses et rentabilité',
      lastGenerated: new Date(Date.now() - 2 * 86400000).toISOString(),
      format: 'PDF',
      icon: DollarSign
    },
    {
      id: 'performance-dashboard',
      name: 'Tableau de Bord Performance',
      type: 'performance',
      description: 'KPIs principaux et indicateurs de performance',
      lastGenerated: new Date().toISOString(),
      format: 'PDF',
      icon: TrendingUp
    }
  ];

  const generateReport = async (reportId: string) => {
    setGeneratingReport(reportId);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/reports/generate/${reportId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const report = reports.find(r => r.id === reportId);
        const extension = report?.format.toLowerCase() || 'pdf';
        a.download = `${reportId}_${new Date().toISOString().split('T')[0]}.${extension}`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Succès",
          description: "Rapport généré avec succès",
          variant: "default"
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast({
        title: "Erreur",
        description: "Échec de la génération du rapport",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const createCustomReport = async () => {
    if (selectedMetrics.length === 0) {
      toast({
        title: "Avertissement",
        description: "Veuillez sélectionner au moins une métrique",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reports/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: selectedMetrics,
          format: selectedFormat
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom_report_${new Date().toISOString().split('T')[0]}.${selectedFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Succès",
          description: "Rapport personnalisé généré avec succès",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création du rapport personnalisé:', error);
      toast({
        title: "Erreur",
        description: "Échec de la génération du rapport personnalisé",
        variant: "destructive"
      });
    }
  };

  const scheduleReport = async () => {
    if (!newSchedule.name) {
      toast({
        title: "Avertissement",
        description: "Veuillez donner un nom à votre rapport programmé",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reports/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSchedule)
      });

      if (response.ok) {
        const data = await response.json();
        setScheduledReports(prev => [...prev, data]);
        setNewSchedule({
          name: '',
          frequency: 'weekly',
          reportType: 'sales'
        });

        toast({
          title: "Succès",
          description: "Rapport programmé avec succès",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la programmation du rapport:', error);
      toast({
        title: "Erreur",
        description: "Échec de la programmation du rapport",
        variant: "destructive"
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'customers':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'inventory':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'financial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'performance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'sales': return 'Ventes';
      case 'customers': return 'Clients';
      case 'inventory': return 'Inventaire';
      case 'financial': return 'Financier';
      case 'performance': return 'Performance';
      default: return 'Général';
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric) 
        : [...prev, metric]
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Système de Rapports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Génération et analyse de rapports détaillés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Période
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ventes Totales
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.totalSales.toFixed(2)}€
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.totalCustomers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Panier Moyen
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reportData.averageOrderValue.toFixed(2)}€
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Rapports Générés
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reports.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Rapports Disponibles</TabsTrigger>
          <TabsTrigger value="custom">Rapports Personnalisés</TabsTrigger>
          <TabsTrigger value="scheduled">Rapports Programmés</TabsTrigger>
          <TabsTrigger value="analytics">Analyses Avancées</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const IconComponent = report.icon;

              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {report.name}
                          </h3>
                          <Badge className={getTypeColor(report.type)}>
                            {getTypeText(report.type)}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline">{report.format}</Badge>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Dernière génération: {report.lastGenerated ? new Date(report.lastGenerated).toLocaleDateString('fr-FR') : 'Jamais'}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateReport(report.id)}
                        disabled={generatingReport === report.id}
                      >
                        {generatingReport === report.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Générer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Créer un Rapport Personnalisé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Métriques Disponibles</h4>
                    <div className="space-y-2">
                      {['Ventes par période', 'Top produits', 'Analyse clients', 'Rentabilité', 'Stocks', 'Réservations'].map((metric) => (
                        <label key={metric} className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            className="rounded" 
                            checked={selectedMetrics.includes(metric)}
                            onChange={() => toggleMetric(metric)}
                          />
                          <span className="text-sm">{metric}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Options de Format</h4>
                    <div className="space-y-2">
                      {['PDF', 'Excel', 'CSV'].map((format) => (
                        <label key={format} className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name="format" 
                            className="rounded" 
                            checked={selectedFormat === format}
                            onChange={() => setSelectedFormat(format as 'PDF' | 'Excel' | 'CSV')}
                          />
                          <span className="text-sm">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={createCustomReport}
                    disabled={selectedMetrics.length === 0}
                  >
                    Créer le Rapport
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rapports Programmés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scheduledReports.map((scheduled) => (
                    <div key={scheduled.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{scheduled.name}</h4>
                        <Badge 
                          className={scheduled.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'}
                        >
                          {scheduled.status === 'active' ? 'Actif' : 'En pause'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {scheduled.frequency === 'daily' && 'Quotidien'}
                        {scheduled.frequency === 'weekly' && 'Hebdomadaire'}
                        {scheduled.frequency === 'monthly' && 'Mensuel'}
                        {scheduled.frequency === 'quarterly' && 'Trimestriel'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Prochaine exécution: {new Date(scheduled.nextRun).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nouveau Rapport Programmé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom du rapport</label>
                    <input 
                      type="text" 
                      className="w-full border rounded-lg px-3 py-2" 
                      placeholder="Mon rapport personnalisé"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type de rapport</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2"
                      value={newSchedule.reportType}
                      onChange={(e) => setNewSchedule({...newSchedule, reportType: e.target.value as Report['type']})}
                    >
                      <option value="sales">Ventes</option>
                      <option value="customers">Clients</option>
                      <option value="inventory">Inventaire</option>
                      <option value="financial">Financier</option>
                      <option value="performance">Performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Fréquence</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2"
                      value={newSchedule.frequency}
                      onChange={(e) => setNewSchedule({...newSchedule, frequency: e.target.value as any})}
                    >
                      <option value="daily">Quotidien</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuel</option>
                      <option value="quarterly">Trimestriel</option>
                    </select>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={scheduleReport}
                    disabled={!newSchedule.name}
                  >
                    Programmer le Rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Produits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{product.sales}€</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">ventes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendance des Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.salesTrend.slice(0, 7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString('fr-FR')}</span>
                      <span className="font-semibold">{day.amount.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}