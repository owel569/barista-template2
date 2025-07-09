import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Calendar,
  Filter,
  Download,
  Receipt,
  CreditCard,
  Wallet,
  PieChart,
  BarChart3
} from 'lucide-react';

interface AccountingSystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function AccountingSystem({ userRole = 'directeur' }: AccountingSystemProps) {
  const [activeTab, setActiveTab] = useState('transactions');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'recette',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/admin/accounting/transactions'],
    enabled: userRole === 'directeur'
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/accounting/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/accounting/transactions'] });
      setIsCreateDialogOpen(false);
      setTransactionForm({ type: 'recette', amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0] });
      toast({
        title: "Succès",
        description: "Transaction ajoutée avec succès"
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la transaction",
        variant: "destructive"
      });
    }
  });

  const handleCreateTransaction = () => {
    if (!transactionForm.amount || !transactionForm.description || !transactionForm.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }
    createTransactionMutation.mutate({
      ...transactionForm,
      amount: parseFloat(transactionForm.amount)
    });
  };

  const categories = ['Ventes', 'Matières premières', 'Salaires', 'Utilités', 'Marketing', 'Équipement', 'Maintenance', 'Autres'];

  // Calculs financiers
  const totalRecettes = transactions?.filter((t: any) => t.type === 'recette').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
  const totalDepenses = transactions?.filter((t: any) => t.type === 'depense').reduce((sum: number, t: any) => sum + t.amount, 0) || 0;
  const beneficeNet = totalRecettes - totalDepenses;

  const getTransactionIcon = (type: string) => {
    return type === 'recette' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const getTransactionColor = (type: string) => {
    return type === 'recette' ? 'text-green-600' : 'text-red-600';
  };

  if (userRole !== 'directeur') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
          <p className="text-gray-600">Seuls les directeurs peuvent accéder au système comptable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Système Comptable</h2>
          <p className="text-gray-600">Gérez les finances et la comptabilité du café</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une transaction</DialogTitle>
              <DialogDescription>
                Enregistrez une nouvelle transaction financière
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Type de transaction</Label>
                <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm({ ...transactionForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recette">Recette</SelectItem>
                    <SelectItem value="depense">Dépense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  placeholder="Ex: Vente de café"
                />
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={transactionForm.category} onValueChange={(value) => setTransactionForm({ ...transactionForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateTransaction} disabled={createTransactionMutation.isPending}>
                  {createTransactionMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recettes</p>
                <p className="text-2xl font-bold text-green-600">{totalRecettes.toFixed(2)} €</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dépenses</p>
                <p className="text-2xl font-bold text-red-600">{totalDepenses.toFixed(2)} €</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bénéfice Net</p>
                <p className={`text-2xl font-bold ${beneficeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {beneficeNet.toFixed(2)} €
                </p>
              </div>
              <Euro className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold">{transactions?.length || 0}</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Par catégorie</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Historique des transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Chargement des transactions...</p>
                </div>
              ) : transactions?.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune transaction</h3>
                  <p className="text-gray-600">Ajoutez votre première transaction financière.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions?.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${transaction.type === 'recette' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                          <p className="text-sm text-gray-600">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === 'recette' ? '+' : '-'}{transaction.amount.toFixed(2)} €
                        </p>
                        <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Analyse par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map(category => {
                  const categoryTransactions = transactions?.filter((t: any) => t.category === category) || [];
                  const totalAmount = categoryTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
                  const recettes = categoryTransactions.filter((t: any) => t.type === 'recette').reduce((sum: number, t: any) => sum + t.amount, 0);
                  const depenses = categoryTransactions.filter((t: any) => t.type === 'depense').reduce((sum: number, t: any) => sum + t.amount, 0);
                  
                  if (categoryTransactions.length === 0) return null;
                  
                  return (
                    <div key={category} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{category}</h4>
                        <span className="text-sm text-gray-600">{categoryTransactions.length} transactions</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Recettes</p>
                          <p className="font-bold text-green-600">+{recettes.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dépenses</p>
                          <p className="font-bold text-red-600">-{depenses.toFixed(2)} €</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Rapports financiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Résumé mensuel</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-blue-700">Recettes</p>
                      <p className="font-bold text-green-600">{totalRecettes.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Dépenses</p>
                      <p className="font-bold text-red-600">{totalDepenses.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Bénéfice</p>
                      <p className={`font-bold ${beneficeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {beneficeNet.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Marge bénéficiaire</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {totalRecettes > 0 ? ((beneficeNet / totalRecettes) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    {beneficeNet >= 0 ? 'Rentabilité positive' : 'Rentabilité négative'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}