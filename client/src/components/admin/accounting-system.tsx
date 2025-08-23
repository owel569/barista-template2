
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Label 
} from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Progress 
} from '@/components/ui/progress';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Receipt,
  FileText,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
  reference?: string;
  attachments?: string[];
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  type: 'income' | 'expense';
}

interface FinancialReport {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

const EXPENSE_CATEGORIES = [
  'Ingrédients',
  'Personnel',
  'Loyer',
  'Électricité',
  'Eau',
  'Marketing',
  'Équipement',
  'Maintenance',
  'Assurance',
  'Licences',
  'Autres'
] as const;

const INCOME_CATEGORIES = [
  'Ventes Café',
  'Ventes Nourriture',
  'Événements',
  'Catering',
  'Formations',
  'Autres'
] as const;

export default function AccountingSystem(): JSX.Element {
  const { toast } = useToast();
  
  // États
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form states
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    amount: '',
    description: '',
    paymentMethod: 'cash' as Transaction['paymentMethod'],
    reference: ''
  });

  // Charger les données
  useEffect(() => {
    loadTransactions();
    loadBudgetCategories();
  }, []);

  const loadTransactions = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Simulation de données réelles
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          type: 'income',
          category: 'Ventes Café',
          amount: 1250.00,
          description: 'Ventes journalières',
          date: new Date(),
          status: 'completed',
          paymentMethod: 'card'
        },
        {
          id: '2',
          type: 'expense',
          category: 'Ingrédients',
          amount: 350.00,
          description: 'Achat grains de café premium',
          date: new Date(Date.now() - 86400000),
          status: 'completed',
          paymentMethod: 'transfer'
        },
        {
          id: '3',
          type: 'expense',
          category: 'Personnel',
          amount: 2800.00,
          description: 'Salaires équipe',
          date: new Date(Date.now() - 172800000),
          status: 'pending',
          paymentMethod: 'transfer'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBudgetCategories = async (): Promise<void> => {
    try {
      const mockBudget: BudgetCategory[] = [
        { id: '1', name: 'Ingrédients', allocated: 2000, spent: 1450, type: 'expense' },
        { id: '2', name: 'Personnel', allocated: 8000, spent: 7200, type: 'expense' },
        { id: '3', name: 'Marketing', allocated: 500, spent: 320, type: 'expense' },
        { id: '4', name: 'Ventes Café', allocated: 15000, spent: 12500, type: 'income' }
      ];
      setBudgetCategories(mockBudget);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le budget",
        variant: "destructive",
      });
    }
  };

  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase();||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase();
      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchTerm]);

  // Calculer les totaux
  const financialSummary = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin
    };
  }, [transactions]);

  // Handlers
  const handleAddTransaction = useCallback(async (): Promise<void> => {
    try {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: transactionForm.type,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        date: new Date(),
        status: 'completed',
        paymentMethod: transactionForm.paymentMethod,
        reference: transactionForm.reference || undefined
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setShowTransactionDialog(false);
      resetForm();
      
      toast({
        title: "Transaction ajoutée",
        description: "La transaction a été enregistrée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la transaction",
        variant: "destructive",
      });
    }
  }, [transactionForm, toast]);

  const handleDeleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      setTransactions(prev => prev.filter(t => t.id !== id);
      setShowDeleteConfirm(null);
      
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la transaction",
        variant: "destructive",
      });
    }
  }, [toast]);

  const resetForm = (): void => {
    setTransactionForm({
      type: 'expense',
      category: '',
      amount: '',
      description: '',
      paymentMethod: 'cash',
      reference: ''
    });
  };

  const exportData = useCallback((): void => {
    try {
      const data = {
        transactions: filteredTransactions,
        summary: financialSummary,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comptabilite-${format(new Date(), 'yyyy-MM-dd'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive",
      });
    }
  }, [filteredTransactions, financialSummary, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Système Comptable</h1>
          <p className="text-muted-foreground">Gestion financière complète</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setShowTransactionDialog(true}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Transaction
          </Button>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold text-green-600">
                  {financialSummary.totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {financialSummary.totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bénéfice Net</p>
                <p className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialSummary.netProfit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marge Bénéficiaire</p>
                <p className={`text-2xl font-bold ${financialSummary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialSummary.profitMargin.toFixed(1}%
                </p>
              </div>
              <Calculator className={`h-8 w-8 ${financialSummary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher une transaction..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={(value: 'all' | 'income' | 'expense') => setFilterType(value}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="income">Revenus</SelectItem>
                    <SelectItem value="expense">Dépenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(transaction.date, 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                          {transaction.type === 'income' ? 'Revenu' : 'Dépense'}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {(transaction.type === 'income' ? '+' : '-'}
                        {transaction.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status === 'completed' ? 'Terminé' :
                           transaction.status === 'pending' ? 'En attente' : 'Annulé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setShowDeleteConfirm(transaction.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4">
            {budgetCategories.map((category) => {
              const percentage = (category.spent / category.allocated) * 100;
              const isOverBudget = percentage > 100;
              
              return (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{category.name}</h3>
                      <Badge variant={isOverBudget ? 'destructive' : 'default'}>
                        {percentage.toFixed(1}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Dépensé: {category.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                        <span>Budget: {category.allocated.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100} 
                        className={`w-full ${isOverBudget ? 'bg-red-100' : ''}`} 
                      />
                      {isOverBudget && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Dépassement de budget de {(category.spent - category.allocated).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Financiers</CardTitle>
              <CardDescription>Analyses et insights financiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Fonctionnalité de rapports en cours de développement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Transaction */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Transaction</DialogTitle>
            <DialogDescription>
              Ajouter une nouvelle transaction financière
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={transactionForm.type} onValueChange={(value: 'income' | 'expense') => 
                  setTransactionForm(prev => ({ ...prev, type: value, category: '' });}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Revenu</SelectItem>
                    <SelectItem value="expense">Dépense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={transactionForm.category} onValueChange={(value) => 
                  setTransactionForm(prev => ({ ...prev, category: value });}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(transactionForm.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    );}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Montant (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value });}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value });}
                placeholder="Description de la transaction"
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Mode de paiement</Label>
              <Select value={transactionForm.paymentMethod} onValueChange={(value: Transaction['paymentMethod']) => 
                setTransactionForm(prev => ({ ...prev, paymentMethod: value });}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false}>
              Annuler
            </Button>
            <Button onClick={handleAddTransaction}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation suppression */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La transaction sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => showDeleteConfirm && handleDeleteTransaction(showDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
