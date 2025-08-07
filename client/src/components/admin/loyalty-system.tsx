import React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, Star, TrendingUp, Award, Users, Plus, Edit, Crown
} from 'lucide-react';

interface LoyaltyCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  points: number;
  totalSpent: number;
  level: string;
  joinDate: string;
}

interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  isActive: boolean;
}

interface LoyaltyStats {
  totalCustomers: number;
  totalPointsIssued: number;
  totalRewardsRedeemed: number;
  averagePointsPerCustomer: number;
  levelDistribution: { [key: string]: number };
}

export default function LoyaltySystem() : JSX.Element {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [customersRes, rewardsRes, statsRes] = await Promise.all([
        fetch('/api/admin/loyalty/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })]),
        fetch('/api/admin/loyalty/rewards', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/loyalty/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (customersRes.ok && rewardsRes.ok && statsRes.ok) {
        const [customersData, rewardsData, statsData] = await Promise.all([
          customersRes.json()]),
          rewardsRes.json(),
          statsRes.json()
        ]);
        
        // Assurer que les données numériques sont correctement formatées
        const processedCustomers = (customersData || []).map((customer: { id: number; firstName: string; lastName: string; email: string; points: number | string; totalSpent: number | string }) => ({
          ...customer,
          points: Number(customer.points) || 0,
          totalSpent: Number(customer.totalSpent) || 0
        });
        
        const processedStats = statsData ? {
          ...statsData,
          totalCustomers: Number(statsData.totalCustomers) || 0,
          totalPointsIssued: Number(statsData.totalPointsIssued) || 0,
          totalRewardsRedeemed: Number(statsData.totalRewardsRedeemed) || 0,
          averagePointsPerCustomer: Number(statsData.averagePointsPerCustomer) || 0
        } : {
          totalCustomers: 0,
          totalPointsIssued: 0,
          totalRewardsRedeemed: 0,
          averagePointsPerCustomer: 0,
          levelDistribution: {}
        };
        
        setCustomers(processedCustomers);
        setRewards(rewardsData);
        setStats(processedStats);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du système de fidélité:', error);
      // Définir des valeurs par défaut en cas d'erreur
      setCustomers([]);
      setRewards([]);
      setStats({
        totalCustomers: 0,
        totalPointsIssued: 0,
        totalRewardsRedeemed: 0,
        averagePointsPerCustomer: 0,
        levelDistribution: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'VIP':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Fidèle':
        return 'bg-gold-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Régulier':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Nouveau':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'VIP':
        return <Crown className="h-4 w-4" />;
      case 'Fidèle':
        return <Award className="h-4 w-4" />;
      case 'Régulier':
        return <Star className="h-4 w-4" />;
      case 'Nouveau':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const awardPoints = async (customerId: number, points: number, reason: string) => {
    try {
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
        await fetchLoyaltyData();
      }
    } catch (error) {
      console.error('Erreur lors de l\'attribution des points:', error);
    }
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
            Système de Fidélité
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestion des points et récompenses clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {stats?.totalCustomers || 0} clients fidèles
          </span>
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
                    {stats.totalCustomers)}
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
                    {stats.totalRewardsRedeemed}
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
                            {customer.points} pts
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
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </h3>
                          <Badge className={getLevelColor(customer.level)}>
                            {getLevelIcon(customer.level)}
                            <span className="ml-1">{customer.level}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Points:</span>
                            <p className="font-bold text-purple-600">{customer.points}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Total dépensé:</span>
                            <p className="font-medium">{(customer.totalSpent || 0).toFixed(2)}€</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Email:</span>
                            <p className="font-medium truncate">{customer.email}</p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Membre depuis:</span>
                            <p className="font-medium">
                              {new Date(customer.joinDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Points"
                          className="w-24"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              const points = parseInt(target.value);
                              if (!isNaN(points) && points > 0) {
                                awardPoints(customer.id, points, 'Attribution manuelle');
                                target.value = '';
                              }
                            }
                          }}
                        />
                        <Button size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Récompenses Disponibles</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Récompense
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
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
                      <Badge variant="outline">{reward.category}</Badge>
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
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    <div className="flex items-center justify-between">
                      <span>Nouveau → Régulier</span>
                      <Badge variant="outline">100€</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Régulier → Fidèle</span>
                      <Badge variant="outline">500€</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Fidèle → VIP</span>
                      <Badge variant="outline">1000€</Badge>
                    </div>
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