import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, Edit, Download, Upload
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
}

interface AccountingSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  monthlyGrowth: number;
}

export default function AccountingSystem() : void {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [transactionsRes, summaryRes] = await Promise.all([
        fetch('/api/admin/accounting/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/accounting/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (transactionsRes.ok && summaryRes.ok) {
        const [transactionsData, summaryData] = await Promise.all([
          transactionsRes.json(),
          summaryRes.json()
        ]);
        
        // Traiter les données pour s'assurer que les montants sont des nombres
        const processedTransactions = transactionsData.map((transaction: any) => ({
          ...transaction,
          amount: Number(transaction.amount) || 0
        }));
        
        const processedSummary = summaryData ? {
          ...summaryData,
          totalIncome: Number(summaryData.totalIncome) || 0,
          totalExpenses: Number(summaryData.totalExpenses) || 0,
          netProfit: Number(summaryData.netProfit) || 0,
          monthlyGrowth: Number(summaryData.monthlyGrowth) || 0
        } : null;
        
        setTransactions(processedTransactions);
        setSummary(processedSummary);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la comptabilité:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'income' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Système de Comptabilité
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion financière et suivi des transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Transaction
          </Button>
        </div>
      </div>

      {/* Résumé financier */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Revenus Totaux
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {Number(summary.totalIncome || 0).toFixed(2)}€
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Dépenses Totales
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {Number(summary.totalExpenses || 0).toFixed(2)}€
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Bénéfice Net
                  </p>
                  <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(summary.netProfit || 0).toFixed(2)}€
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Croissance Mensuelle
                  </p>
                  <p className={`text-2xl font-bold ${summary.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(summary.monthlyGrowth || 0) >= 0 ? '+' : ''}{Number(summary.monthlyGrowth || 0).toFixed(1)}%
                  </p>
                </div>
                {summary.monthlyGrowth >= 0 ? 
                  <TrendingUp className="h-8 w-8 text-green-500" /> :
                  <TrendingDown className="h-8 w-8 text-red-500" />
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {transaction.type === 'income' ? 
                          <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" /> :
                          <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                        }
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {transaction.description}
                          </h3>
                          <Badge className={getTypeColor(transaction.type)}>
                            {transaction.type === 'income' ? 'Recette' : 'Dépense'}
                          </Badge>
                          <Badge variant="outline">{transaction.category}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                            <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{(transaction.amount || 0).toFixed(2)}€
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Date:</span>
                            <p className="font-medium">
                              {new Date(transaction.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Référence:</span>
                            <p className="font-medium">{transaction.reference || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Catégorie:</span>
                            <p className="font-medium">{transaction.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Catégories de Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Ventes Café', 'Ventes Pâtisseries', 'Services Traiteur', 'Événements'].map((category) => {
                    const categoryTransactions = transactions.filter(t => t.type === 'income' && t.category === category);
                    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="font-medium">{category}</span>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{Number(total || 0).toFixed(2)}€</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {categoryTransactions.length} transactions
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catégories de Dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Matières Premières', 'Salaires', 'Loyer', 'Électricité', 'Marketing'].map((category) => {
                    const categoryTransactions = transactions.filter(t => t.type === 'expense' && t.category === category);
                    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="font-medium">{category}</span>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{Number(total || 0).toFixed(2)}€</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {categoryTransactions.length} transactions
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Rapport Mensuel</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Résumé financier du mois en cours
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Rapport de Croissance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Analyse des tendances et croissance
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Rapport Fiscal</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Documents pour déclarations fiscales
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Financière</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Marge bénéficiaire:</span>
                    <span className="font-semibold">
                      {summary ? ((summary.netProfit / summary.totalIncome) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ROI mensuel:</span>
                    <span className="font-semibold text-green-600">
                      {summary ? summary.monthlyGrowth.toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ratio dépenses/revenus:</span>
                    <span className="font-semibold">
                      {summary ? (summary.totalExpenses / summary.totalIncome).toFixed(2) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicateurs Clés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Nombre de transactions:</span>
                    <span className="font-semibold">{transactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Transaction moyenne:</span>
                    <span className="font-semibold">
                      {transactions.length > 0 
                        ? (transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length).toFixed(2)
                        : 0}€
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Catégories actives:</span>
                    <span className="font-semibold">
                      {new Set(transactions.map(t => t.category)).size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}