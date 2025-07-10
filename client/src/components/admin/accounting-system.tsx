import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calculator, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  id: number;
  date: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  category: string;
  reference?: string;
}

interface AccountingSystemProps {
  userRole: 'directeur' | 'employe';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AccountingSystem({ userRole }: AccountingSystemProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'revenue' | 'expense'>('revenue');
  const [dateFilter, setDateFilter] = useState('month');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canView } = usePermissions();

  // Récupérer les transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/accounting/transactions'],
    enabled: canView,
    retry: 3,
  });

  // Récupérer les données de revenus détaillées
  const { data: revenueData } = useQuery({
    queryKey: ['/api/admin/stats/revenue-detailed'],
    enabled: canView,
    retry: 3,
  });

  // Mutation pour créer une transaction
  const createTransaction = useMutation({
    mutationFn: (data: Omit<Transaction, 'id'>) => 
      apiRequest('/api/admin/accounting/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting/transactions'] });
      setIsAddDialogOpen(false);
      toast({ title: "Transaction ajoutée", description: "La transaction a été enregistrée" });
    }
  });

  // Calculs financiers
  const totalRevenue = transactions
    .filter(t => t.type === 'revenue')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Données pour les graphiques
  const dailyData = revenueData?.daily?.slice(-7) || [];
  
  const categoryData = transactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { revenue: 0, expenses: 0 };
    }
    if (transaction.type === 'revenue') {
      acc[category].revenue += transaction.amount;
    } else {
      acc[category].expenses += Math.abs(transaction.amount);
    }
    return acc;
  }, {} as Record<string, { revenue: number; expenses: number }>);

  const chartData = Object.entries(categoryData).map(([category, data]) => ({
    category,
    revenus: data.revenue,
    dépenses: data.expenses,
    bénéfice: data.revenue - data.expenses
  }));

  const expensesByCategory = Object.entries(categoryData).map(([name, data], index) => ({
    name,
    value: data.expenses,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  const handleSubmitTransaction = (formData: FormData) => {
    const amount = parseFloat(formData.get('amount') as string);
    const data = {
      type: transactionType,
      amount: transactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      reference: formData.get('reference') as string || undefined,
      date: new Date().toISOString().split('T')[0]
    };

    createTransaction.mutate(data);
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Montant', 'Description', 'Catégorie', 'Référence'].join(','),
      ...transactions.map(t => [
        t.date,
        t.type === 'revenue' ? 'Recette' : 'Dépense',
        t.amount,
        t.description,
        t.category,
        t.reference || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptabilite-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Accès non autorisé. Contactez votre administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6">Chargement des données comptables...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Comptabilité</h1>
          <p className="text-muted-foreground">Suivi financier et transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          {canCreate && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter une Transaction</DialogTitle>
                  <DialogDescription>
                    Enregistrer une nouvelle recette ou dépense
                  </DialogDescription>
                </DialogHeader>
                <form action={handleSubmitTransaction} className="space-y-4">
                  <div>
                    <Label>Type de transaction</Label>
                    <Select value={transactionType} onValueChange={(value: 'revenue' | 'expense') => setTransactionType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="revenue">Recette</SelectItem>
                        <SelectItem value="expense">Dépense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Montant (€)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" required />
                  </div>
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {transactionType === 'revenue' ? (
                          <>
                            <SelectItem value="Ventes">Ventes</SelectItem>
                            <SelectItem value="Services">Services</SelectItem>
                            <SelectItem value="Autres recettes">Autres recettes</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="Approvisionnement">Approvisionnement</SelectItem>
                            <SelectItem value="Charges">Charges</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Personnel">Personnel</SelectItem>
                            <SelectItem value="Équipement">Équipement</SelectItem>
                            <SelectItem value="Autres dépenses">Autres dépenses</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reference">Référence (optionnel)</Label>
                    <Input id="reference" name="reference" placeholder="N° facture, bon de commande..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                    {createTransaction.isPending ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Recettes Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</div>
            <p className="text-xs opacity-75">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Dépenses Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses.toFixed(2)}€</div>
            <p className="text-xs opacity-75">Ce mois-ci</p>
          </CardContent>
        </Card>

        <Card className={`${netProfit >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Bénéfice Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netProfit.toFixed(2)}€</div>
            <p className="text-xs opacity-75">
              {netProfit >= 0 ? 'Profit' : 'Perte'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              Marge Bénéficiaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitMargin.toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs">
              {profitMargin >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                Ratio profit/recettes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des revenus */}
            <Card>
              <CardHeader>
                <CardTitle>Revenus des 7 Derniers Jours</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}€`, 'Revenus']} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Répartition des dépenses */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}€`, 'Dépenses']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Transactions ({transactions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'revenue' ? 'default' : 'secondary'}>
                          {transaction.type === 'revenue' ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {transaction.type === 'revenue' ? 'Recette' : 'Dépense'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'revenue' ? '+' : ''}
                          {transaction.amount.toFixed(2)}€
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {transaction.reference || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenus" fill="#00C49F" name="Revenus" />
                  <Bar dataKey="dépenses" fill="#FF8042" name="Dépenses" />
                  <Bar dataKey="bénéfice" fill="#8884d8" name="Bénéfice" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}