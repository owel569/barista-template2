import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Receipt, 
  Calculator,
  PieChart,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Download
} from 'lucide-react';

interface AccountingProps {
  userRole?: 'directeur' | 'employe';
}

export default function Accounting({ userRole = 'directeur' }: AccountingProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Données financières factices pour démonstration
  const financialData = {
    revenue: 45000,
    expenses: 28000,
    profit: 17000,
    growth: 12.5,
    transactions: [
      { id: 1, type: 'recette', amount: 1250, description: 'Ventes restaurant', date: '2025-07-09', category: 'Ventes' },
      { id: 2, type: 'depense', amount: 450, description: 'Approvisionnement café', date: '2025-07-09', category: 'Matières premières' },
      { id: 3, type: 'recette', amount: 890, description: 'Commandes en ligne', date: '2025-07-08', category: 'Ventes' },
      { id: 4, type: 'depense', amount: 320, description: 'Électricité', date: '2025-07-08', category: 'Utilités' },
      { id: 5, type: 'depense', amount: 2100, description: 'Salaires employés', date: '2025-07-07', category: 'Personnel' },
    ],
    categories: {
      recettes: [
        { name: 'Ventes', amount: 35000, percentage: 77.8 },
        { name: 'Livraisons', amount: 8000, percentage: 17.8 },
        { name: 'Événements', amount: 2000, percentage: 4.4 },
      ],
      depenses: [
        { name: 'Personnel', amount: 12000, percentage: 42.9 },
        { name: 'Matières premières', amount: 8000, percentage: 28.6 },
        { name: 'Loyer', amount: 4000, percentage: 14.3 },
        { name: 'Utilités', amount: 2000, percentage: 7.1 },
        { name: 'Marketing', amount: 1500, percentage: 5.4 },
        { name: 'Autres', amount: 500, percentage: 1.8 },
      ]
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold text-green-600">{financialData.revenue.toLocaleString()}€</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dépenses</p>
                <p className="text-2xl font-bold text-red-600">{financialData.expenses.toLocaleString()}€</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice</p>
                <p className="text-2xl font-bold text-blue-600">{financialData.profit.toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Croissance</p>
                <p className="text-2xl font-bold text-purple-600">+{financialData.growth}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition des Revenus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.categories.recettes.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{category.amount.toLocaleString()}€</p>
                    <p className="text-xs text-muted-foreground">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Répartition des Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.categories.depenses.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{category.amount.toLocaleString()}€</p>
                    <p className="text-xs text-muted-foreground">{category.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Transactions Récentes</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Transaction
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Catégorie</th>
                  <th className="text-right p-4">Montant</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {financialData.transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b">
                    <td className="p-4">{new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4">
                      <Badge variant={transaction.type === 'recette' ? 'default' : 'destructive'}>
                        {transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                      </Badge>
                    </td>
                    <td className="p-4">{transaction.description}</td>
                    <td className="p-4">{transaction.category}</td>
                    <td className="p-4 text-right">
                      <span className={transaction.type === 'recette' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'recette' ? '+' : '-'}{transaction.amount.toLocaleString()}€
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rapports Financiers</h3>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bilan Comptable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Actifs</span>
                <span className="font-medium">85 000€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Passifs</span>
                <span className="font-medium">32 000€</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-sm">Capitaux propres</span>
                <span>53 000€</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Compte de Résultat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Chiffre d'affaires</span>
                <span className="font-medium text-green-600">45 000€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Charges</span>
                <span className="font-medium text-red-600">28 000€</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-sm">Résultat net</span>
                <span className="text-blue-600">17 000€</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Flux de Trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Exploitation</span>
                <span className="font-medium text-green-600">+22 000€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Investissement</span>
                <span className="font-medium text-red-600">-8 000€</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-sm">Trésorerie nette</span>
                <span className="text-blue-600">14 000€</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Comptabilité & Finance</h2>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Période: {selectedPeriod}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {renderTransactions()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {renderReports()}
        </TabsContent>
      </Tabs>
    </div>
  );
}