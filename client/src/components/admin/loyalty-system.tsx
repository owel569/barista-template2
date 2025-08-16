import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, Star, TrendingUp, Award, Users, Plus, Edit, Crown, Search, X, Filter, 
  ChevronDown, ChevronUp, Loader2, RefreshCw, AlertCircle, Check, Trash2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface LoyaltyCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  points: number;
  totalSpent: number;
  level: string;
  joinDate: string;
  lastPurchaseDate?: string;
}

interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  isActive: boolean;
  stock?: number;
  expiryDate?: string;
  imageUrl?: string;
}

interface LoyaltyStats {
  totalCustomers: number;
  totalPointsIssued: number;
  totalRewardsRedeemed: number;
  averagePointsPerCustomer: number;
  levelDistribution: { [key: string]: number };
  pointsDistribution: {
    range: string;
    count: number;
  }[];
  rewardsPopularity: {
    rewardId: number;
    rewardName: string;
    redemptionCount: number;
  }[];
}

export default function LoyaltySystem() : JSX.Element {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<LoyaltyCustomer[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: keyof LoyaltyCustomer; direction: 'ascending' | 'descending'} | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'customer' | 'reward', id: number} | null>(null);

  // Niveaux de fidélité avec seuils
  const loyaltyLevels = [
    { name: 'Nouveau', threshold: 0, color: 'bg-gray-100 text-gray-800', icon: <Users className="h-4 w-4" /> },
    { name: 'Régulier', threshold: 100, color: 'bg-blue-100 text-blue-800', icon: <Star className="h-4 w-4" /> },
    { name: 'Fidèle', threshold: 500, color: 'bg-yellow-100 text-yellow-800', icon: <Award className="h-4 w-4" /> },
    { name: 'VIP', threshold: 1000, color: 'bg-purple-100 text-purple-800', icon: <Crown className="h-4 w-4" /> }
  ];

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers, sortConfig]);

  const fetchLoyaltyData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      
      const [customersRes, rewardsRes, statsRes] = await Promise.all([
        fetch('/api/admin/loyalty/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/loyalty/rewards', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/loyalty/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!customersRes.ok || !rewardsRes.ok || !statsRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const [customersData, rewardsData, statsData] = await Promise.all([
        customersRes.json(),
        rewardsRes.json(),
        statsRes.json()
      ]);
      
      // Process customers data
      const processedCustomers = (customersData || []).map((customer: any) => ({
        ...customer,
        points: Number(customer.points) || 0,
        totalSpent: Number(customer.totalSpent) || 0,
        level: calculateLevel(Number(customer.totalSpent) || 0)
      }));
      
      // Process stats data
      const processedStats = statsData ? {
        ...statsData,
        totalCustomers: Number(statsData.totalCustomers) || 0,
        totalPointsIssued: Number(statsData.totalPointsIssued) || 0,
        totalRewardsRedeemed: Number(statsData.totalRewardsRedeemed) || 0,
        averagePointsPerCustomer: Number(statsData.averagePointsPerCustomer) || 0,
        levelDistribution: statsData.levelDistribution || {}
      } : {
        totalCustomers: 0,
        totalPointsIssued: 0,
        totalRewardsRedeemed: 0,
        averagePointsPerCustomer: 0,
        levelDistribution: {},
        pointsDistribution: [],
        rewardsPopularity: []
      };
      
      setCustomers(processedCustomers);
      setRewards(rewardsData || []);
      setStats(processedStats);
      
    } catch (error) {
      console.error('Erreur lors du chargement du système de fidélité:', error);
      setError('Impossible de charger les données. Veuillez réessayer.');
      // Définir des valeurs par défaut en cas d'erreur
      setCustomers([]);
      setRewards([]);
      setStats({
        totalCustomers: 0,
        totalPointsIssued: 0,
        totalRewardsRedeemed: 0,
        averagePointsPerCustomer: 0,
        levelDistribution: {},
        pointsDistribution: [],
        rewardsPopularity: []
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const calculateLevel = (totalSpent: number): string => {
    const level = loyaltyLevels.reduce((prev, current) => 
      (totalSpent >= current.threshold) ? current : prev
    );
    return level.name;
  };

  const filterCustomers = () => {
    let result = [...customers];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer => 
        customer.firstName.toLowerCase().includes(term) || 
        customer.lastName.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        (customer.phone && customer.phone.includes(term))
    }
    
    // Sort if sortConfig exists
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredCustomers(result);
  };

  const requestSort = (key: keyof LoyaltyCustomer) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof LoyaltyCustomer) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-4 w-4" /> 
      : <ChevronDown className="h-4 w-4" />;
  };

  const awardPoints = async (customerId: number, points: number, reason: string) => {
    if (!points || points <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nombre de points valide',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsAddingPoints(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/loyalty/award-points', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId,
          points,
          reason
        })
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: `${points} points ont été ajoutés avec succès`,
          action: <Check className="h-4 w-4 text-green-500" />
        });
        await fetchLoyaltyData();
        setPointsToAdd('');
      } else {
        throw new Error('Erreur lors de l\'attribution des points');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'attribution des points',
        variant: 'destructive'
      });
    } finally {
      setIsAddingPoints(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = itemToDelete.type === 'customer' 
        ? `/api/admin/loyalty/customers/${itemToDelete.id}`
        : `/api/admin/loyalty/rewards/${itemToDelete.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: `Le ${itemToDelete.type === 'customer' ? 'client' : 'récompense'} a été supprimé avec succès`,
          action: <Check className="h-4 w-4 text-green-500" />
        });
        await fetchLoyaltyData();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive'
      });
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const getLevelColor = (level: string) => {
    const foundLevel = loyaltyLevels.find(l => l.name === level);
    return foundLevel ? foundLevel.color : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getLevelIcon = (level: string) => {
    const foundLevel = loyaltyLevels.find(l => l.name === level);
    return foundLevel ? foundLevel.icon : <Users className="h-4 w-4" />;
  };

  if (loading && !isRefreshing) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{error}</h2>
        </div>
        <Button onClick={fetchLoyaltyData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Système de Fidélité
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des points et récompenses clients
          </p>
        </div>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchLoyaltyData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Actualiser les données</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {stats?.totalCustomers || 0} clients fidèles
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Clients
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalCustomers.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Points Émis
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalPointsIssued.toLocaleString()}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Récompenses Échangées
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalRewardsRedeemed.toLocaleString()}
                  </p>
                </div>
                <Gift className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Moyenne Points/Client
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(stats.averagePointsPerCustomer)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Niveaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.levelDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(level)}
                        <span className="font-medium">{level}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(level)}>
                          {count} clients
                        </Badge>
                        <div className="w-24">
                          <Progress 
                            value={(count / stats.totalCustomers) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Clients Fidèles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 5)
                    .map((customer, index) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <Badge className={getLevelColor(customer.level)} variant="outline">
                              {customer.level}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">
                            {customer.points.toLocaleString()} pts
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {customer.totalSpent.toFixed(2)}€ dépensés
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.rewardsPopularity && stats.rewardsPopularity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Récompenses les plus populaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.rewardsPopularity
                    .sort((a, b) => b.redemptionCount - a.redemptionCount)
                    .slice(0, 5)
                    .map((reward) => (
                      <div key={reward.rewardId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{reward.rewardName}</span>
                        </div>
                        <Badge variant="outline">
                          {reward.redemptionCount} échanges
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher clients..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <X 
                  className="absolute right-3 top-3 h-4 w-4 text-gray-500 cursor-pointer"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Client
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left py-3 px-4 cursor-pointer"
                    onClick={() => requestSort('lastName')}
                  >
                    <div className="flex items-center gap-1">
                      Client
                      {getSortIcon('lastName')}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 cursor-pointer"
                    onClick={() => requestSort('level')}
                  >
                    <div className="flex items-center gap-1">
                      Niveau
                      {getSortIcon('level')}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 cursor-pointer"
                    onClick={() => requestSort('points')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Points
                      {getSortIcon('points')}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 cursor-pointer"
                    onClick={() => requestSort('totalSpent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Dépenses
                      {getSortIcon('totalSpent')}
                    </div>
                  </th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getLevelColor(customer.level)}>
                          {getLevelIcon(customer.level)}
                          <span className="ml-1">{customer.level}</span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-purple-600">
                        {customer.points.toLocaleString()} pts
                      </td>
                      <td className="py-4 px-4 text-right">
                        {customer.totalSpent.toFixed(2)}€
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="Points"
                              className="w-24"
                              value={pointsToAdd}
                              onChange={(e) => setPointsToAdd(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const points = parseInt(pointsToAdd);
                                  if (!isNaN(points) && points > 0) {
                                    awardPoints(customer.id, points, 'Attribution manuelle');
                                  }
                                }
                              }}
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const points = parseInt(pointsToAdd);
                                if (!isNaN(points) {
                                  awardPoints(customer.id, points, 'Attribution manuelle');
                                }
                              }}
                              disabled={isAddingPoints}
                            >
                              {isAddingPoints ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => {
                              setItemToDelete({type: 'customer', id: customer.id});
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Aucun client trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher récompenses..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Récompense
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <Card key={reward.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {reward.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {reward.description}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{reward.category}</Badge>
                          {reward.stock !== undefined && (
                            <Badge variant="outline">
                              Stock: {reward.stock}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge className={reward.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {reward.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold text-purple-600">
                          {reward.pointsCost} points
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedReward(reward)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setItemToDelete({type: 'reward', id: reward.id});
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-gray-500">
                Aucune récompense disponible
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Progression des Niveaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Critères d'évolution basés sur les dépenses totales:
                  </div>
                  <div className="space-y-3">
                    {loyaltyLevels.slice(0, -1).map((level, index) => (
                      <div key={level.name} className="flex items-center justify-between">
                        <span>{level.name} → {loyaltyLevels[index + 1].name}</span>
                        <Badge variant="outline">
                          {loyaltyLevels[index + 1].threshold}€
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Système de Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Règles d'attribution automatique:
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Achat de 10€</span>
                      <Badge className="bg-purple-100 text-purple-800">+1 point</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Réservation confirmée</span>
                      <Badge className="bg-purple-100 text-purple-800">+5 points</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Anniversaire</span>
                      <Badge className="bg-purple-100 text-purple-800">+50 points</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Parrainage</span>
                      <Badge className="bg-purple-100 text-purple-800">+100 points</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats?.pointsDistribution && stats.pointsDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.pointsDistribution.map((dist) => (
                    <div key={dist.range} className="flex items-center justify-between">
                      <span className="font-medium">{dist.range} points</span>
                      <div className="flex items-center gap-4">
                        <span>{dist.count} clients</span>
                        <div className="w-32">
                          <Progress 
                            value={(dist.count / stats.totalCustomers) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement 
              {itemToDelete?.type === 'customer' ? ' ce client' : ' cette récompense'} 
              du système de fidélité.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}