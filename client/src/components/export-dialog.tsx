
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface OnlineOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  platform: string;
  orderType: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface ExportDialogProps {
  orders: OnlineOrder[];
}

export function ExportDialog({ orders }: ExportDialogProps) {
  const exportToCSV = () => {
    const headers = ['N° Commande', 'Client', 'Email', 'Téléphone', 'Plateforme', 'Type', 'Statut', 'Montant', 'Date'];
    const csvData = orders.map(order => [
      order.orderNumber,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.platform,
      order.orderType,
      order.status,
      order.totalAmount,
      new Date(order.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commandes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter les commandes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{orders.length} commandes à exporter</p>
          <Button onClick={exportToCSV} className="w-full">
            Exporter en CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
