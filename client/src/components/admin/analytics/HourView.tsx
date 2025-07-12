import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HourData = {
  hour: string;
  orders: number;
  revenue: number;
  avgWaitTime: number;
};

type HourViewProps = {
  data: HourData[];
  timeRange: string;
};

const HourView: React.FC<HourViewProps> = ({ data, timeRange }) => {
  const peakHour = data.reduce((max, item) => 
    item.orders > max.orders ? item : max, data[0]
  );
  
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);
  const avgWaitTime = data.reduce((sum, item) => sum + item.avgWaitTime, 0) / data.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Heure de pointe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakHour?.hour || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">
              {peakHour?.orders || 0} commandes
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temps d'attente moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWaitTime.toFixed(1)} min</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commandes par heure</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Commandes']}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Bar 
                dataKey="orders" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenus par heure</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`€${value}`, 'Revenus']}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#82ca9d" 
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Temps d'attente par heure</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tickFormatter={(value) => `${value} min`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} min`, 'Temps d\'attente']}
                labelFormatter={(label) => `Heure: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="avgWaitTime" 
                stroke="#ff7300" 
                strokeWidth={2}
                dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default HourView;