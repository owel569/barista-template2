import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Star, Gift, Crown, Coffee, Calendar as CalendarIcon, Target, TrendingUp, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  }>;
  specialOffers: Array<{
    id: number;
    title: string;
    description: string;
    validUntil: string;
    pointsRequired: number;
  }>;
}

const AdvancedLoyalty: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: loyaltyProgram } = useQuery<LoyaltyProgram>({
    queryKey: ['/api/loyalty/program'],
  });

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ['/api/loyalty/rewards'],
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<LoyaltyMember[]>({
    queryKey: ['/api/loyalty/members'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/loyalty/stats'],
  });

  const createRewardMutation = useMutation({
    mutationFn: async (rewardData: Partial<LoyaltyReward>) => {
      const response = await fetch('/api/loyalty/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardData),
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/rewards'] });
      toast({ title: 'Récompense créée', description: 'La nouvelle récompense a été ajoutée.' });
    },
  });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ memberId, points, reason }: { memberId: number; points: number; reason: string }) => {
      const response = await fetch(`/api/loyalty/members/${memberId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, reason }),
      });
      if (!response.ok) throw new Error('Erreur lors de l\'attribution');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/members'] });
      toast({ title: 'Points attribués', description: 'Les points ont été ajoutés au compte du client.' });
    },
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Nouveau': return 'bg-gray-500';
      case 'Régulier': return 'bg-blue-500';
      case 'Fidèle': return 'bg-purple-500';
      case 'VIP': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'VIP': return <Crown className="w-4 h-4" />;
      case 'Fidèle': return <Star className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || member.currentLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Programme de Fidélité Avancé</h2>
          <p className="text-muted-foreground">Gérez les récompenses et engagez vos clients</p>
        </div>
        <Button className="bg-purple-500 hover:bg-purple-600">
          <Gift className="w-4 h-4 mr-2" />
          Nouvelle Récompense
        </Button>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats?.totalMembers || 0}</p>
            <p className="text-sm text-gray-500">Membres actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats?.totalPointsAwarded || 0}</p>
            <p className="text-sm text-gray-500">Points distribués</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats?.rewardsRedeemed || 0}</p>
            <p className="text-sm text-gray-500">Récompenses utilisées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats?.engagementRate || 0}%</p>
            <p className="text-sm text-gray-500">Taux d'engagement</p>
          </CardContent>
        </Card>
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
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="Nouveau">Nouveau</SelectItem>
                <SelectItem value="Régulier">Régulier</SelectItem>
                <SelectItem value="Fidèle">Fidèle</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{member.customerName}</CardTitle>
                    <Badge className={`${getLevelColor(member.currentLevel)} text-white`}>
                      {getLevelIcon(member.currentLevel)}
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
                      <span>{member.totalSpent.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Vers {member.nextLevel}</span>
                      <span>{member.pointsToNextLevel} pts</span>
                    </div>
                    <Progress 
                      value={(member.currentPoints / (member.currentPoints + member.pointsToNextLevel)) * 100} 
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
                      onClick={() => {
                        const points = prompt('Points à attribuer:');
                        const reason = prompt('Raison:');
                        if (points && reason) {
                          awardPointsMutation.mutate({ 
                            memberId: member.id, 
                            points: parseInt(points), 
                            reason 
                          });
                        }
                      }}
                    >
                      Ajouter Points
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Historique
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id} className={`relative ${!reward.available ? 'opacity-50' : ''}`}>
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
                      <span className="capitalize">{reward.type.replace('_', ' ')}</span>
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
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      variant={reward.available ? 'destructive' : 'default'} 
                      className="flex-1"
                    >
                      {reward.available ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

                <Button className="w-full bg-purple-500 hover:bg-purple-600">
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
                <div className="space-y-3">
                  {['Nouveau', 'Régulier', 'Fidèle', 'VIP'].map((level) => {
                    const count = members.filter(m => m.currentLevel === level).length;
                    const percentage = members.length > 0 ? (count / members.length) * 100 : 0;
                    
                    return (
                      <div key={level} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center">
                            {getLevelIcon(level)}
                            <span className="ml-2">{level}</span>
                          </span>
                          <span>{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques d'Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Taux de rétention</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points moyens par membre</span>
                    <span className="font-bold">{Math.round(members.reduce((acc, m) => acc + m.currentPoints, 0) / (members.length || 1))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dépense moyenne</span>
                    <span className="font-bold">{(members.reduce((acc, m) => acc + m.totalSpent, 0) / (members.length || 1)).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fréquence de visite</span>
                    <span className="font-bold">2.3x/mois</span>
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

export default AdvancedLoyalty;