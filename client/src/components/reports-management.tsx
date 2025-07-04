import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download, Calendar, BarChart3, PieChart as PieChartIcon, Users, DollarSign } from "lucide-react";
import { UserRole } from "@/lib/permissions";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface ReportsManagementProps {
  userRole: UserRole;
}

export default function ReportsManagement({ userRole }: ReportsManagementProps) {
  const [dateRange, setDateRange] = useState("last_month");
  const [reportType, setReportType] = useState("sales");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Données de démonstration pour les rapports
  const salesData = [
    { date: "01/07", ventes: 1200, commandes: 45 },
    { date: "02/07", ventes: 1350, commandes: 52 },
    { date: "03/07", ventes: 980, commandes: 38 },
    { date: "04/07", ventes: 1500, commandes: 58 },
    { date: "05/07", ventes: 1750, commandes: 67 },
    { date: "06/07", ventes: 1950, commandes: 75 },
    { date: "07/07", ventes: 2100, commandes: 82 }
  ];

  const categoryData = [
    { name: "Cafés", value: 45, color: "#F59E0B" },
    { name: "Pâtisseries", value: 30, color: "#10B981" },
    { name: "Boissons", value: 15, color: "#3B82F6" },
    { name: "Plats", value: 10, color: "#8B5CF6" }
  ];

  const customerData = [
    { type: "Nouveaux", count: 125 },
    { type: "Fidèles", count: 89 },
    { type: "VIP", count: 23 }
  ];

  const popularItems = [
    { name: "Cappuccino", ventes: 234, revenus: 936 },
    { name: "Croissant", ventes: 189, revenus: 567 },
    { name: "Latte", ventes: 156, revenus: 702 },
    { name: "Macaron", ventes: 134, revenus: 402 },
    { name: "Espresso", ventes: 123, revenus: 369 }
  ];

  const handleExportReport = () => {
    // Logique d'export en PDF/Excel
    console.log("Export du rapport", { reportType, dateRange });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rapports et analyses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyses détaillées des performances du café
          </p>
        </div>
        <Button onClick={handleExportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtres de rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reportType">Type de rapport</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Ventes</SelectItem>
                  <SelectItem value="customers">Clients</SelectItem>
                  <SelectItem value="inventory">Inventaire</SelectItem>
                  <SelectItem value="staff">Personnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange">Période</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="yesterday">Hier</SelectItem>
                  <SelectItem value="last_week">7 derniers jours</SelectItem>
                  <SelectItem value="last_month">30 derniers jours</SelectItem>
                  <SelectItem value="last_quarter">3 derniers mois</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateRange === "custom" && (
              <>
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">12,450€</p>
                <p className="text-green-200 text-xs">+15% ce mois</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Commandes totales</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-blue-200 text-xs">+8% ce mois</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Nouveaux clients</p>
                <p className="text-2xl font-bold">125</p>
                <p className="text-purple-200 text-xs">+23% ce mois</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Panier moyen</p>
                <p className="text-2xl font-bold">18,50€</p>
                <p className="text-amber-200 text-xs">+5% ce mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution des ventes (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="right" dataKey="commandes" fill="#3B82F6" opacity={0.3} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Ventes par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableaux détaillés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produits populaires */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.ventes} ventes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{item.revenus}€</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Répartition des clients */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerData.map((type, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{type.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{type.count}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900 dark:text-white">Total clients actifs</span>
                <span className="text-lg font-bold text-blue-600">237</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}