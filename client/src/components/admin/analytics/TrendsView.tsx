import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, ShoppingCart, Clock } from 'lucide-react';

type TrendData = {
  date: string;
  customers: number;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  satisfaction: number;
};

type TrendViewProps = {
  data: TrendData[];
  timeRange: string;
};

const TrendsView: React.FC<TrendViewProps> = ({ data, timeRange }) => {
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  const customerGrowth = previousData ? 
    ((latestData.customers - previousData.customers) / previousData.customers) * 100 : 0;
  const orderGrowth = previousData ? 
    ((latestData.orders - previousData.orders) / previousData.orders) * 100 : 0;
  const revenueGrowth = previousData ? 
    ((latestData.revenue - previousData.revenue) / previousData.revenue) * 100 : 0;

  const avgSatisfaction = data.reduce((sum, item) => sum + item.satisfaction, 0) / data.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Croissance clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.customers || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {customerGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={customerGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {customerGrowth >= 0 ? '+' : ''}{customerGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Évolution commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.orders || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {orderGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {orderGrowth >= 0 ? '+' : ''}{orderGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{latestData?.revenue || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSatisfaction.toFixed(1)}/5</div>
            <div className="text-xs text-muted-foreground">
              Sur {data.length} périodes
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Évolution globale</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`€${value}`, 'Revenus'];
                  if (name === 'avgOrderValue') return [`€${value}`, 'Panier moyen'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar 
                yAxisId="left"
                dataKey="customers" 
                fill="#8884d8"
                name="Clients"
                radius={[2, 2, 0, 0]}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Revenus"
                dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgOrderValue" 
                stroke="#ff7300" 
                strokeWidth={2}
                name="Panier moyen"
                dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Satisfaction client</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                domain={[0, 5]}
                tickFormatter={(value) => `${value}/5`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}/5`, 'Satisfaction']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="satisfaction" 
                stroke="#ff7300" 
                fill="#ff7300"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrendsView;