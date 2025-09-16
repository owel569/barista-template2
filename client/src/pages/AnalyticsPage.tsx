import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { useAuth } from '@/components/auth/AuthProvider';
import { DateRange } from 'react-day-picker';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface KPIData {
  revenue: {
    total: number;
    growth?: number;
    trend: 'up' | 'down' | 'stable';
  };
  customers: {
    total: number;
    growth?: number;
    new: number;
    returning: number;
  };
  averageOrder: {
    value: number;
    growth?: number;
    trend: 'up' | 'down' | 'stable';
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
  };
}

interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
    startDate: '',
    endDate: ''
  });

  // Fonction sécurisée pour récupérer les données
  const fetchKPIs = async (filterParams: AnalyticsFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('period', filterParams.period);

      if (filterParams.startDate) {
        params.append('startDate', filterParams.startDate);
      }
      if (filterParams.endDate) {
        params.append('endDate', filterParams.endDate);
      }

      const response = await fetch(`/api/analytics/kpis?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setKpis(data.data);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des données');
      }
    } catch (err) {
      console.error('Erreur récupération KPIs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour charger les données initiales
  useEffect(() => {
    const initialFilters: AnalyticsFilters = {
      period: 'month',
      startDate: dateRange?.from?.toISOString() || '',
      endDate: dateRange?.to?.toISOString() || ''
    };

    fetchKPIs(initialFilters);
  }, [dateRange]);

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    const currentFilters: AnalyticsFilters = {
      ...filters,
      startDate: dateRange?.from?.toISOString() || '',
      endDate: dateRange?.to?.toISOString() || ''
    };
    fetchKPIs(currentFilters);
  };

  // Fonction pour changer la période
  const handlePeriodChange = (period: AnalyticsFilters['period']) => {
    const newFilters = { ...filters, period };
    setFilters(newFilters);
    fetchKPIs(newFilters);
  };

  // Fonction sécurisée pour formater les pourcentages
  const formatGrowth = (growth?: number): string => {
    if (growth === undefined || growth === null) return '0.0';
    return growth.toFixed(1);
  };

  // Fonction pour exporter les données
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'excel');
      params.append('period', filters.period);

      if (dateRange?.from) {
        params.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('endDate', dateRange.to.toISOString());
      }

      const response = await fetch(`/api/analytics/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Erreur export:', err);
      setError('Erreur lors de l\'export des données');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analyses et Statistiques
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tableau de bord analytique en temps réel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DatePickerWithRange 
            value={dateRange}
            onChange={setDateRange}
            className="w-72"
          />
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="flex flex-wrap gap-2">
        {(['today', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
          <Button
            key={period}
            variant={filters.period === period ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange(period)}
          >
            {period === 'today' ? 'Aujourd\'hui' : 
             period === 'week' ? 'Semaine' :
             period === 'month' ? 'Mois' :
             period === 'quarter' ? 'Trimestre' : 'Année'}
          </Button>
        ))}
      </div>

      {/* Gestion des erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 font-medium">Erreur: {error}</p>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chiffre d'affaires */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chiffre d'affaires
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis?.revenue.total ? `${kpis.revenue.total.toLocaleString('fr-FR')} €` : '0 €'}
            </div>
            <div className="flex items-center text-sm">
              {(kpis?.revenue.growth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${(kpis?.revenue.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(kpis?.revenue.growth || 0) >= 0 ? '+' : ''}{formatGrowth(kpis?.revenue.growth)}% vs période précédente
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clients totaux
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis?.customers.total || 0}
            </div>
            <div className="flex items-center text-sm">
              {(kpis?.customers.growth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${(kpis?.customers.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(kpis?.customers.growth || 0) >= 0 ? '+' : ''}{formatGrowth(kpis?.customers.growth)}% vs période précédente
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Panier moyen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Panier moyen
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis?.averageOrder.value ? `${kpis.averageOrder.value.toLocaleString('fr-FR')} €` : '0 €'}
            </div>
            <div className="flex items-center text-sm">
              {(kpis?.averageOrder.growth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${(kpis?.averageOrder.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(kpis?.averageOrder.growth || 0) >= 0 ? '+' : ''}{formatGrowth(kpis?.averageOrder.growth)}% vs période précédente
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Commandes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Commandes totales
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis?.orders.total || 0}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="text-green-600">
                {kpis?.orders.completed || 0} complétées
              </Badge>
              {(kpis?.orders.cancelled || 0) > 0 && (
                <Badge variant="destructive">
                  {kpis.orders.cancelled} annulées
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* État de chargement */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Chargement des données...</span>
        </div>
      )}
    </div>
  );
}