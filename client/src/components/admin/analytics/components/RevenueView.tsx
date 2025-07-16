/**
 * Vue des revenus avec graphiques
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  LineChart,
  AreaChart,
  Legend
} from 'recharts';

interface RevenueViewProps {
  timeRange: string;
}

// Données simulées dynamiques selon la période
const generateRevenueData = (timeRange: string) => {
  const baseData = [
    { name: 'Lun', ventes: 1200, commandes: 45, clients: 35 },
    { name: 'Mar', ventes: 1100, commandes: 42, clients: 38 },
    { name: 'Mer', ventes: 1400, commandes: 52, clients: 45 },
    { name: 'Jeu', ventes: 1600, commandes: 58, clients: 48 },
    { name: 'Ven', ventes: 1800, commandes: 65, clients: 52 },
    { name: 'Sam', ventes: 2200, commandes: 78, clients: 65 },
    { name: 'Dim', ventes: 1900, commandes: 68, clients: 58 }
  ];

  // Ajuster selon la période
  const multiplier = timeRange === '7d' ? 1 : timeRange === '30d' ? 1.2 : 1.5;
  return baseData.map(item => ({
    ...item,
    ventes: Math.round(item.ventes * multiplier),
    commandes: Math.round(item.commandes * multiplier),
    clients: Math.round(item.clients * multiplier)
  }));
};

const categoryData = [
  { name: 'Cafés', value: 4200, color: '#8B4513' },
  { name: 'Pâtisseries', value: 3100, color: '#D2691E' },
  { name: 'Boissons', value: 2800, color: '#4682B4' },
  { name: 'Petits Déjeuners', value: 2400, color: '#32CD32' }
];

const hourlyData = [
  { heure: '8h', revenus: 320, commandes: 12 },
  { heure: '9h', revenus: 480, commandes: 18 },
  { heure: '10h', revenus: 560, commandes: 21 },
  { heure: '11h', revenus: 420, commandes: 16 },
  { heure: '12h', revenus: 720, commandes: 28 },
  { heure: '13h', revenus: 840, commandes: 32 },
  { heure: '14h', revenus: 650, commandes: 25 },
  { heure: '15h', revenus: 380, commandes: 15 },
  { heure: '16h', revenus: 290, commandes: 11 },
  { heure: '17h', revenus: 450, commandes: 17 },
  { heure: '18h', revenus: 380, commandes: 14 },
  { heure: '19h', revenus: 520, commandes: 20 }
];

export const RevenueView: React.FC<RevenueViewProps> = ({ timeRange }) => {
  const revenueData = generateRevenueData(timeRange);

  return (
    <div className="space-y-6">
      {/* Graphique principal des revenus */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'ventes' ? `${value}€` : value,
                  name === 'ventes' ? 'Revenus' : 
                  name === 'commandes' ? 'Commandes' : 'Clients'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="ventes" fill="#8884d8" name="Revenus (€)" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="commandes" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Commandes"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="clients" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Clients"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}€`, 'Revenus']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenus par heure */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Heure</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="heure" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}€`, 'Revenus']} />
                <Area 
                  type="monotone" 
                  dataKey="revenus" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métriques détaillées */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques Détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {revenueData.reduce((sum, item) => sum + item.ventes, 0).toLocaleString()}€
              </div>
              <div className="text-sm text-blue-600">Revenus Total</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {revenueData.reduce((sum, item) => sum + item.commandes, 0)}
              </div>
              <div className="text-sm text-green-600">Commandes Total</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(revenueData.reduce((sum, item) => sum + item.ventes, 0) / 
                  revenueData.reduce((sum, item) => sum + item.commandes, 0))}€
              </div>
              <div className="text-sm text-purple-600">Panier Moyen</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {revenueData.reduce((sum, item) => sum + item.clients, 0)}
              </div>
              <div className="text-sm text-orange-600">Clients Uniques</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};