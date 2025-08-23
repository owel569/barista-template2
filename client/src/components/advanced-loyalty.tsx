import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Star, Gift, Crown, Coffee, Calendar as CalendarIcon, Target, TrendingUp, Users, Plus, Search, Edit, History, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_item' | 'special_offer';
  value: number;
  category: string;
  available: boolean;
  expiryDate?: string;
  usageCount: number;
  maxUsage?: number;
  imageUrl?: string;
}

interface LoyaltyMember {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  currentPoints: number;
  totalPointsEarned: number;
  currentLevel: string;
  nextLevel: string;
  pointsToNextLevel: number;
  totalSpent: number;
  joinDate: string;
  lastActivity: string;
  rewardsUsed: number;
  referrals: number;
  favoriteCategory?: string;
}

interface LoyaltyProgram {
  id: number;
  name: string;
  description: string;
  pointsPerEuro: number;
  levels: Array<{
    name: string;
    minPoints: number;
    benefits: string[];
    color: string;
    icon: string;
  }>;
  specialOffers: Array<{
    id: number;
    title: string;
    description: string;
    validUntil: string;
    pointsRequired: number;
  }>;
}

interface LoyaltyStats {
  totalMembers: number;
  activeMembers: number;
  totalPointsAwarded: number;
  rewardsRedeemed: number;
  engagementRate: number;
  averagePoints: number;
  averageSpend: number;
  levelDistribution: Record<string, number>;
  rewardPopularity: Array<{
    rewardId: number;
    rewardName: string;
    redemptionCount: number;
  }>;
}

const AdvancedLoyalty: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newRewardDialogOpen, setNewRewardDialogOpen] = useState(false);
  const [newRewardData, setNewRewardData] = useState<Partial<LoyaltyReward>>({
    available: true,
    type: 'discount',
  });

  // Fetch data with proper error handling
  const { data: loyaltyProgram, isLoading: programLoading } = useQuery<LoyaltyProgram>({
    queryKey: ['loyaltyProgram'],
    queryFn: async () => {
      const response = await fetch('/api/loyalty/program');
      if (!response.ok) throw new Error('Failed to fetch loyalty program');
      return response.json();
    },
  });

  const { data: rewards = [], isLoading: rewardsLoading, error: rewardsError } = useQuery<LoyaltyReward[]>({
    queryKey: ['loyaltyRewards'],
    queryFn: async () => {
      const response = await fetch('/api/loyalty/rewards');
      if (!response.ok) throw new Error('Failed to fetch rewards');
      return response.json();
    },
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<LoyaltyMember[]>({
    queryKey: ['loyaltyMembers'],
    queryFn: async () => {
      const response = await fetch('/api/loyalty/members');
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
  });

  const { data: stats } = useQuery<LoyaltyStats>({
    queryKey: ['loyaltyStats'],
    queryFn: async () => {
      const response = await fetch('/api/loyalty/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Create reward mutation with better error handling
  const createRewardMutation = useMutation({
    mutationFn: async (rewardData: Partial<LoyaltyReward>) => {
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reward');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyRewards'] });
      toast({
        title: 'Récompense créée',
        description: 'La nouvelle récompense a été ajoutée avec succès.',
        variant: 'success',
      });
      setNewRewardDialogOpen(false);
      setNewRewardData({ available: true, type: 'discount' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la récompense',
        variant: 'destructive',
      });
    },
  });

  // Award points mutation with validation
  const awardPointsMutation = useMutation({
    mutationFn: async ({ memberId, points, reason }: { memberId: number; points: number; reason: string }) => {
      if (points <= 0) throw new Error('Le nombre de points doit être positif');

      const response = await fetch(`/api/loyalty/members/${memberId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to award points');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyMembers'] });
      toast({
        title: 'Points attribués',
        description: 'Les points ont été ajoutés au compte du client avec succès.',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de l\'attribution des points',
        variant: 'destructive',
      });
    },
  });

  // Toggle reward availability
  const toggleRewardMutation = useMutation({
    mutationFn: async ({ rewardId, available }: { rewardId: number; available: boolean }) => {
      const response = await fetch(`/api/loyalty/rewards/${rewardId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available }),
      });
      if (!response.ok) throw new Error('Failed to toggle reward');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyRewards'] });
      toast({
        title: 'Statut mis à jour',
        description: 'La disponibilité de la récompense a été modifiée.',
        variant: 'success',
      });
    },
  });

  // Get level color and icon from program data if available
  const getLevelInfo = (level: string) => {
    const levelData = loyaltyProgram?.levels.find(l => l.name === level);
    return {
      color: levelData?.color || 'bg-gray-500',
      icon: levelData?.icon === 'crown' ? <Crown className="w-4 h-4" /> :
            levelData?.icon === 'star' ? <Star className="w-4 h-4" /> :
            <Coffee className="w-4 h-4" />
    };
  };

  // Filter members with memoization for better performance
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.customerName.toLowerCase().includes(searchTerm.toLowerCase();||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase();
      const matchesLevel = filterLevel === 'all' || member.currentLevel === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [members, searchTerm, filterLevel]);

  // Handle reward creation form submission
  const handleCreateReward = () => {
    if (!newRewardData.name || !newRewardData.description || !newRewardData.pointsCost) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }
    createRewardMutation.mutate(newRewardData);
  };

  // Handle awarding points to a member
  const handleAwardPoints = (memberId: number) => {
    const points = prompt('Points à attribuer:');
    if (!points || isNaN(parseInt(points);{
      toast({
        title: 'Valeur invalide',
        description: 'Veuillez entrer un nombre valide de points',
        variant: 'destructive',
      });
      return;
    }
    const reason = prompt('Raison (facultatif):') || 'Points bonus';
    awardPointsMutation.mutate({ 
      memberId, 
      points: parseInt(points), 
      reason 
    });
  };

  // Loading skeleton for cards
  const renderLoadingSkeletons = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
      <Card key={index}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programme de Fidélité Avancé</h2>
          <p className="text-muted-foreground">
            Gérez les récompenses, les membres et analysez l'engagement
          </p>
        </div>
        <Dialog open={newRewardDialogOpen} onOpenChange={setNewRewardDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Récompense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle récompense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label>Nom de la récompense</label>
                <Input
                  placeholder="Café gratuit"
                  value={newRewardData.name || ''}
                  onChange={(e) => setNewRewardData({...newRewardData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label>Description</label>
                <Input
                  placeholder="Description de la récompense..."
                  value={newRewardData.description || ''}
                  onChange={(e) => setNewRewardData({...newRewardData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Coût en points</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newRewardData.pointsCost || ''}
                    onChange={(e) => setNewRewardData({...newRewardData, pointsCost: parseInt(e.target.value) || undefined})}
                  />
                </div>
                <div className="space-y-2">
                  <label>Type</label>
                  <Select
                    value={newRewardData.type}
                    onValueChange={(value) => setNewRewardData({...newRewardData, type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Réduction</SelectItem>
                      <SelectItem value="free_item">Article gratuit</SelectItem>
                      <SelectItem value="special_offer">Offre spéciale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label>Catégorie</label>
                <Input
                  placeholder="Café, Nourriture, etc."
                  value={newRewardData.category || ''}
                  onChange={(e) => setNewRewardData({...newRewardData, category: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={newRewardData.available || false}
                  onChange={(e) => setNewRewardData({...newRewardData, available: e.target.checked})}
                />
                <label htmlFor="available">Disponible immédiatement</label>
              </div>
              <Button 
                onClick={handleCreateReward}
                disabled={createRewardMutation.isPending}
                className="w-full"
              >
                {createRewardMutation.isPending ? 'Création...' : 'Créer la récompense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats ? (
          <>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-sm text-gray-500">Membres actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{stats.totalPointsAwarded}</p>
                <p className="text-sm text-gray-500">Points distribués</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Gift className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{stats.rewardsRedeemed}</p>
                <p className="text-sm text-gray-500">Récompenses utilisées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats.engagementRate}%</p>
                <p className="text-sm text-gray-500">Taux d'engagement</p>
              </CardContent>
            </Card>
          </>
        ) : (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <Skeleton className="w-8 h-8 mx-auto mb-2" />
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </CardContent>
            </Card>
          );}
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value}
                className="pl-9"
              />
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {loyaltyProgram?.levels.map(level => (
                  <SelectItem key={level.name} value={level.name}>{level.name}</SelectItem>
                );}
              </SelectContent>
            </Select>
          </div>

          {membersLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {renderLoadingSkeletons(6}
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Aucun membre trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => {
                const levelInfo = getLevelInfo(member.currentLevel);
                return (
                  <Card key={member.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{member.customerName}</CardTitle>
                        <Badge className={`${levelInfo.color} text-white`}>
                          {levelInfo.icon}
                          <span className="ml-1">{member.currentLevel}</span>
                        </Badge>
                      </div>
                      <CardDescription>{member.email}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Points actuels</span>
                          <span className="font-bold text-purple-600">{member.currentPoints}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total dépensé</span>
                          <span>{member.totalSpent.toFixed(2}€</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vers {member.nextLevel}</span>
                          <span>{member.pointsToNextLevel} pts</span>
                        </div>
                        <Progress 
                          value={(member.currentPoints / (member.currentPoints + member.pointsToNextLevel);* 100} 
                          className="h-2" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-sm">
                        <div>
                          <p className="font-medium">{member.rewardsUsed}</p>
                          <p className="text-gray-500">Récompenses</p>
                        </div>
                        <div>
                          <p className="font-medium">{member.referrals}</p>
                          <p className="text-gray-500">Parrainages</p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleAwardPoints(member.id}
                          disabled={awardPointsMutation.isPending}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Ajouter Points
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <History className="w-4 h-4 mr-2" />
                          Historique
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          {rewardsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {renderLoadingSkeletons(6}
            </div>
          ) : rewardsError ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-destructive">Erreur lors du chargement des récompenses</p>
              </CardContent>
            </Card>
          ) : rewards.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Aucune récompense disponible</p>
                <Button 
                  className="mt-4" 
                  onClick={() => setNewRewardDialogOpen(true}
                >
                  Créer une récompense
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                  <Card key={reward.id} className={`relative ${!reward.available ? 'opacity-70' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <Badge variant={reward.available ? 'default' : 'secondary'}>
                          {reward.pointsCost} pts
                        </Badge>
                      </div>
                      <CardDescription>{reward.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Type</span>
                          <span className="capitalize">{reward.type.replace('_', ' '}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Utilisé</span>
                          <span>{reward.usageCount} fois</span>
                        </div>
                        {reward.maxUsage && (
                          <div className="flex justify-between text-sm">
                            <span>Limite</span>
                            <span>{reward.maxUsage} max</span>
                          </div>
                        )}
                        {reward.expiryDate && (
                          <div className="flex justify-between text-sm">
                            <span>Expire</span>
                            <span>{format(new Date(reward.expiryDate), 'dd/MM/yyyy', { locale: fr })}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant={reward.available ? 'destructive' : 'default'} 
                          className="flex-1"
                          onClick={() => toggleRewardMutation.mutate({ 
                            rewardId: reward.id, 
                            available: !reward.available 
                          })}
                          disabled={toggleRewardMutation.isPending}
                        >
                          {reward.available ? 'Désactiver' : 'Activer'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campagnes de Fidélité</CardTitle>
              <CardDescription>Créez et gérez vos campagnes promotionnelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom de la campagne</label>
                    <Input placeholder="Ex: Double Points Weekend" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type de campagne</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="double_points">Points doublés</SelectItem>
                        <SelectItem value="bonus_reward">Récompense bonus</SelectItem>
                        <SelectItem value="special_offer">Offre spéciale</SelectItem>
                        <SelectItem value="referral">Programme de parrainage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date de début</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner une date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Durée (jours)</label>
                    <Input type="number" placeholder="7" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input placeholder="Décrivez votre campagne..." />
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Target className="w-4 h-4 mr-2" />
                  Lancer la Campagne
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Niveaux</CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-3">
                    {loyaltyProgram?.levels.map((level) => {
                      const count = stats.levelDistribution[level.name] || 0;
                      const percentage = members.length > 0 ? (count / members.length) * 100 : 0;

                      return (
                        <div key={level.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center">
                              {level.icon === 'crown' ? <Crown className="w-4 h-4" /> :
                               level.icon === 'star' ? <Star className="w-4 h-4" /> :
                               <Coffee className="w-4 h-4" />}
                              <span className="ml-2">{level.name}</span>
                            </span>
                            <span>{count} ({percentage.toFixed(0}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    );}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques d'Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Taux de rétention</span>
                      <span className="font-bold text-green-600">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points moyens par membre</span>
                      <span className="font-bold">{stats.averagePoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dépense moyenne</span>
                      <span className="font-bold">{stats.averageSpend.toFixed(2}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fréquence de visite</span>
                      <span className="font-bold">2.3x/mois</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    );}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Popularité des Récompenses</CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Récompense</TableHead>
                      <TableHead>Rédemptions</TableHead>
                      <TableHead>Taux d'utilisation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.rewardPopularity.map((reward) => (
                      <TableRow key={reward.rewardId}>
                        <TableCell>{reward.rewardName}</TableCell>
                        <TableCell>{reward.redemptionCount}</TableCell>
                        <TableCell>
                          {members.length > 0 
                            ? `${((reward.redemptionCount / members.length) * 100).toFixed(1}%` 
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    );}
                  </TableBody>
                </Table>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  );}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedLoyalty;