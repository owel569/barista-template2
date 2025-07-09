import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Gift, 
  TrendingUp, 
  Award,
  Plus,
  Edit,
  Search,
  Filter,
  Crown,
  Heart,
  Users,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LoyaltyCustomer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  totalSpent: string | number;
  totalOrders: number;
  loyaltyPoints: number;
  loyaltyLevel: 'Nouveau' | 'Régulier' | 'Fidèle' | 'VIP';
  joinDate: string;
  lastVisit: string;
  nextRewardThreshold: number;
  rewards: LoyaltyReward[];
}

interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_item' | 'upgrade' | 'gift';
  value: number;
  isActive: boolean;
  validUntil?: string;
  minLevel?: string;
}

interface LoyaltyStats {
  totalCustomers: number;
  activeMembers: number;
  totalPointsIssued: number;
  totalRewardsRedeemed: number;
  averageOrderValue: number;
  retentionRate: number;
  levelDistribution: {
    level: string;
    count: number;
    percentage: number;
  }[];
}

interface LoyaltySystemProps {
  userRole?: 'directeur' | 'employe';
}

export default function LoyaltySystem({ userRole = 'directeur' }: LoyaltySystemProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isAddRewardDialogOpen, setIsAddRewardDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États pour le formulaire de récompense
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsCost: '',
    type: 'discount',
    value: '',
    validUntil: '',
    minLevel: 'Nouveau'
  });

  // Récupérer les données
  const { data: loyaltyCustomers = [] } = useQuery<LoyaltyCustomer[]>({
    queryKey: ['/api/admin/loyalty/customers'],
  });

  const { data: loyaltyRewards = [] } = useQuery<LoyaltyReward[]>({
    queryKey: ['/api/admin/loyalty/rewards'],
  });

  const { data: loyaltyStats } = useQuery<LoyaltyStats>({
    queryKey: ['/api/admin/loyalty/stats'],
  });

  // Mutations
  const awardPointsMutation = useMutation({
    mutationFn: async ({ customerId, points, reason }: { customerId: number; points: number; reason: string }) => {
      return await apiRequest(`/api/admin/loyalty/award-points`, 'POST', { customerId, points, reason });
    },
    onSuccess: () => {
      toast({
        title: "Points attribués",
        description: "Les points de fidélité ont été attribués avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer les points.",
        variant: "destructive",
      });
    }
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async ({ customerId, rewardId }: { customerId: number; rewardId: number }) => {
      return await apiRequest(`/api/admin/loyalty/redeem-reward`, 'POST', { customerId, rewardId });
    },
    onSuccess: () => {
      toast({
        title: "Récompense échangée",
        description: "La récompense a été échangée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'échanger la récompense.",
        variant: "destructive",
      });
    }
  });

  const addRewardMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/admin/loyalty/rewards', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Récompense ajoutée",
        description: "La récompense a été ajoutée avec succès.",
      });
      setIsAddRewardDialogOpen(false);
      setRewardForm({
        name: '',
        description: '',
        pointsCost: '',
        type: 'discount',
        value: '',
        validUntil: '',
        minLevel: 'Nouveau'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty'] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la récompense.",
        variant: "destructive",
      });
    }
  });

  // Filtrage des clients
  const filteredCustomers = loyaltyCustomers.filter(customer => {
    const matchesSearch = customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || customer.loyaltyLevel === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'VIP': return <Crown className="h-4 w-4" />;
      case 'Fidèle': return <Heart className="h-4 w-4" />;
      case 'Régulier': return <Star className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'VIP': return 'bg-purple-100 text-purple-800';
      case 'Fidèle': return 'bg-gold-100 text-gold-800';
      case 'Régulier': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return <TrendingUp className="h-4 w-4" />;
      case 'free_item': return <Gift className="h-4 w-4" />;
      case 'upgrade': return <Award className="h-4 w-4" />;
      case 'gift': return <Star className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...rewardForm,
      pointsCost: parseInt(rewardForm.pointsCost),
      value: parseFloat(rewardForm.value),
      validUntil: rewardForm.validUntil || undefined,
      isActive: true
    };
    addRewardMutation.mutate(submitData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-600" />
          <h1 className="text-2xl font-bold">Système de Fidélité</h1>
        </div>
        <Button onClick={() => setIsAddRewardDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle récompense
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total clients</p>
                    <p className="text-2xl font-bold">{loyaltyStats?.totalCustomers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Membres actifs</p>
                    <p className="text-2xl font-bold text-green-600">{loyaltyStats?.activeMembers || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Points émis</p>
                    <p className="text-2xl font-bold text-yellow-600">{loyaltyStats?.totalPointsIssued || 0}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Récompenses échangées</p>
                    <p className="text-2xl font-bold text-purple-600">{loyaltyStats?.totalRewardsRedeemed || 0}</p>
                  </div>
                  <Gift className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution des niveaux */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution des niveaux de fidélité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loyaltyStats?.levelDistribution?.map(level => (
                  <div key={level.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(level.level)}
                      <span className="font-medium">{level.level}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <Progress value={level.percentage} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-600 min-w-16">
                        {level.count} ({level.percentage}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Fidèle">Fidèle</SelectItem>
                    <SelectItem value="Régulier">Régulier</SelectItem>
                    <SelectItem value="Nouveau">Nouveau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des clients */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Total dépensé</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Dernière visite</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(customer.loyaltyLevel)}>
                          {getLevelIcon(customer.loyaltyLevel)}
                          <span className="ml-1">{customer.loyaltyLevel}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="text-lg font-bold text-yellow-600">{customer.loyaltyPoints}</div>
                          <div className="text-xs text-gray-500">
                            {customer.nextRewardThreshold - customer.loyaltyPoints} pour le prochain niveau
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{typeof customer.totalSpent === 'number' ? customer.totalSpent.toFixed(2) : parseFloat(customer.totalSpent || '0').toFixed(2)}€</TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell>{new Date(customer.lastVisit).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const points = prompt('Nombre de points à attribuer:');
                              if (points) {
                                awardPointsMutation.mutate({
                                  customerId: customer.id,
                                  points: parseInt(points),
                                  reason: 'Attribution manuelle'
                                });
                              }
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsRewardDialogOpen(true);
                            }}
                          >
                            <Gift className="h-3 w-3" />
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

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Récompenses disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loyaltyRewards.map(reward => (
                  <Card key={reward.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getRewardTypeIcon(reward.type)}
                          <h3 className="font-bold">{reward.name}</h3>
                        </div>
                        <Badge variant={reward.isActive ? "default" : "secondary"}>
                          {reward.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{reward.pointsCost} points</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {reward.value}{reward.type === 'discount' ? '%' : '€'}
                        </span>
                      </div>
                      {reward.minLevel && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Niveau min: {reward.minLevel}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Métriques de fidélité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Taux de rétention</span>
                    <span className="font-bold">{loyaltyStats?.retentionRate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Panier moyen</span>
                    <span className="font-bold">{loyaltyStats?.averageOrderValue || 0}€</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Points par euro dépensé</span>
                    <span className="font-bold">1 point / 10€</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progression des niveaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Nouveau → Régulier</span>
                    <span className="font-bold">100 points</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Régulier → Fidèle</span>
                    <span className="font-bold">500 points</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fidèle → VIP</span>
                    <span className="font-bold">1000 points</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog d'ajout de récompense */}
      <Dialog open={isAddRewardDialogOpen} onOpenChange={setIsAddRewardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter une récompense</DialogTitle>
            <DialogDescription>
              Créez une nouvelle récompense pour le système de fidélité
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddReward} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward-name">Nom *</Label>
                <Input
                  id="reward-name"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-type">Type *</Label>
                <Select value={rewardForm.type} onValueChange={(value) => setRewardForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Réduction</SelectItem>
                    <SelectItem value="free_item">Article gratuit</SelectItem>
                    <SelectItem value="upgrade">Amélioration</SelectItem>
                    <SelectItem value="gift">Cadeau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reward-description">Description *</Label>
              <Input
                id="reward-description"
                value={rewardForm.description}
                onChange={(e) => setRewardForm(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reward-cost">Coût en points *</Label>
                <Input
                  id="reward-cost"
                  type="number"
                  value={rewardForm.pointsCost}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, pointsCost: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-value">Valeur *</Label>
                <Input
                  id="reward-value"
                  type="number"
                  step="0.01"
                  value={rewardForm.value}
                  onChange={(e) => setRewardForm(prev => ({ ...prev, value: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-level">Niveau minimum</Label>
                <Select value={rewardForm.minLevel} onValueChange={(value) => setRewardForm(prev => ({ ...prev, minLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nouveau">Nouveau</SelectItem>
                    <SelectItem value="Régulier">Régulier</SelectItem>
                    <SelectItem value="Fidèle">Fidèle</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward-valid">Valide jusqu'à (optionnel)</Label>
              <Input
                id="reward-valid"
                type="date"
                value={rewardForm.validUntil}
                onChange={(e) => setRewardForm(prev => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddRewardDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={addRewardMutation.isPending}>
                Ajouter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog d'échange de récompense */}
      <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Échanger une récompense</DialogTitle>
            <DialogDescription>
              {selectedCustomer && `Client: ${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.loyaltyPoints} points)`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {loyaltyRewards
              .filter(reward => reward.isActive && (!selectedCustomer || selectedCustomer.loyaltyPoints >= reward.pointsCost))
              .map(reward => (
                <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRewardTypeIcon(reward.type)}
                    <div>
                      <p className="font-medium">{reward.name}</p>
                      <p className="text-sm text-gray-500">{reward.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{reward.pointsCost} points</Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedCustomer) {
                          redeemRewardMutation.mutate({
                            customerId: selectedCustomer.id,
                            rewardId: reward.id
                          });
                        }
                      }}
                    >
                      Échanger
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}