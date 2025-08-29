import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Legend
} from 'recharts';
import { 
  Download,
  Calendar,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AnalyticsViewProps, TimePeriod } from '../types/schedule.types';
import { formatDuration, formatCurrency, DEPARTMENTS, POSITIONS } from '../utils/schedule.utils';
import { MetricCard } from '@/components/admin/analytics/MetricCard';


const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  reports,
  period,
  onPeriodChange,
  onExportData
}) => {
  // Données pour les graphiques
  const departmentData = useMemo(() => {
    return stats.departmentStats.map(dept => ({
      name: dept.department,
      heures: dept.scheduledHours,
      cout: dept.totalCost,
      employes: dept.employeeCount,
      tauxHoraire: dept.averageHourlyRate
    }));
  }, [stats.departmentStats]);

  const costAnalysisData = useMemo(() => {
    return [
      {
        name: 'Heures normales',
        heures: stats.costAnalysis.regularHours,
        cout: stats.costAnalysis.regularCost,
        type: 'normal'
      },
      {
        name: 'Heures supplémentaires',
        heures: stats.costAnalysis.overtimeHours,
        cout: stats.costAnalysis.overtimeCost,
        type: 'overtime'
      }
    ];
  }, [stats.costAnalysis]);

  const employeePerformanceData = useMemo(() => {
    if (reports.length === 0) return [];

    const currentReport = reports[0];
    if (!currentReport) return [];

    return currentReport.employeeBreakdown.map(emp => ({
      name: emp.employeeName,
      heures: emp.totalHours,
      salaire: emp.totalPay,
      ponctualite: emp.punctualityScore,
      shifts: emp.shiftsWorked
    }));
  }, [reports]);

  const trendData = useMemo(() => {
    // Simulation de données de tendance - à remplacer par de vraies données
    const currentDate = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        heures: Math.floor(Math.random() * 50) + 30,
        cout: Math.floor(Math.random() * 2000) + 1000,
        employes: Math.floor(Math.random() * 10) + 5
      });
    }

    return data;
  }, []);

  // Couleurs pour les graphiques
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // Métriques principales
  const mainMetrics = useMemo(() => {
    const avgHoursPerEmployee = stats.averageHoursPerEmployee;
    const overtimeRate = stats.scheduledHours === 0 ? 0 : stats.overtimeHours / stats.scheduledHours * 100;
    const costPerHour = stats.scheduledHours === 0 ? 0 : stats.totalPayroll / stats.scheduledHours;

    return {
      avgHoursPerEmployee,
      overtimeRate,
      costPerHour,
      efficiency: 100 - overtimeRate, // Efficacité basée sur le taux d'heures supplémentaires
      utilization: (stats.scheduledHours / (stats.activeEmployees * 40)) * 100 // Utilisation basée sur 40h/semaine
    };
  }, [stats]);

  // Alertes et recommandations
  const alerts = useMemo(() => {
    const alerts = [];

    if (mainMetrics.overtimeRate > 20) {
      alerts.push({
        type: 'warning',
        message: `Taux d'heures supplémentaires élevé (${mainMetrics.overtimeRate.toFixed(1)})}%)`,
        suggestion: 'Considérez recruter plus d\'employés ou réorganiser les shifts'
      });
    }

    if (mainMetrics.costPerHour > 25) {
      alerts.push({
        type: 'warning',
        message: `Coût par heure élevé (${formatCurrency(mainMetrics.costPerHour)})})`,
        suggestion: 'Optimisez la répartition des postes et les taux horaires'
      });
    }

    if (mainMetrics.utilization < 70) {
      alerts.push({
        type: 'info',
        message: `Sous-utilisation des employés (${mainMetrics.utilization.toFixed(1)})}%)`,
        suggestion: 'Réduisez les heures programmées ou réaffectez les employés'
      });
    }

    return alerts;
  }, [mainMetrics]);

  // Composant de métrique - Ceci est maintenant remplacé par le composant MetricCard unifié importé

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Analyses et statistiques</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={period} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={onExportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Heures programmées"
          value={formatDuration(stats.scheduledHours)}
          icon={Clock}
          color="#3B82F6"
        />
        <MetricCard
          title="Masse salariale"
          value={formatCurrency(stats.totalPayroll)}
          icon={DollarSign}
          color="#10B981"
        />
        <MetricCard
          title="Employés actifs"
          value={`${stats.activeEmployees}/${stats.totalEmployees}`}
          icon={Users}
          color="#8B5CF6"
        />
        <MetricCard
          title="Taux d'efficacité"
          value={`${mainMetrics.efficiency.toFixed(1)}%`}
          icon={CheckCircle}
          color="#F59E0B"
        />
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Alertes et recommandations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-blue-50 dark:bg-blue-950'
                }`}>
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                      alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {alert.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par département */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par département</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'heures' ? formatDuration(Number(value)) : 
                    name === 'cout' ? formatCurrency(Number(value)) : value,
                    name === 'heures' ? 'Heures' :
                    name === 'cout' ? 'Coût' :
                    name === 'employes' ? 'Employés' : name
                  ]}
                />
                <Bar dataKey="heures" fill="#3B82F6" />
                <Bar dataKey="employes" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Analyse des coûts */}
        <Card>
          <CardHeader>
            <CardTitle>Analyse des coûts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costAnalysisData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cout"
                >
                  {costAnalysisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendance des heures */}
        <Card>
          <CardHeader>
            <CardTitle>Tendance des heures programmées</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'heures' ? formatDuration(Number(value)) : 
                    name === 'cout' ? formatCurrency(Number(value)) : value,
                    name === 'heures' ? 'Heures' :
                    name === 'cout' ? 'Coût' :
                    name === 'employes' ? 'Employés' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="heures" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance des employés */}
        <Card>
          <CardHeader>
            <CardTitle>Performance des employés</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={employeePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'heures' ? formatDuration(Number(value)) : 
                    name === 'salaire' ? formatCurrency(Number(value)) : 
                    name === 'ponctualite' ? `${value}%` : value,
                    name === 'heures' ? 'Heures' :
                    name === 'salaire' ? 'Salaire' :
                    name === 'ponctualite' ? 'Ponctualité' :
                    name === 'shifts' ? 'Shifts' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="heures" fill="#3B82F6" />
                <Line 
                  type="monotone" 
                  dataKey="ponctualite" 
                  stroke="#10B981" 
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métriques avancées */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques avancées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {formatDuration(mainMetrics.avgHoursPerEmployee)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Heures moyennes par employé
              </div>
            </div>

            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                mainMetrics.overtimeRate > 15 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {mainMetrics.overtimeRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taux d'heures supplémentaires
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {formatCurrency(mainMetrics.costPerHour)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Coût par heure
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsView;