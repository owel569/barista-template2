
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OnlineOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  platform: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface AnalyticsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OnlineOrder[];
}

export function AnalyticsDashboard({ open, onOpenChange, orders }: AnalyticsDashboardProps) {
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const dailyData = last7Days.map(date => {
    const dayOrders = orders.filter(order => order.createdAt.startsWith(date));
    return {
      date,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    };
  });

  const platformStats = orders.reduce((acc, order) => {
    if (!acc[order.platform]) {
      acc[order.platform] = { orders: 0, revenue: 0 };
    }
    acc[order.platform].orders++;
    acc[order.platform].revenue += order.totalAmount;
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);

  const statusStats = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics des Commandes</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chiffre d'Affaires</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}€
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Commandes Aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {orders.filter(order => order.createdAt.startsWith(today.toISOString().split('T')[0])).length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Commandes des 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Par Plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(platformStats).map(([platform, stats]) => (
                <div key={platform} className="flex justify-between py-2 border-b">
                  <span className="capitalize">
                    {platform === 'website' ? 'Site Web' : 
                     platform === 'mobile_app' ? 'App Mobile' : 'Téléphone'}
                  </span>
                  <span>{stats.orders} commandes ({stats.revenue.toFixed(2)}€)</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(statusStats).map(([status, count]) => (
                <div key={status} className="flex justify-between py-2 border-b">
                  <span className="capitalize">{status}</span>
                  <span>{count} commandes</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
