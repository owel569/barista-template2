/**
 * Gestionnaire complet des rapports selon spécifications
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
  Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line 
} from 'recharts';
import { ApiClient } from '@/lib/auth-utils';

const ComprehensiveReportsManager: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [period, setPeriod] = useState('month');
  const [format, setFormat] = useState('pdf');

  // Données des rapports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['comprehensive-reports', selectedReport, period],
    queryFn: async () => {
      const [sales, customers, products] = await Promise.all([
        ApiClient.get('/api/admin/reports/sales'),
        ApiClient.get('/api/admin/reports/customers'),
        ApiClient.get('/api/admin/reports/products')
      ]);

      return {
        sales: sales || [],
        customers: customers || [],
        products: products || []
      };
    }
  });

  const reports = [
    {
      id: 'sales',
      title: 'Rapport des Ventes',
      description: 'Analyse complète des ventes par période',
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      frequency: 'daily',
      lastGenerated: '2025-07-16 09:30'
    },
    {
      id: 'customers',
      title: 'Rapport Clients',
      description: 'Analyse comportementale et segmentation',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      frequency: 'weekly',
      lastGenerated: '2025-07-15 18:00'
    },
    {
      id: 'products',
      title: 'Rapport Produits',
      description: 'Performance des articles du menu',
      icon: <Package className="w-5 h-5 text-orange-600" />,
      frequency: 'monthly',
      lastGenerated: '2025-07-14 14:30'
    },
    {
      id: 'staff',
      title: 'Rapport Personnel',
      description: 'Performance et planification équipe',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      frequency: 'monthly',
      lastGenerated: '2025-07-13 16:45'
    },
    {
      id: 'inventory',
      title: 'Rapport Inventaire',
      description: 'Gestion des stocks et rotation',
      icon: <Package className="w-5 h-5 text-red-600" />,
      frequency: 'weekly',
      lastGenerated: '2025-07-16 07:00'
    },
    {
      id: 'financial',
      title: 'Rapport Financier',
      description: 'Analyse comptable et rentabilité',
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      frequency: 'monthly',
      lastGenerated: '2025-07-15 10:30'
    }
  ];

  const generateReport = async (reportType: string) => {
    // Simulation génération de rapport
    console.log(`Génération du rapport ${reportType} en format ${format}`);
    
    const reportData = {
      type: reportType,
      period,
      format,
      generatedAt: new Date().toISOString(),
      data: reportsData?.[reportType as keyof typeof reportsData] || []
    };

    // Simuler le téléchargement
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-${reportType}-${period}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rapports Complets</h1>
          <p className="text-muted-foreground mt-2">
            Système de rapports personnalisés et automatisés
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {report.icon}
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{report.frequency}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dernière génération:</span>
                  <span>{report.lastGenerated}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateReport(report.id)}
                    className="flex-1"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Générer
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Aperçu du rapport sélectionné */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Aperçu: {reports.find(r => r.id === selectedReport)?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedReport} onValueChange={setSelectedReport}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sales">Ventes</TabsTrigger>
              <TabsTrigger value="customers">Clients</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sales" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData?.sales || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totalSales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="customers" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportsData?.customers || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalSpent" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportsData?.products || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Planification automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Planification Automatique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Rapports Quotidiens</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Ventes du jour</span>
                  <Badge variant="outline">09:00</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Inventaire</span>
                  <Badge variant="outline">07:00</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Rapports Hebdomadaires</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Performance équipe</span>
                  <Badge variant="outline">Lundi 08:00</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">Analyse clients</span>
                  <Badge variant="outline">Dimanche 18:00</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveReportsManager;