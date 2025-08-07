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
  Shield, Award, Target, BarChart3, Eye, ThumbsUp
} from 'lucide-react';

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

export default function QualityControl() : JSX.Element {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);
  const [standards, setStandards] = useState<QualityStandard[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchQualityData();
    fetchStandards();
  }, [timeRange]);

  const fetchQualityData = async () => {
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
          correctionActions: [,],
          photos: ['photo1.jpg']
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
          photos: []
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
          photos: ['hygiene1.jpg', 'hygiene2.jpg']
        }
      ];
      setQualityChecks(mockChecks);
    } catch (error) {
      console.error('Erreur chargement données qualité:', error);
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

  const calculateOverallScore = () => {
    if (qualityChecks.length === 0) return 0;
    const totalScore = qualityChecks.reduce((sum, check) => sum + (check.score / check.maxScore) * 100, 0);
    return Math.round(totalScore / qualityChecks.length);
  };

  const getCategoryStats = () => {
    const categories = ['Produits', 'Service', 'Hygiène'];
    return categories.map(category => {
      const categoryChecks = qualityChecks.filter(check => check.category === category)});
      const avgScore = categoryChecks.length > 0 
        ? categoryChecks.reduce((sum, check) => sum + (check.score / check.maxScore) * 100, 0) / categoryChecks.length
        : 0;
      
      return {
        category,
        avgScore: Math.round(avgScore),
        checksCount: categoryChecks.length,
        trend: Math.random() > 0.5 ? 'up' : 'down' // Simulation
      };
    });
  };

  const addQualityCheck = async (checkData: unknown) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/quality/checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkData)
      });
      
      if (response.ok) {
        fetchQualityData();
      }
    } catch (error) {
      console.error('Erreur ajout contrôle qualité:', error);
    }
  };

  const overallScore = calculateOverallScore();
  const categoryStats = getCategoryStats();

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
            </SelectContent>
          </Select>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nouveau Contrôle
          </Button>
        </div>
      </div>

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
              {qualityChecks.reduce((sum, check) => sum + check.correctionActions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {qualityChecks.filter(c => c.correctionActions.length > 0).length} contrôles concernés
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
            {categoryStats.map((stat) => (
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
                      {stat.trend === 'up' ? '↗' : '↘'} Tendance
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
                {qualityChecks.slice(0, 5).map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
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
            <Button>
              <Camera className="h-4 w-4 mr-2" />
              Nouveau Contrôle Photo
            </Button>
          </div>

          <div className="grid gap-4">
            {qualityChecks
              .filter(check => selectedCategory === 'all' || check.category === selectedCategory)
              .map((check) => (
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
                            Photos ({check.photos.length)}):
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
              ))}
          </div>
        </TabsContent>

        <TabsContent value="standards" className="space-y-4">
          <div className="grid gap-6">
            {standards.map((standard) => (
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
                    {standard.criteria.map((criteria) => (
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
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Graphiques de tendances en développement</p>
                <p className="text-xs">Intégration prévue avec les données historiques</p>
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
                  .map((check) => (
                    <div key={check.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{check.item}</h4>
                          <p className="text-sm text-muted-foreground">{check.category}</p>
                        </div>
                        <Badge variant="outline">
                          {new Date(check.date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {check.correctionActions.map((action, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{action}</span>
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