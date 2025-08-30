import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Star, CheckCircle, AlertTriangle, XCircle, TrendingUp, 
  FileText, Camera, Clock, User, Coffee, Utensils, 
  Shield, Award, Target, BarChart3, Eye, ThumbsUp, Plus,
  ChevronUp, ChevronDown, Download, Upload, Filter, Search
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DatePicker } from '@/components/ui/date-picker';

interface QualityCheck {
  id: number;
  date: string;
  category: string;
  item: string;
  inspector: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
  notes: string;
  correctionActions: string[];
  photos?: string[];
  completed?: boolean;
}

interface QualityStandard {
  id: number;
  category: string;
  name: string;
  description: string;
  criteria: QualityCriteria[];
  weight: number;
}

interface QualityCriteria {
  id: number;
  name: string;
  description: string;
  weight: number;
  acceptable: string;
  excellent: string;
}

interface CategoryStats {
  category: string;
  avgScore: number;
  checksCount: number;
  trend: 'up' | 'down';
}

export default function QualityControl(): JSX.Element {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [standards, setStandards] = useState<QualityStandard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newCheck, setNewCheck] = useState<Partial<QualityCheck>>({
    category: 'Produits',
    status: 'good'
  });
  const [showNewCheckForm, setShowNewCheckForm] = useState(false);

  useEffect(() => {
    fetchQualityData();
    fetchStandards();
  }, [timeRange]);

  const fetchQualityData = async () => {
    setIsLoading(true);
    try {
      // Simulation de données de contrôle qualité
      const mockChecks: QualityCheck[] = [
        {
          id: 1,
          date: new Date().toISOString(),
          category: 'Produits',
          item: 'Cappuccino Premium',
          inspector: 'Marie Dubois',
          score: 95,
          maxScore: 100,
          status: 'excellent',
          notes: 'Excellente mousse de lait, température parfaite, présentation soignée',
          correctionActions: [],
          photos: ['photo1.jpg'],
          completed: true
        },
        {
          id: 2,
          date: new Date(Date.now() - 86400000).toISOString(),
          category: 'Service',
          item: 'Accueil client',
          inspector: 'Pierre Martin',
          score: 78,
          maxScore: 100,
          status: 'good',
          notes: 'Bon accueil mais temps d\'attente un peu long',
          correctionActions: ['Optimiser les temps de préparation', 'Formation sur l\'efficacité'],
          photos: [],
          completed: false
        },
        {
          id: 3,
          date: new Date(Date.now() - 172800000).toISOString(),
          category: 'Hygiène',
          item: 'Propreté zone bar',
          inspector: 'Sophie Laurent',
          score: 65,
          maxScore: 100,
          status: 'average',
          notes: 'Quelques traces sur la machine à café, plan de travail à nettoyer',
          correctionActions: ['Nettoyage immédiat', 'Renforcer protocole hygiène'],
          photos: ['hygiene1.jpg', 'hygiene2.jpg'],
          completed: false
        },
        {
          id: 4,
          date: new Date(Date.now() - 259200000).toISOString(),
          category: 'Produits',
          item: 'Croissant aux amandes',
          inspector: 'Jean Dupont',
          score: 88,
          maxScore: 100,
          status: 'good',
          notes: 'Bonne cuisson mais pourrait être plus croustillant',
          correctionActions: ['Vérifier temps de cuisson'],
          photos: [],
          completed: true
        }
      ];
      setQualityChecks(mockChecks);
    } catch (error) {
      console.error('Erreur chargement données qualité:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de contrôle qualité',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStandards = async () => {
    try {
      const mockStandards: QualityStandard[] = [
        {
          id: 1,
          category: 'Produits',
          name: 'Qualité des boissons chaudes',
          description: 'Standards de qualité pour toutes les boissons chaudes',
          weight: 35,
          criteria: [
            {
              id: 1,
              name: 'Température',
              description: 'Température de service appropriée',
              weight: 25,
              acceptable: '65-75°C',
              excellent: '68-72°C'
            },
            {
              id: 2,
              name: 'Présentation',
              description: 'Aspect visuel et propreté de la tasse',
              weight: 20,
              acceptable: 'Correct',
              excellent: 'Impeccable avec latte art'
            },
            {
              id: 3,
              name: 'Goût',
              description: 'Équilibre et qualité gustative',
              weight: 30,
              acceptable: 'Bon',
              excellent: 'Exceptionnel'
            },
            {
              id: 4,
              name: 'Consistance',
              description: 'Mousse et texture appropriées',
              weight: 25,
              acceptable: 'Correcte',
              excellent: 'Parfaite densité et onctuosité'
            }
          ]
        },
        {
          id: 2,
          category: 'Service',
          name: 'Qualité du service client',
          description: 'Standards d\'accueil et de service',
          weight: 30,
          criteria: [
            {
              id: 5,
              name: 'Temps d\'attente',
              description: 'Délai de prise de commande et service',
              weight: 30,
              acceptable: '< 5 minutes',
              excellent: '< 2 minutes'
            },
            {
              id: 6,
              name: 'Courtoisie',
              description: 'Politesse et amabilité du personnel',
              weight: 25,
              acceptable: 'Poli',
              excellent: 'Chaleureux et attentionné'
            },
            {
              id: 7,
              name: 'Connaissances',
              description: 'Maîtrise du menu et recommandations',
              weight: 25,
              acceptable: 'Basique',
              excellent: 'Expert avec conseils personnalisés'
            },
            {
              id: 8,
              name: 'Résolution problèmes',
              description: 'Gestion des réclamations et problèmes',
              weight: 20,
              acceptable: 'Correcte',
              excellent: 'Proactive et efficace'
            }
          ]
        },
        {
          id: 3,
          category: 'Hygiène',
          name: 'Standards d\'hygiène et propreté',
          description: 'Normes de propreté et d\'hygiène',
          weight: 25,
          criteria: [
            {
              id: 9,
              name: 'Propreté équipements',
              description: 'État de propreté des machines et outils',
              weight: 35,
              acceptable: 'Propre',
              excellent: 'Impeccable et désinfecté'
            },
            {
              id: 10,
              name: 'Zone de service',
              description: 'Propreté comptoir et zone client',
              weight: 30,
              acceptable: 'Correct',
              excellent: 'Impeccable en permanence'
            },
            {
              id: 11,
              name: 'Tenue du personnel',
              description: 'Propreté et conformité des uniformes',
              weight: 20,
              acceptable: 'Correcte',
              excellent: 'Impeccable et conforme'
            },
            {
              id: 12,
              name: 'Sécurité alimentaire',
              description: 'Respect des normes HACCP',
              weight: 15,
              acceptable: 'Conforme',
              excellent: 'Exemplaire avec traçabilité'
            }
          ]
        }
      ];
      setStandards(mockStandards);
    } catch (error) {
      console.error('Erreur chargement standards:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les standards de qualité',
        variant: 'destructive'
      });
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      excellent: { variant: 'default' as const, color: 'bg-green-500' },
      good: { variant: 'secondary' as const, color: 'bg-blue-500' },
      average: { variant: 'outline' as const, color: 'bg-yellow-500' },
      poor: { variant: 'destructive' as const, color: 'bg-red-500' }
    };
    return variants[status as keyof typeof variants] || variants.average;
  };

  const calculateOverallScore = (): number => {
    if (qualityChecks.length === 0) return 0;
    const totalScore = qualityChecks.reduce((sum, check) => sum + (check.score / check.maxScore) * 100, 0);
    return Math.round(totalScore / qualityChecks.length);
  };

  const getCategoryStats = (): CategoryStats[] => {
    const categories = ['Produits', 'Service', 'Hygiène'];
    return categories.map(category => {
      const categoryChecks = qualityChecks.filter(check => check.category === category);
      const avgScore = categoryChecks.length > 0 
        ? categoryChecks.reduce((sum, check) => sum + (check.score / check.maxScore) * 100, 0) / categoryChecks.length
        : 0;
      
      return {
        category,
        avgScore: Math.round(avgScore),
        checksCount: categoryChecks.length,
        trend: avgScore > 75 ? 'up' : 'down'
      };
    });
  };

  const addQualityCheck = async () => {
    try {
      if (!newCheck.item || !newCheck.score || !newCheck.maxScore || !newCheck.notes) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires',
          variant: 'destructive'
        });
        return;
      }

      const checkData: QualityCheck = {
        id: Math.max(...qualityChecks.map(c => c.id), 0) + 1,
        date: new Date().toISOString(),
        category: newCheck.category || 'Produits',
        item: newCheck.item || '',
        inspector: 'Nouvel Inspecteur', // À remplacer par l'utilisateur connecté
        score: newCheck.score || 0,
        maxScore: newCheck.maxScore || 100,
        status: newCheck.status || 'good',
        notes: newCheck.notes || '',
        correctionActions: newCheck.correctionActions || [],
        photos: newCheck.photos || [],
        completed: false
      };

      setQualityChecks([checkData, ...qualityChecks]);
      setShowNewCheckForm(false);
      setNewCheck({});
      toast({
        title: 'Succès',
        description: 'Nouveau contrôle qualité ajouté',
      });
    } catch (error) {
      console.error('Erreur ajout contrôle qualité:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le contrôle qualité',
        variant: 'destructive'
      });
    }
  };

  const updateCheckStatus = (id: number, completed: boolean) => {
    setQualityChecks(qualityChecks.map(check => 
      check.id === id ? { ...check, completed } : check
    ));
  };

  const filteredChecks = qualityChecks.filter(check => {
    const matchesCategory = selectedCategory === 'all' || check.category === selectedCategory;
    const matchesSearch = check.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         check.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const overallScore = calculateOverallScore();
  const categoryStats = getCategoryStats();
  const pendingActions = qualityChecks.reduce((sum, check) => sum + check.correctionActions.length, 0);
  const completedActions = qualityChecks.reduce((sum, check) => 
    sum + (check.completed ? check.correctionActions.length : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contrôle Qualité</h2>
          <p className="text-muted-foreground">
            Surveillance et amélioration continue de la qualité
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewCheckForm(!showNewCheckForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Contrôle
          </Button>
        </div>
      </div>

      {showNewCheckForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouveau contrôle qualité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select 
                  value={newCheck.category} 
                  onValueChange={value => setNewCheck({...newCheck, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produits">Produits</SelectItem>
                    <SelectItem value="Service">Service</SelectItem>
                    <SelectItem value="Hygiène">Hygiène</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Élément contrôlé *</Label>
                <Input 
                  value={newCheck.item || ''} 
                  onChange={e => setNewCheck({...newCheck, item: e.target.value})}
                  placeholder="Nom de l'élément"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Score *</Label>
                <Input 
                  type="number" 
                  value={newCheck.score || ''} 
                  onChange={e => setNewCheck({...newCheck, score: parseInt(e.target.value)})}
                  placeholder="Score obtenu"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Score maximum *</Label>
                <Input 
                  type="number" 
                  value={newCheck.maxScore || 100} 
                  onChange={e => setNewCheck({...newCheck, maxScore: parseInt(e.target.value)})}
                  placeholder="Score maximum"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Notes *</Label>
                <Textarea 
                  value={newCheck.notes || ''} 
                  onChange={e => setNewCheck({...newCheck, notes: e.target.value})}
                  placeholder="Détails du contrôle..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select 
                  value={newCheck.status} 
                  onValueChange={value => setNewCheck({...newCheck, status: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Bon</SelectItem>
                    <SelectItem value="average">Moyen</SelectItem>
                    <SelectItem value="poor">Médiocre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Actions correctives</Label>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Ajouter une action" 
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        setNewCheck({
                          ...newCheck,
                          correctionActions: [...(newCheck.correctionActions || []), e.currentTarget.value]
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
                <div className="mt-2 space-y-1">
                  {newCheck.correctionActions?.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{action}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setNewCheck({
                          ...newCheck,
                          correctionActions: newCheck.correctionActions?.filter((_, i) => i !== index)
                        })}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowNewCheckForm(false)}>
                Annuler
              </Button>
              <Button onClick={addQualityCheck}>
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau de bord global */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Global</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}%</div>
            <Progress value={overallScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {overallScore >= 90 ? 'Excellent' : 
               overallScore >= 75 ? 'Bon' : 
               overallScore >= 60 ? 'Moyen' : 'À améliorer'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrôles</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityChecks.length}</div>
            <p className="text-xs text-muted-foreground">
              {qualityChecks.filter(c => c.status === 'excellent').length} excellents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions Correctives</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingActions}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedActions} complétées sur {pendingActions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+5.2%</div>
            <p className="text-xs text-muted-foreground">vs période précédente</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="checks">Contrôles</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {categoryStats.map(stat => (
              <Card key={stat.category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stat.category}</span>
                    <Badge variant={stat.avgScore >= 80 ? 'default' : 'secondary'}>
                      {stat.avgScore}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={stat.avgScore} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{stat.checksCount} contrôles</span>
                    <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {stat.trend === 'up' ? '↗ Amélioration' : '↘ Dégradation'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contrôles Récents</CardTitle>
              <CardDescription>Derniers contrôles qualité effectués</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityChecks.slice(0, 5).map(check => (
                  <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        check.category === 'Produits' ? 'bg-green-100 text-green-600' :
                        check.category === 'Service' ? 'bg-blue-100 text-blue-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {check.category === 'Produits' && <Coffee className="h-5 w-5" />}
                        {check.category === 'Service' && <User className="h-5 w-5" />}
                        {check.category === 'Hygiène' && <Shield className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium">{check.item}</div>
                        <div className="text-sm text-muted-foreground">
                          {check.category} • {check.inspector} • {new Date(check.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-lg font-bold ${getScoreColor(check.score, check.maxScore)}`}>
                        {check.score}/{check.maxScore}
                      </div>
                      <Badge {...getStatusBadge(check.status)}>
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="Produits">Produits</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Hygiène">Hygiène</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button>
                <Camera className="h-4 w-4 mr-2" />
                Nouveau Contrôle Photo
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredChecks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucun contrôle trouvé</p>
              </div>
            ) : (
              filteredChecks.map(check => (
                <Card key={check.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center space-x-2">
                          <span>{check.item}</span>
                          <Badge {...getStatusBadge(check.status)}>
                            {check.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {check.category} • Inspecté par {check.inspector} • {new Date(check.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(check.score, check.maxScore)}`}>
                        {check.score}/{check.maxScore}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-1">Notes d'inspection:</h4>
                        <p className="text-sm text-muted-foreground">{check.notes}</p>
                      </div>
                      
                      {check.correctionActions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500" />
                            Actions correctives:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {check.correctionActions.map((action, index) => (
                              <li key={index} className="text-muted-foreground">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {check.photos && check.photos.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <Camera className="h-4 w-4 mr-1" />
                            Photos ({check.photos.length}):
                          </h4>
                          <div className="flex space-x-2">
                            {check.photos.map((photo, index) => (
                              <div key={index} className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                                <Camera className="h-6 w-6 text-gray-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <div className="grid gap-6">
            {standards.map(standard => (
              <Card key={standard.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{standard.name}</CardTitle>
                      <CardDescription>{standard.description}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      Poids: {standard.weight}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {standard.criteria.map(criteria => (
                      <div key={criteria.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{criteria.name}</h4>
                          <Badge variant="secondary">{criteria.weight}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{criteria.description}</p>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-yellow-600">Acceptable:</span>
                            <p className="text-muted-foreground">{criteria.acceptable}</p>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">Excellent:</span>
                            <p className="text-muted-foreground">{criteria.excellent}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la Qualité</CardTitle>
              <CardDescription>Tendances et analyses temporelles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Score global sur 30 jours</p>
                  </div>
                </div>
                <div className="border rounded-lg p-4 h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance par catégorie</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan d'Amélioration</CardTitle>
              <CardDescription>Actions correctives et préventives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityChecks
                  .filter(check => check.correctionActions.length > 0)
                  .map(check => (
                    <div key={check.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{check.item}</h4>
                          <p className="text-sm text-muted-foreground">{check.category}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {new Date(check.date).toLocaleDateString()}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => updateCheckStatus(check.id, !check.completed)}
                          >
                            {check.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {check.correctionActions.map((action, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <input 
                              type="checkbox" 
                              className="rounded" 
                              checked={check.completed}
                              onChange={() => updateCheckStatus(check.id, !check.completed)}
                            />
                            <span className={`text-sm ${check.completed ? 'line-through text-gray-400' : ''}`}>
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { QualityCheck } from '@/types/admin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ClipboardCheck, Plus, Edit, Trash2, Camera, 
  Star, AlertTriangle, CheckCircle, Eye, FileText,
  TrendingUp, Award, Search, Filter, Calendar,
  User, Clock, MapPin, Download, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface QualityCheckFormData {
  category: string;
  item: string;
  inspector: string;
  score: number;
  maxScore: number;
  notes?: string;
  correctionActions: string[];
}

const qualitySchema = z.object({
  category: z.string().min(1, "Catégorie requise"),
  item: z.string().min(1, "Article requis"),
  inspector: z.string().min(1, "Inspecteur requis"),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).max(100),
  notes: z.string().optional(),
  correctionActions: z.array(z.string()).default([]),
});

const categories = [
  'Hygiène',
  'Sécurité alimentaire',
  'Service client',
  'Propreté',
  'Équipement',
  'Formation staff',
  'Procédures',
  'Conformité'
];

const items = {
  'Hygiène': ['Lavage des mains', 'Nettoyage surfaces', 'Gants jetables', 'Masques'],
  'Sécurité alimentaire': ['Température frigo', 'DLC produits', 'Chaîne du froid', 'Contamination croisée'],
  'Service client': ['Accueil client', 'Temps d\'attente', 'Présentation', 'Résolution problèmes'],
  'Propreté': ['Sol', 'Tables', 'Toilettes', 'Vitres', 'Éclairage'],
  'Équipement': ['Machine à café', 'Frigo', 'Four', 'Caisse', 'POS'],
  'Formation staff': ['Connaissance menu', 'Procédures', 'Sécurité', 'Service'],
  'Procédures': ['Ouverture', 'Fermeture', 'Urgence', 'Nettoyage'],
  'Conformité': ['Licences', 'Assurances', 'Affichage obligatoire', 'Registres']
};

export default function QualityControl(): JSX.Element {
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [correctionAction, setCorrectionAction] = useState('');
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const { data: qualityChecks = [], isLoading } = useQuery<QualityCheck[]>({
    queryKey: ['qualityChecks'],
    queryFn: () => apiRequest('/api/admin/quality-checks'),
  });

  const createCheckMutation = useMutation({
    mutationFn: (data: QualityCheckFormData) => 
      apiRequest('/api/admin/quality-checks', { 
        method: 'POST', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast({ 
        title: "Contrôle créé", 
        description: "Le contrôle qualité a été créé avec succès"
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le contrôle qualité",
        variant: "destructive",
      });
    }
  });

  const updateCheckMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; [key: string]: unknown }) => 
      apiRequest(`/api/admin/quality-checks/${id}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast({ 
        title: "Contrôle mis à jour", 
        description: "Le contrôle qualité a été modifié"
      });
    }
  });

  const deleteCheckMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/quality-checks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qualityChecks'] });
      toast({ 
        title: "Contrôle supprimé", 
        description: "Le contrôle qualité a été supprimé"
      });
    }
  });

  const form = useForm<QualityCheckFormData>({
    resolver: zodResolver(qualitySchema),
    defaultValues: {
      category: '',
      item: '',
      inspector: '',
      score: 0,
      maxScore: 100,
      notes: '',
      correctionActions: [],
    },
  });

  const onSubmit = (data: QualityCheckFormData) => {
    createCheckMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <Star className="h-4 w-4" />;
      case 'average': return <AlertTriangle className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const calculateStatus = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  const filteredChecks = useMemo(() => {
    return qualityChecks.filter((check) => {
      const categoryMatch = filterCategory === 'all' || check.category === filterCategory;
      const statusMatch = filterStatus === 'all' || check.status === filterStatus;
      const searchMatch = !searchTerm || 
        check.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.category.toLowerCase().includes(searchTerm.toLowerCase());

      return categoryMatch && statusMatch && searchMatch;
    });
  }, [qualityChecks, filterCategory, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = qualityChecks.length;
    const completed = qualityChecks.filter(c => c.completed).length;
    const averageScore = qualityChecks.length > 0 
      ? qualityChecks.reduce((sum, c) => sum + (c.score / c.maxScore * 100), 0) / qualityChecks.length
      : 0;
    const pending = qualityChecks.filter(c => !c.completed).length;

    return { total, completed, averageScore, pending };
  }, [qualityChecks]);

  const addCorrectionAction = () => {
    if (correctionAction.trim()) {
      const currentActions = form.getValues('correctionActions') || [];
      form.setValue('correctionActions', [...currentActions, correctionAction.trim()]);
      setCorrectionAction('');
    }
  };

  const removeCorrectionAction = (index: number) => {
    const currentActions = form.getValues('correctionActions') || [];
    form.setValue('correctionActions', currentActions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!hasPermission('quality', 'view')) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Vous n'avez pas accès au contrôle qualité.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contrôle Qualité</h2>
          <p className="text-sm text-gray-500">
            Gestion des contrôles qualité et conformité
          </p>
        </div>
        {hasPermission('quality', 'create') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Contrôle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un Contrôle Qualité</DialogTitle>
                <DialogDescription>
                  Enregistrez un nouveau contrôle qualité
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCategory(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="item"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Article</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un article" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCategory && items[selectedCategory as keyof typeof items]?.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="inspector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inspecteur</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nom de l'inspecteur" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score obtenu</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              max="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score maximum</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              max="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Observations et commentaires..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Actions correctives</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={correctionAction}
                          onChange={(e) => setCorrectionAction(e.target.value)}
                          placeholder="Ajouter une action corrective..."
                          onKeyPress={(e) => e.key === 'Enter' && addCorrectionAction()}
                        />
                        <Button type="button" onClick={addCorrectionAction}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {form.watch('correctionActions')?.map((action, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{action}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeCorrectionAction(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCheckMutation.isPending}
                    >
                      {createCheckMutation.isPending ? (
                        'Création...'
                      ) : (
                        'Créer le Contrôle'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Contrôles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Score Moyen</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Bon</SelectItem>
                <SelectItem value="average">Moyen</SelectItem>
                <SelectItem value="poor">Mauvais</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des contrôles */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles Qualité</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Inspecteur</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.map((check) => {
                const status = calculateStatus(check.score, check.maxScore);
                const percentage = (check.score / check.maxScore) * 100;

                return (
                  <TableRow key={check.id}>
                    <TableCell>
                      {format(new Date(check.date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{check.category}</Badge>
                    </TableCell>
                    <TableCell>{check.item}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {check.inspector}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {check.score}/{check.maxScore}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(status)}>
                        {getStatusIcon(status)}
                        <span className="ml-1 capitalize">{status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCheck(check)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {hasPermission('quality', 'update') && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('quality', 'delete') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteCheckMutation.mutate(check.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      {selectedCheck && (
        <Dialog open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Détails du Contrôle #{selectedCheck.id}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Informations</h4>
                  <p><strong>Catégorie:</strong> {selectedCheck.category}</p>
                  <p><strong>Article:</strong> {selectedCheck.item}</p>
                  <p><strong>Inspecteur:</strong> {selectedCheck.inspector}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedCheck.date), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
                <div>
                  <h4 className="font-medium">Évaluation</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span>Score: {selectedCheck.score}/{selectedCheck.maxScore}</span>
                      <Badge className={getStatusColor(selectedCheck.status)}>
                        {selectedCheck.status}
                      </Badge>
                    </div>
                    <Progress 
                      value={(selectedCheck.score / selectedCheck.maxScore) * 100} 
                      className="h-3"
                    />
                  </div>
                </div>
              </div>

              {selectedCheck.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedCheck.notes}
                  </p>
                </div>
              )}

              {selectedCheck.correctionActions.length > 0 && (
                <div>
                  <h4 className="font-medium">Actions Correctives</h4>
                  <div className="space-y-1">
                    {selectedCheck.correctionActions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCheck.photos && selectedCheck.photos.length > 0 && (
                <div>
                  <h4 className="font-medium">Photos</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCheck.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
