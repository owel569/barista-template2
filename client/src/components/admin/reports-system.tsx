import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Download, Calendar, Users, DollarSign, TrendingUp, FileText, Filter
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'sales' | 'customers' | 'inventory' | 'financial';
  description: string;
  lastGenerated: string;
  format: 'PDF' | 'Excel' | 'CSV';
  icon: any;
}

interface ReportData {
  totalSales: number;
  totalCustomers: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; sales: number }>;
  salesTrend: Array<{ date: string; amount: number }>;
}

export default function ReportsSystem() : JSX.Element {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/reports/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de rapport:', error);
    } finally {
      setLoading(false);
    }
  };

  const reports: Report[] = [
    {
      id: 'sales-monthly',
      name: 'Rapport de Ventes Mensuel',
      type: 'sales',
      description: 'Analyse détaillée des ventes du mois avec tendances et comparaisons',
      lastGenerated: '2025-01-09',
      format: 'PDF',
      icon: BarChart3
    },
    {
      id: 'customers-analysis',
      name: 'Analyse Clients',
      type: 'customers',
      description: 'Profil des clients, fidélité et comportements d\'achat',
      lastGenerated: '2025-01-08',
      format: 'Excel',
      icon: Users
    },
    {
      id: 'inventory-status',
      name: 'État des Stocks',
      type: 'inventory',
      description: 'Niveau des stocks, alertes et prévisions de réapprovisionnement',
      lastGenerated: '2025-01-09',
      format: 'CSV',
      icon: FileText
    },
    {
      id: 'financial-summary',
      name: 'Résumé Financier',
      type: 'financial',
      description: 'Bilan financier avec revenus, dépenses et rentabilité',
      lastGenerated: '2025-01-07',
      format: 'PDF',
      icon: DollarSign
    },
    {
      id: 'performance-dashboard',
      name: 'Tableau de Bord Performance',
      type: 'sales',
      description: 'KPIs principaux et indicateurs de performance',
      lastGenerated: '2025-01-09',
      format: 'PDF',
      icon: TrendingUp
    },
    {
      id: 'customer-satisfaction',
      name: 'Satisfaction Client',
      type: 'customers',
      description: 'Enquêtes, avis et niveau de satisfaction des clients',
      lastGenerated: '2025-01-06',
      format: 'Excel',
      icon: Users
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
        a.download = `${reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
    } finally {
      setGeneratingReport(null);
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
      default: return 'Général';
    }
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
                        Dernière génération: {new Date(report.lastGenerated).toLocaleDateString('fr-FR')}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generateReport(report.id)}
                        disabled={generatingReport === report.id}
                      >
                        {generatingReport === report.id ? (
                          <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
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
                          <input type="checkbox" className="rounded" />
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
                          <input type="radio" name="format" className="rounded" />
                          <span className="text-sm">{format}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full">
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
                  {[
                    { name: 'Rapport Hebdomadaire', frequency: 'Chaque lundi', nextRun: '2025-01-13' },
                    { name: 'Bilan Mensuel', frequency: 'Le 1er de chaque mois', nextRun: '2025-02-01' },
                    { name: 'Analyse Trimestrielle', frequency: 'Chaque trimestre', nextRun: '2025-04-01' }
                  ].map((scheduled, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{scheduled.name}</h4>
                        <Badge className="bg-blue-100 text-blue-800">Actif</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {scheduled.frequency}
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
                    <input type="text" className="w-full border rounded-lg px-3 py-2" placeholder="Mon rapport personnalisé" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Fréquence</label>
                    <select className="w-full border rounded-lg px-3 py-2">
                      <option>Quotidien</option>
                      <option>Hebdomadaire</option>
                      <option>Mensuel</option>
                      <option>Trimestriel</option>
                    </select>
                  </div>
                  
                  <Button className="w-full">
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
                  )) || []}
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
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}