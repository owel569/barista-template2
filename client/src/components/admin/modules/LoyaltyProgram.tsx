import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Crown, 
  Star, 
  Gift, 
  Users, 
  TrendingUp, 
  Award, 
  Plus,
  Search,
  Target,
  BarChart3,
  Zap,
  Heart,
  Coffee
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Définition des types stricts pour la logique métier Loyalty
interface LoyaltyLevel {
  name: string;
  color: string;
  minPoints: number;
  pointsRate: number;
  benefits: string[];
}
interface LoyaltyReward {
  name: string;
  category: string;
  cost: number;
}
interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  pointsRedeemed: number;
  averageLifetimeValue: number;
}
interface LoyaltyAnalytics {
  levels?: Record<string, { count: number; percentage: number }>;
  engagement?: { redemptionRate: number; averagePointsPerCustomer: number };
  revenue?: { roi: number; averageOrderValue: number; fromLoyalMembers?: number };
  overview?: { retentionRate: number; newMembers: number };
}
interface LoyaltyProgramData {
  levels: LoyaltyLevel[];
  rewards: LoyaltyReward[];
  statistics: LoyaltyStats;
}

const LoyaltyProgram = () => {
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const queryClient = useQueryClient();

  // Récupérer l'aperçu du programme
  const { data: program, isLoading } = useQuery<LoyaltyProgramData>({
    queryKey: ['/api/admin/loyalty/program/overview']
  });

  // Récupérer les analytics du programme
  const { data: programAnalytics } = useQuery<LoyaltyAnalytics>({
    queryKey: ['/api/admin/loyalty/analytics']
  });

  // Correction de la mutation pour ajouter des points
  const addPointsMutation = useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const response = await fetch('/api/admin/loyalty/points/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
        },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ajout de points');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty'] });
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement programme fidélité...</p>
        </div>
      </div>
    );
  }

  const levels = program?.levels || [];
  const rewards = program?.rewards || [];
  const stats = program?.statistics || { totalMembers: 0, activeMembers: 0, pointsRedeemed: 0, averageLifetimeValue: 0 };
  const analytics = programAnalytics || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Programme de Fidélité</h1>
          <p className="text-gray-600">Gestion avancée avec niveaux et récompenses personnalisées</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle campagne
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une campagne de fidélité</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Nom de la campagne" />
                <Input placeholder="Description" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau cible" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Argent</SelectItem>
                    <SelectItem value="gold">Or</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">Annuler</Button>
                  <Button className="flex-1">Créer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.activeMembers || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points échangés</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pointsRedeemed?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur vie client</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageLifetimeValue || 0}€</div>
            <p className="text-xs text-muted-foreground">
              Moyenne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux engagement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <Progress value={78} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="levels">Niveaux</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Répartition par niveau
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {levels.map((level: LoyaltyLevel, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: level.color }}
                          ></div>
                          <span className="font-medium">{level.name}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {analytics?.levels?.[level.name.toLowerCase()]?.count || 0} membres
                        </span>
                      </div>
                      <Progress 
                        value={analytics?.levels?.[level.name.toLowerCase()]?.percentage || 0}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Engagement récent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Taux de rachat</span>
                    <Badge variant="outline" className="text-green-600">
                      {analytics?.engagement?.redemptionRate || 45}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Points moyens/client</span>
                    <span className="font-medium">
                      {analytics?.engagement?.averagePointsPerCustomer || 250}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI programme</span>
                    <Badge variant="outline" className="text-green-600">
                      +{analytics?.revenue?.roi || 180}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Panier moyen VIP</span>
                    <span className="font-medium">
                      {analytics?.revenue?.averageOrderValue?.toFixed(2) || '0'}€
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <Gift className="h-6 w-6 mb-2" />
                  <span className="text-xs">Ajouter Points</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Star className="h-6 w-6 mb-2" />
                  <span className="text-xs">Nouvelle Récompense</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-xs">Campagne Ciblée</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Award className="h-6 w-6 mb-2" />
                  <span className="text-xs">Événement VIP</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levels.map((level: LoyaltyLevel, index: number) => (
              <Card key={index} className="border-2" style={{ borderColor: `${level.color}40` }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" style={{ color: level.color }} />
                    Niveau {level.name}
                    <Badge variant="outline" style={{ color: level.color }}>
                      {level.pointsRate}x points
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        À partir de {level.minPoints} points
                      </div>
                      <div className="text-xs text-gray-500">
                        Membres actuels: {analytics?.levels?.[level.name.toLowerCase()]?.count || 0}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Avantages :</h4>
                      <ul className="space-y-1">
                        {level.benefits?.map((benefit: string, benefitIndex: number) => (
                          <li key={benefitIndex} className="text-sm flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Catalogue des récompenses</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle récompense
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rewards.map((reward: LoyaltyReward, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {reward.category === 'boisson' && <Coffee className="h-4 w-4" />}
                      {reward.category === 'dessert' && <Gift className="h-4 w-4" />}
                      {reward.category === 'repas' && <Star className="h-4 w-4" />}
                      {reward.category === 'experience' && <Crown className="h-4 w-4" />}
                      {reward.name}
                    </span>
                    <Badge variant="outline">
                      {reward.cost} pts
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      Catégorie: {reward.category}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Popularité:</span>
                      <div className="flex items-center gap-1">
                        <Progress value={75} className="w-16" />
                        <span className="text-xs">75%</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full">
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {/* Filtres de recherche */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un membre..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Argent</SelectItem>
                <SelectItem value="gold">Or</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Membres du programme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Exemple de membres - à remplacer par vraies données */}
                {[
                  { name: 'Marie Dupont', level: 'Or', points: 2150, visits: 45, spent: 680 },
                  { name: 'Jean Martin', level: 'Argent', points: 890, visits: 22, spent: 340 },
                  { name: 'Sophie Bernard', level: 'Platinum', points: 4500, visits: 78, spent: 1250 },
                  { name: 'Pierre Leclerc', level: 'Bronze', points: 320, visits: 12, spent: 180 }
                ].map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">
                          {member.visits} visites • {member.spent}€ dépensé
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        member.level === 'Platinum' ? 'border-gray-400' :
                        member.level === 'Or' ? 'border-yellow-400' :
                        member.level === 'Argent' ? 'border-gray-300' : 'border-amber-600'
                      }>
                        {member.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{member.points} pts</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance programme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Taux de rétention</span>
                    <Badge variant="outline" className="text-green-600">
                      {analytics?.overview?.retentionRate || 78}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Nouveaux membres (mois)</span>
                    <span className="font-medium">
                      +{analytics?.overview?.newMembers || 24}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenus membres fidèles</span>
                    <span className="font-medium">
                      {analytics?.revenue?.fromLoyalMembers?.toLocaleString() || '0'}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROI programme</span>
                    <Badge variant="outline" className="text-green-600">
                      +{analytics?.revenue?.roi || 180}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Croissance membres</span>
                      <span className="text-green-600">+15%</span>
                    </div>
                    <Progress value={15} className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Engagement</span>
                      <span className="text-green-600">+8%</span>
                    </div>
                    <Progress value={8} className="w-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Revenus fidélité</span>
                      <span className="text-green-600">+22%</span>
                    </div>
                    <Progress value={22} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoyaltyProgram;