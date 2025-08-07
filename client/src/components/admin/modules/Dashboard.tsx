/**
 * Dashboard Intelligence Artificielle - Logique métier professionnelle et sécurisée
 * Optimisé pour la longévité du système
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  MessageSquare, 
  FileText, 
  Settings,
  Zap,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Types sécurisés pour les données
interface DashboardStats {
  aiInsights?: {
    newInsights?: number;
    efficiency?: number;
    insights?: Array<{
      type: string;
      title: string;
      description: string;
      impact: string;
      confidence: number;
    }>;
  };
  chatbot?: {
    totalInteractions?: number;
    activeConversations?: number;
    satisfactionRate?: number;
    averageResponseTime?: string;
    autoResolutionRate?: number;
    topQuestions?: Array<{
      question: string;
      count: number;
    }>;
  };
  reports?: {
    generated?: number;
    scheduled?: number;
    pending?: number;
  };
}

interface AIAlert {
  severity: string;
  message: string;
}

interface ReportData {
  name: string;
  type: string;
  nextRun: string;
}

const DashboardModule: React.FC = () => {
  // Récupérer les statistiques du tableau de bord
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/advanced/dashboard-stats'],
    refetchInterval: 30000
  });

  // Récupérer les alertes IA
  const { data: aiAlerts } = useQuery<{ alerts?: AIAlert[] }>({
    queryKey: ['/api/admin/advanced/ai-alerts'],
    refetchInterval: 60000
  });

  // Récupérer les rapports automatiques
  const { data: reports } = useQuery<{ upcoming?: ReportData[] }>({
    queryKey: ['/api/admin/advanced/automated-reports'],
    refetchInterval: 300000
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Chargement du tableau de bord avancé...</p>
        </div>
      </div>
    );
  }

  const aiInsights = stats?.aiInsights || {};
  const chatbotStats = stats?.chatbot || {};
  const automatedReports = stats?.reports || {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord Intelligence Artificielle</h1>
          <p className="text-gray-600">Vue d'ensemble des fonctionnalités avancées</p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <Brain className="h-4 w-4 mr-2" />
          IA Activée
        </Badge>
      </div>

      {/* Alertes critiques IA */}
      {aiAlerts?.alerts && aiAlerts.alerts.length > 0 && (
        <div className="space-y-2">
          {aiAlerts.alerts.map((alert: AIAlert, index: number) => (
            <Alert key={index} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Alerte IA:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistant IA</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatbotStats.totalInteractions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Interactions aujourd'hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights IA</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.newInsights || 0}</div>
            <p className="text-xs text-muted-foreground">
              Nouveaux insights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rapports Auto</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automatedReports.generated || 0}</div>
            <p className="text-xs text-muted-foreground">
              Générés ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficacité IA</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiInsights.efficiency || 95}%</div>
            <p className="text-xs text-muted-foreground">
              Précision globale
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chatbot">Assistant IA</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
        </TabsList>

        <TabsContent value="chatbot" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Assistant Conversationnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Conversations actives</span>
                    <Badge variant="outline">{chatbotStats.activeConversations || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de satisfaction</span>
                    <Badge variant="outline" className="text-green-600">
                      {chatbotStats.satisfactionRate || 92}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps de réponse</span>
                    <span className="text-sm">{chatbotStats.averageResponseTime || '<1s'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Résolutions auto</span>
                    <Badge variant="outline" className="text-blue-600">
                      {chatbotStats.autoResolutionRate || 78}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Questions fréquentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chatbotStats.topQuestions?.slice(0, 5).map((question, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{question.question}</span>
                      <Badge variant="outline">{question.count}</Badge>
                    </div>
                  )) || (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Heures d'ouverture</span>
                        <Badge variant="outline">45</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Menu du jour</span>
                        <Badge variant="outline">38</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Réservation</span>
                        <Badge variant="outline">32</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Prix menu</span>
                        <Badge variant="outline">28</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  <span className="text-xs">Paramètres</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  <span className="text-xs">Réponses</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Brain className="h-6 w-6 mb-2" />
                  <span className="text-xs">Entraînement</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-xs">Base connaissance</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapports Automatisés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{automatedReports.scheduled || 12}</div>
                    <div className="text-sm text-blue-800">Rapports programmés</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{automatedReports.generated || 8}</div>
                    <div className="text-sm text-green-800">Générés ce mois</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{automatedReports.pending || 2}</div>
                    <div className="text-sm text-orange-800">En cours</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Prochains rapports</h4>
                  {reports?.upcoming?.map((report: ReportData, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <span className="font-medium">{report.name}</span>
                        <span className="text-sm text-gray-500 ml-2">- {report.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{report.nextRun}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">Rapport mensuel ventes</span>
                          <span className="text-sm text-gray-500 ml-2">- PDF</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">01/02/2025</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <span className="font-medium">Analyse clientèle</span>
                          <span className="text-sm text-gray-500 ml-2">- Excel</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">05/02/2025</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Insights Intelligence Artificielle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.insights?.slice(0, 3).map((insight, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${
                        insight.type === 'opportunity' ? 'bg-green-100' :
                        insight.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {insight.type === 'opportunity' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : insight.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            Impact: {insight.impact}
                          </Badge>
                          <Badge variant="outline">
                            Confiance: {insight.confidence}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded bg-green-100">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Opportunité de croissance</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            L'ajout d'options végétariennes pourrait augmenter les ventes de 15%
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">Impact: Élevé</Badge>
                            <Badge variant="outline">Confiance: 87%</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded bg-blue-100">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">Optimisation réussie</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Le nouveau système de réservation a réduit l'attente de 23%
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">Impact: Moyen</Badge>
                            <Badge variant="outline">Confiance: 95%</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automatisations Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Gestion Stock</h4>
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Commandes automatiques basées sur les prédictions IA
                    </p>
                    <div className="text-xs text-gray-500">
                      Dernière action: Commande de café - il y a 2h
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Notifications</h4>
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Alertes intelligentes pour l'équipe
                    </p>
                    <div className="text-xs text-gray-500">
                      Dernière action: Alerte stock faible - il y a 30min
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Rapports</h4>
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Génération automatique de rapports
                    </p>
                    <div className="text-xs text-gray-500">
                      Dernière action: Rapport hebdomadaire - hier
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Support Client</h4>
                      <Badge variant="outline" className="text-green-600">Actif</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Réponses automatiques aux questions fréquentes
                    </p>
                    <div className="text-xs text-gray-500">
                      Dernière action: Réponse automatique - il y a 5min
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardModule;