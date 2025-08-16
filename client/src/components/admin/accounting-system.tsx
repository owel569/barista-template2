
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Download,
  Plus, 
  Edit,
  Trash2,
  Calendar,
  PieChart,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour le système comptable
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  paymentMethod: string;
  reference?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
}

interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
  description?: string;
}

interface FinancialReport {
  id: string;
  name: string;
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow';
  period: {
    startDate: string;
    endDate: string;
  };
  data: Record<string, number>;
  generatedAt: string;
}

interface AccountingStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  monthlyGrowth: number;
  pendingTransactions: number;
}

const CATEGORIES = {
  income: [
    'Ventes - Boissons',
    'Ventes - Nourriture',
    'Services - Livraisons',
    'Autres revenus'
  ],
  expense: [
    'Achats - Matières premières',
    'Salaires et charges',
    'Loyer et charges',
    'Marketing',
    'Équipements',
    'Maintenance',
    'Autres dépenses'
  ]
};

const PAYMENT_METHODS = [
  'Espèces',
  'Carte bancaire',
  'Virement',
  'Chèque',
  'Paiement mobile'
];

export const AccountingSystem: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des données
  const { data: stats, isLoading: statsLoading } = useQuery<AccountingStats>({
    queryKey: ['/api/admin/accounting/stats', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/admin/accounting/stats?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      return response.json();
    }
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/accounting/transactions', selectedPeriod, selectedAccount],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: selectedPeriod,
        account: selectedAccount
      });
      const response = await fetch(`/api/admin/accounting/transactions?${params}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des transactions');
      return response.json();
    }
  });

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['/api/admin/accounting/accounts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/accounting/accounts');
      if (!response.ok) throw new Error('Erreur lors du chargement des comptes');
      return response.json();
    }
  });

  // Mutations
  const createTransactionMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'createdBy'>) => {
      const response = await fetch('/api/admin/accounting/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting'] });
      toast({
        title: "Succès",
        description: "Transaction créée avec succès",
      });
      setShowTransactionDialog(false);
      transactionForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, ...transaction }: Transaction) => {
      const response = await fetch(`/api/admin/accounting/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting'] });
      toast({
        title: "Succès",
        description: "Transaction mise à jour",
      });
      setShowTransactionDialog(false);
      setEditingTransaction(null);
      transactionForm.reset();
    }
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/accounting/transactions/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting'] });
      toast({
        title: "Succès",
        description: "Transaction supprimée",
      });
    }
  });

  // Formulaire de transaction
  const transactionForm = useForm<Transaction>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      type: 'income',
      category: '',
      paymentMethod: '',
      reference: '',
      status: 'completed'
    }
  });

  // Gestionnaires d'événements
  const handleCreateTransaction = (data: Transaction) => {
    createTransactionMutation.mutate(data);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    transactionForm.reset(transaction);
    setShowTransactionDialog(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      deleteTransactionMutation.mutate(id);
    }
  };

  const handleExportData = useCallback((format: 'csv' | 'pdf' | 'excel') => {
    const params = new URLSearchParams({
      format,
      period: selectedPeriod,
      account: selectedAccount
    });
    
    window.open(`/api/admin/accounting/export?${params}`, '_blank');
    
    toast({
      title: "Export lancé",
      description: `Export ${format.toUpperCase()} en cours de téléchargement`,
    });
  }, [selectedPeriod, selectedAccount]);

  // Calculs dérivés
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => 
      selectedAccount === 'all' || t.category === selectedAccount
    );
  }, [transactions, selectedAccount]);

  const categoryTotals = useMemo(() => {
    if (!transactions) return {};
    return transactions.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + 
        (transaction.type === 'income' ? transaction.amount : -transaction.amount);
      return acc;
    }, {} as Record<string, number>);
  }, [transactions]);

  if (statsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Système Comptable</h1>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => setShowTransactionDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle transaction
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.totalRevenue?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '0 €'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.totalExpenses?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '0 €'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Bénéfice net</p>
                <p className={`text-2xl font-bold ${
                  (stats?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats?.netProfit?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '0 €'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cash Flow</p>
                <p className={`text-2xl font-bold ${
                  (stats?.cashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats?.cashFlow?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '0 €'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{stats?.pendingTransactions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="accounts">Comptes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des transactions</CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par compte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les comptes</SelectItem>
                      {Object.entries(categoryTotals).map(([category, total]) => (
                        <SelectItem key={category} value={category}>
                          {category} ({total > 0 ? '+' : ''}{total.toFixed(2)}€)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={() => handleExportData('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type === 'income' ? 'Recette' : 'Dépense'}
                        </Badge>
                      </TableCell>
                      <TableCell className={
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }>
                        {transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status === 'completed' ? 'Terminée' :
                           transaction.status === 'pending' ? 'En attente' : 'Annulée'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports financiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  Compte de résultat
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Bilan comptable
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Tableau de flux
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des comptes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts?.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded">
                    <div>
                      <h4 className="font-semibold">{account.name}</h4>
                      <p className="text-sm text-muted-foreground">{account.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {account.balance.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: account.currency
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <PieChart className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Évolution mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de création/modification de transaction */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Modifier' : 'Créer'} une transaction
            </DialogTitle>
          </DialogHeader>
          
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(handleCreateTransaction)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={transactionForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">Recette</SelectItem>
                          <SelectItem value="expense">Dépense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description de la transaction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={transactionForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(transactionForm.watch('type') === 'income' 
                            ? CATEGORIES.income 
                            : CATEGORIES.expense
                          ).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTransactionDialog(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={createTransactionMutation.isPending}>
                  {editingTransaction ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingSystem;
