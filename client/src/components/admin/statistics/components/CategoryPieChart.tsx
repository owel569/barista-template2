import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export function CategoryPieChart({ 
  data, 
  loading = false, 
  title = "Répartition par Catégorie",
  emptyMessage = "Aucune donnée disponible",
  height = 320,
  innerRadius = 0,
  outerRadius = 80,
}: CategoryPieChartProps) {
  // Derived state
  const isEmpty = !loading && (!data || data.length === 0);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400"
            aria-live="polite"
          >
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-gray-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              aria-label="Répartition par catégorie"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}-${index}`} 
                  fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                  name={entry.name}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, 'Valeur']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                color: 'hsl(var(--foreground))',
                fontSize: '0.75rem'
              }}
              layout="horizontal"
              verticalAlign="bottom"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}