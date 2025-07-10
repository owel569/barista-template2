import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Calendar, TrendingUp, Users, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ReportsSystemProps {
  userRole: 'directeur' | 'employe';
}

interface Report {
  id: number;
  name: string;
  type: 'sales' | 'customers' | 'products' | 'financial';
  period: string;
  createdAt: string;
  status: 'completed' | 'generating' | 'failed';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ReportsSystem({ userRole }: ReportsSystemProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [salesData, setSalesData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReports();
    loadAnalyticsData();
  }, []);

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [salesRes, customerRes, productRes] = await Promise.all([
        fetch('/api/admin/reports/sales-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/reports/customer-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/reports/product-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (salesRes.ok) {
        const sales = await salesRes.json();
        setSalesData(sales);
      }
      
      if (customerRes.ok) {
        const customers = await customerRes.json();
        setCustomerData(customers);
      }
      
      if (productRes.ok) {
        const products = await productRes.json();
        setProductData(products);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données analytiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (type: string, period: string) => {
    if (userRole !== 'directeur') return;
    
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, period })
      });
      
      if (response.ok) {
        await loadReports();
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async (reportId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/reports/${reportId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'sales': return <TrendingUp className="h-4 w-4" />;
      case 'customers': return <Users className="h-4 w-4" />;
      case 'products': return <ShoppingCart className="h-4 w-4" />;
      case 'financial': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'sales': return 'Ventes';
      case 'customers': return 'Clients';
      case 'products': return 'Produits';
      case 'financial': return 'Financier';
      default: return 'Rapport';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'generating': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Système de Rapports</h2>
          <p className="text-gray-600 dark:text-gray-300">Analyses et rapports détaillés de l'activité</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">Analyses en Temps Réel</TabsTrigger>
          <TabsTrigger value="reports">Rapports Générés</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Graphique des ventes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Évolution des Ventes (7 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Répartition des clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Répartition des Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={customerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top produits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Produits les Plus Vendus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={productData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Génération de rapports */}
          {userRole === 'directeur' && (
            <Card>
              <CardHeader>
                <CardTitle>Générer un Nouveau Rapport</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => generateReport('sales', 'monthly')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span>Rapport Ventes</span>
                  </Button>
                  
                  <Button
                    onClick={() => generateReport('customers', 'monthly')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span>Rapport Clients</span>
                  </Button>
                  
                  <Button
                    onClick={() => generateReport('products', 'monthly')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <ShoppingCart className="h-6 w-6 mb-2" />
                    <span>Rapport Produits</span>
                  </Button>
                  
                  <Button
                    onClick={() => generateReport('financial', 'monthly')}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    <span>Rapport Financier</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des rapports */}
          <Card>
            <CardHeader>
              <CardTitle>Rapports Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">Aucun rapport généré</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getReportTypeIcon(report.type)}
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                            <span>{getReportTypeName(report.type)}</span>
                            <span>•</span>
                            <span>{report.period}</span>
                            <span>•</span>
                            <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'completed' ? 'Terminé' : 
                           report.status === 'generating' ? 'Génération...' : 'Échoué'}
                        </Badge>
                        {report.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}