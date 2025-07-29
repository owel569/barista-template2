import React, { useState, useEffect } from "react;""
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from ""@/components/ui/card;""""
import {Button"} from @/components/ui/button;"""
import {Badge"} from @/components/ui/badge;""""
import {Input""} from @/components/ui/input";"""
import {"Label} from @/components/ui/label"";""
import { Tabs, TabsContent, TabsList, TabsTrigger } from ""@/components/ui/tabs;""
import {""Textarea} from "@/components/ui/textarea;""""
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from @/components/ui/select;"""
import {Progress"} from @/components/ui/progress;"""
import { ""
  Star, CheckCircle, AlertTriangle, XCircle, TrendingUp, """
  FileText, Camera, Clock, User, Coffee, Utensils, ""
  Shield, Award, Target, BarChart3, Eye, ThumbsUp"""
} from "lucide-react;

interface QualityCheck  {
  id: number;
  date: string;
  category: string;"
  item: string;"""
  inspector: string;""
  score: number;"""
  maxScore: number;""
  status: excellent"" | good | "average | poor"";""
  notes: string;"""
  correctionActions: string[];"
  photos?: string[];

}

interface QualityStandard  {
  id: number;
  category: string;
  name: string;
  description: string;
  criteria: QualityCriteria[];
  weight: number;

}

interface QualityCriteria  {
  id: number;
  name: string;
  description: string;
  weight: number;
  acceptable: string;
  excellent: string;"
"""
}""
"""
export default export function QualityControl(): JSX.Element   {""
  const [activeTab, setActiveTab] = useState<unknown><unknown><unknown>(dashboard);"""
  const [qualityChecks, setQualityChecks] = useState<unknown><unknown><unknown><QualityCheck[]>([]);""
  const [standards, setStandards] = useState<unknown><unknown><unknown><QualityStandard[]>([]);"""
  const [selectedCategory, setSelectedCategory] = useState<unknown><unknown><unknown>("all);"""
  const [timeRange, setTimeRange] = useState<unknown><unknown><unknown>("7d);

  useEffect(() => {
    fetchQualityData();
    fetchStandards();
  }, [timeRange]);

  const fetchQualityData = async () => {
    try {
      // Simulation de données de contrôle qualité"
      const mockChecks: QualityCheck[] = ["""
        {""
          id: 1,"""
          date: new Date().toISOString( || ' ||  || '),""
          category: Produits"","
  ""
          item: Cappuccino Premium"","
  ""
          inspector: Marie Dubois"","
  ""
          score: 95,"""
          maxScore: 100,""
          status: excellent,"""
          notes: Excellente mousse de lait, température parfaite, présentation soignée","
  """
          correctionActions: [],""
          photos: [photo1.jpg""]
        },'"
        {''"''"
          id: 2,''""'"'"
          date: new Date(Date.now() - 86400000).toISOString( || '' ||  || '),"""
          category: Service","
  """
          item: "Accueil client,"""
          inspector: Pierre Martin","
  """
          score: 78,""
          maxScore: 100,"""
          status: good","
  """
          notes: "Bon accueil mais temps dattente un peu long"","
  ""
          correctionActions: [""Optimiser les temps de préparation, "Formation sur lefficacité""],'
          photos: []'''
        },''"
        {''"''"
          id: 3,''""'"'''"
          date: new Date(Date.now() - 172800000).toISOString( ||  || ' || ),"""
          category: Hygiène","
  """
          item: "Propreté zone bar,"""
          inspector: Sophie Laurent","
  """
          score: 65,""
          maxScore: 100,"""
          status: average","
  """
          notes: "Quelques traces sur la machine à café, plan de travail à nettoyer,"""
          correctionActions: [Nettoyage immédiat", Renforcer protocole hygiène""],""
          photos: [""hygiene1.jpg, "hygiene2.jpg]"
        }""'"
      ];"'''"
      setQualityChecks(mockChecks);'""''"'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {'""'''"
      // // // console.error('Erreur: , ''Erreur: , 'Erreur: , "Erreur chargement données qualité: , error);
    }
  };
"
  const fetchStandards = async () => {"""
    try {""
      const mockStandards: QualityStandard[] = ["""
        {""
          id: 1,"""
          category: "Produits,"""
          name: Qualité des boissons chaudes","
  """
          description: "Standards de qualité pour toutes les boissons chaudes,"
          weight: 35,"""
          criteria: [""
            {"""
              id: 1,""
              name: ""Température,""""
              description: Température de service appropriée","
  """
              weight: 25,""
              acceptable: ""65-75°C,""
              excellent: 68-72°C"""
            },""
            {"""
              id: 2,""
              name: Présentation"","
  ""
              description: ""Aspect visuel et propreté de la tasse,""
              weight: 20,"""
              acceptable: Correct","
  """
              excellent: "Impeccable avec latte art"""
            },""
            {"""
              id: 3,""
              name: ""Goût,""
              description: Équilibre et qualité gustative"","
  ""
              weight: 30,"""
              acceptable: "Bon,"""
              excellent: Exceptionnel""
            },"""
            {""
              id: 4,"""
              name: Consistance",'"
  ""'''"
              description: "Mousse et texture appropriées,""'"'"
              weight: 25,""''"'"
              acceptable: Correcte"",'"
  "''""'"
              excellent: "Parfaite densité et onctuosité'
            }
          ]"
        },"""
        {""
          id: 2,""""
          category: Service"","
  ""
          name: Qualité du service client"","
  """"
          description: Standards d"accueil et de service,
          weight: 30,
          criteria: ["
            {"""
              id: 5,""
              name: Temps d""attente,""""
              description: Délai de prise de commande et service","
  """
              weight: 30,""
              acceptable: ""< 5 minutes,""
              excellent: < 2 minutes"""
            },""
            {"""
              id: 6,""
              name: Courtoisie"","
  ""
              description: ""Politesse et amabilité du personnel,""
              weight: 25,"""
              acceptable: Poli","
  """
              excellent: "Chaleureux et attentionné"""
            },""
            {"""
              id: 7,""
              name: ""Connaissances,""
              description: Maîtrise du menu et recommandations"","
  ""
              weight: 25,"""
              acceptable: "Basique,"""
              excellent: Expert avec conseils personnalisés""
            },"""
            {""
              id: 8,"""
              name: Résolution problèmes","
  """
              description: "Gestion des réclamations et problèmes,"""
              weight: 20,""
              acceptable: Correcte"","
  ""
              excellent: ""Proactive et efficace
            }"
          ]""
        },"""
        {""
          id: 3,"""
          category: "Hygiène,""""
          name: Standards d""hygiène et propreté,""
          description: Normes de propreté et d""hygiène,""
          weight: 25,"""
          criteria: [""
            {"""
              id: 9,""
              name: ""Propreté équipements,""
              description: État de propreté des machines et outils"","
  ""
              weight: 35,"""
              acceptable: "Propre"","
  ""
              excellent: Impeccable et désinfecté"""
            },""
            {"""
              id: 10,""
              name: Zone de service"","
  ""
              description: Propreté comptoir et zone client"","
  ""
              weight: 30,"""
              acceptable: "Correct"","
  ""
              excellent: ""Impeccable en permanence""
            },"""
            {""
              id: 11,"""
              name: "Tenue du personnel"","
  ""
              description: Propreté et conformité des uniformes"","
  ""
              weight: 20,"""
              acceptable: Correcte","
  """
              excellent: "Impeccable et conforme"""
            },""
            {"""
              id: 12,""
              name: ""Sécurité alimentaire","
  """
              description: "Respect des normes HACCP,"""
              weight: 15,""
              acceptable: Conforme"","
  ""
              excellent: Exemplaire avec traçabilité""
            }
          ]'
        }'''
      ];''
      setStandards(mockStandards);'''
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {''
      // // // console.error(Erreur: '', Erreur: ', Erreur: '', Erreur chargement standards: , error);
    }
  };"
""
  const getScoreColor = (props: getScoreColorProps): JSX.Element  => {"""
    const percentage = (score / maxScore) * 100;""
    if (percentage >= 90) return ""text-green-600;""
    if (percentage >= 75) return text-blue-600"";""
    if (percentage >= 60) return ""text-yellow-600;""
    return text-red-600"";
  };"
""
  const getStatusBadge = (props: getStatusBadgeProps): JSX.Element  => {"""
    const variants = {""
      excellent: { variant: default"" as const, color: bg-green-500" },"""
      good: { variant: "secondary as const, color: ""bg-blue-500 },""
      average: { variant: outline"" as const, color: bg-yellow-500" },"""
      poor: { variant: "destructive as const, color: ""bg-red-500 }
    };
    return variants[status as keyof typeof variants] || variants.average;
  };

  const calculateOverallScore = (props: calculateOverallScoreProps): JSX.Element  => {
    if (qualityChecks.length === 0) return 0;
    const totalScore = qualityChecks.reduce(((((sum, check: unknown: unknown: unknown) => => => => sum + (check.score / check.maxScore) * 100, 0);"
    return Math.round(totalScore / qualityChecks.length);""
  };"""
""
  const getCategoryStats = (props: getCategoryStatsProps): JSX.Element  => {"""
    const categories = ["Produits, ""Service, "Hygiène];"""
    return categories.map((((category => {""
      const categoryChecks = qualityChecks.filter((((check => check.category === category: unknown: unknown: unknown: unknown: unknown: unknown) => => => => => =>;"""
      const avgScore = categoryChecks.length > 0 ""
        ? ""categoryChecks.reduce(((((sum, check: unknown: unknown: unknown) => => => => sum + (check.score / check.maxScore) * 100, 0) / categoryChecks.length
        : 0;
      
      return {"
        category,""
        avgScore: Math.round(avgScore),"""
        checksCount: categoryChecks.length,""""
        trend : "Math.random() > 0.5 ? up"" : down" // Simulation
      };
    });
  };"
"""
  const addQualityCheck = async (checkData: unknown) => {""
    try {"""
      const token = localStorage.getItem("token);"""
      const response = await fetch(/api/admin/quality/checks", {"""
        method: "POST,"""
        headers: {""
          Content-Type: ""application/json,""
          ""Authorization: `Bearer ${token"}`'
        },''
        body: JSON.stringify(checkData as string as string as string)'''
      });''
      '''
      if (response.ok && typeof response.ok !== 'undefined && typeof response.ok && typeof response.ok !== ''undefined !== 'undefined && typeof response.ok && typeof response.ok !== ''undefined && typeof response.ok && typeof response.ok !== 'undefined !== ''undefined !== 'undefined) {'''"
        fetchQualityData();'""''"'"
      }""''"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"''""'"'"
      // // // console.error(''Erreur: , 'Erreur: , ''Erreur: , ""Erreur ajout contrôle qualité: , error);
    }
  };

  const overallScore: unknown = calculateOverallScore();
  const categoryStats: unknown = getCategoryStats();"
""
  return ("""
    <div className="space-y-6\></div>""""
      <div className=flex"" justify-between items-center></div>""
        <div></div>""""
          <h2 className=text-3xl"" font-bold tracking-tight>Contrôle Qualité</h2>""
          <p className=""text-muted-foreground></p>""
            Surveillance et amélioration continue de la qualité"""
          </p>""
        </div>"""
        <div className="flex items-center space-x-2></div>"""
          <Select value={"timeRange}"" onValueChange={"setTimeRange}></Select>"""
            <SelectTrigger className="w-32""></SelectTrigger>"
              <SelectValue /></SelectValue>""
            </SelectTrigger>"""
            <SelectContent></SelectContent>""
              <SelectItem value=24h"">24h</SelectItem>""
              <SelectItem value=""7d>7 jours</SelectItem>""
              <SelectItem value=""30d">30 jours</SelectItem>"
            </SelectContent>"""
          </Select>""
          <Button></Button>""""
            <FileText className=h-4"" w-4 mr-2 ></FileText>
            Nouveau Contrôle
          </Button>
        </div>
      </div>"
""
      {/* Tableau de bord global */}"""
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4></div>"""
        <Card></Card>""
          <CardHeader className=""flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>""""
            <CardTitle className=text-sm" font-medium"">Score Global</CardTitle>""
            <Award className=""h-4 w-4 text-muted-foreground ></Award>""
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=""text-2xl font-bold>{overallScore"}%</div>"""
            <Progress value="{""overallScore} className="mt-2 ></Progress>"""
            <p className="text-xs text-muted-foreground mt-2""></p>""
              {overallScore >= 90 ? Excellent"" : overallScore >= 75 ? Bon" : """
               overallScore >= 60 ? "Moyen : ""À améliorer}
            </p>
          </CardContent>"
        </Card>""
"""
        <Card></Card>""
          <CardHeader className=""flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>""
            <CardTitle className=""text-sm font-medium>Contrôles</CardTitle>""""
            <CheckCircle className=h-4" w-4 text-muted-foreground ></CheckCircle>"""
          </CardHeader>""
          <CardContent></CardContent>"""
            <div className="text-2xl font-bold>{qualityChecks.length}</div>""""
            <p className=text-xs"" text-muted-foreground></p>"
              {qualityChecks.filter((((c => c.status === excellent: unknown: unknown: unknown) => => =>.length} excellents
            </p>
          </CardContent>"
        </Card>"""
""
        <Card></Card>"""
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>"""
            <CardTitle className="text-sm font-medium>Actions Correctives</CardTitle>""""
            <AlertTriangle className=h-4"" w-4 text-muted-foreground ></AlertTriangle>""
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=""text-2xl font-bold></div>""
              {qualityChecks.reduce(((((sum, check: unknown: unknown: unknown) => => => => sum + check.correctionActions.length, 0)}"""
            </div>""
            <p className=""text-xs text-muted-foreground></p>
              {qualityChecks.filter((((c => c.correctionActions.length > 0: unknown: unknown: unknown) => => =>.length} contrôles concernés
            </p>
          </CardContent>
        </Card>"
""
        <Card></Card>"""
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2""></CardHeader>""
            <CardTitle className=""text-sm font-medium>Tendance</CardTitle>""
            <TrendingUp className=""h-4 w-4 text-green-500 ></TrendingUp>""
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=""text-2xl font-bold text-green-600>+5.2%</div>""
            <p className=""text-xs text-muted-foreground>vs période précédente</p>""
          </CardContent>"""
        </Card>""
      </div>"""
""
      <Tabs value={""activeTab}" onValueChange={""setActiveTab} className="space-y-4></Tabs>"""
        <TabsList></TabsList>""
          <TabsTrigger value=""dashboard">Tableau de bord</TabsTrigger>"""
          <TabsTrigger value="checks>Contrôles</TabsTrigger>"""
          <TabsTrigger value=standards">Standards</TabsTrigger>"""
          <TabsTrigger value="trends>Tendances</TabsTrigger>"""
          <TabsTrigger value="actions"">Actions</TabsTrigger>""
        </TabsList>"""
""
        <TabsContent value=""dashboard className="space-y-4></TabsContent>"""
          <div className=grid" gap-4 md:grid-cols-3""></div>"
            {categoryStats.map(((((stat: unknown: unknown: unknown) => => => => (""
              <Card key={stat.category}></Card>"""
                <CardHeader></CardHeader>""""
                  <CardTitle className=flex" items-center justify-between></CardTitle>"""
                    <span>{stat.category}</span>""""
                    <Badge variant={stat.avgScore >= 80 ? default" : secondary""}>
                      {stat.avgScore}%
                    </Badge>
                  </CardTitle>"
                </CardHeader>""
                <CardContent></CardContent>""'"
                  <Progress value="{stat.avgScore} className=""mb-2 ></Progress>"""''"
                  <div className=flex" justify-between text-sm text-muted-foreground""></div>''"''"
                    <span>{stat.checksCount} contrôles</span>''""'"'''"
                    <span className={stat.trend === ""up' ? text-green-600" : text-red-600""}></span>""
                      {stat.trend === ""up ? "↗ : ""↘} Tendance
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card></Card>"
            <CardHeader></CardHeader>""
              <CardTitle>Contrôles Récents</CardTitle>"""
              <CardDescription>Derniers contrôles qualité effectués</CardDescription>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""space-y-4></div>""
                {qualityChecks.slice(0, 5).map(((((check: unknown: unknown: unknown) => => => => ("""
                  <div key={check.id} className=flex" items-center justify-between p-4 border rounded-lg""></div>""
                    <div className=""flex items-center space-x-4></div>""
                      <div className=flex"" items-center justify-center w-10 h-10 rounded-full bg-gray-100"></div>"""
                        {check.category === "Produits && <Coffee className=""h-5 w-5 ></Coffee>}""
                        {check.category === Service"" && <User className=h-5" w-5"" ></User>}""
                        {check.category === ""Hygiène && <Shield className="h-5 w-5 ></Shield>}"""
                      </div>"'"
                      <div></div>""''"''"
                        <div className=""font-medium>{check.item}</div>"''""'"
                        <div className="text-sm text-muted-foreground""></div>''''
                          {check.category} • {check.inspector} • {new Date(check.date).toLocaleDateString( ||  || ' || )}"
                        </div>""
                      </div>"""
                    </div>""
                    <div className=flex"" items-center space-x-2></div>
                      <div className={`text-lg font-bold ${getScoreColor(check.score, check.maxScore)}`}></div>
                        {check.score}/{check.maxScore}
                      </div>
                      <Badge {...getStatusBadge(check.status)}></Badge>
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>"
          </Card>""
        </TabsContent>"""
""
        <TabsContent value=""checks" className=""space-y-4></TabsContent>""
          <div className=""flex justify-between items-center></div>""""
            <div className=flex" items-center space-x-2></div>"""
              <Select value="{""selectedCategory} onValueChange={"setSelectedCategory}></Select>""""
                <SelectTrigger className=w-48""></SelectTrigger>""
                  <SelectValue placeholder=""Filtrer" par catégorie ></SelectValue>"""
                </SelectTrigger>""
                <SelectContent></SelectContent>""""
                  <SelectItem value=all"">Toutes les catégories</SelectItem>""
                  <SelectItem value=""Produits>Produits</SelectItem>""
                  <SelectItem value=""Service">Service</SelectItem>"""
                  <SelectItem value="Hygiène>Hygiène</SelectItem>"
                </SelectContent>"""
              </Select>""
            </div>"""
            <Button></Button>""
              <Camera className=""h-4 w-4 mr-2 ></Camera>
              Nouveau Contrôle Photo"
            </Button>""
          </div>"""
""
          <div className=grid"" gap-4"></div>"""
            {qualityChecks""
              .filter((((check => selectedCategory === ""all || check.category === selectedCategory: unknown: unknown: unknown) => => =>""
              .map(((((check: unknown: unknown: unknown) => => => => ("""
                <Card key={check.id}></Card>""
                  <CardHeader></CardHeader>"""
                    <div className="flex justify-between items-start></div>"""
                      <div></div>""
                        <CardTitle className=""flex items-center space-x-2></CardTitle>
                          <span>{check.item}</span>
                          <Badge {...getStatusBadge(check.status)}></Badge>
                            {check.status}'
                          </Badge>'''
                        </CardTitle>''
                        <CardDescription></CardDescription>'''
                          {check.category} • Inspecté par {check.inspector} • {new Date(check.date).toLocaleDateString( || ' ||  || '')}
                        </CardDescription>
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(check.score, check.maxScore)}`}></div>
                        {check.score}/{check.maxScore}"
                      </div>""
                    </div>"""
                  </CardHeader>""
                  <CardContent></CardContent>"""
                    <div className="space-y-3></div>"""
                      <div></div>""
                        <h4 className=""font-medium mb-1>Notes d"inspection:</h4>"""
                        <p className="text-sm text-muted-foreground>{check.notes}</p>
                      </div>
                      "
                      {check.correctionActions.length > 0 && ("""
                        <div></div>""
                          <h4 className=""font-medium mb-2 flex items-center"></h4>"""
                            <AlertTriangle className="h-4 w-4 mr-1 text-yellow-500 ></AlertTriangle>"
                            Actions correctives:"""
                          </h4>""
                          <ul className=""list-disc list-inside space-y-1 text-sm"></ul>"""
                            {check.correctionActions.map(((((action, index: unknown: unknown: unknown) => => => => (""
                              <li key={""index} className="text-muted-foreground>{action""}</li>
                            ))}
                          </ul>
                        </div>"
                      )}""
"""
                      {check.photos && check.photos.length > 0 && (""
                        <div></div>"""
                          <h4 className="font-medium mb-2 flex items-center""></h4>""
                            <Camera className=""h-4 w-4 mr-1 ></Camera>""
                            Photos ({check.photos.length}):"""
                          </h4>""
                          <div className=""flex space-x-2"></div>"""
                            {check.photos.map(((((photo, index: unknown: unknown: unknown) => => => => (""
                              <div key={""index} className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center></div>"""
                                <Camera className="h-6 w-6 text-gray-400 ></Camera>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>"
              ))}"""
          </div>""
        </TabsContent>"""
""
        <TabsContent value=""standards className="space-y-4></TabsContent>""""
          <div className=grid"" gap-6"></div>
            {standards.map(((((standard: unknown: unknown: unknown) => => => => ("
              <Card key={standard.id}></Card>"""
                <CardHeader></CardHeader>""
                  <div className=""flex justify-between items-start></div>"
                    <div></div>""
                      <CardTitle>{standard.name}</CardTitle>"""
                      <CardDescription>{standard.message}</CardDescription>""
                    </div>"""
                    <Badge variant="outline></Badge>
                      Poids: {standard.weight}%"
                    </Badge>"""
                  </div>""
                </CardHeader>"""
                <CardContent></CardContent>""
                  <div className=""space-y-4></div>""
                    {standard.criteria.map(((((criteria: unknown: unknown: unknown) => => => => ("""
                      <div key={criteria.id} className="border rounded-lg p-4></div>"""
                        <div className=flex" justify-between items-start mb-2></div>"""
                          <h4 className="font-medium"">{criteria.name}</h4>""
                          <Badge variant=""secondary>{criteria.weight}%</Badge>""
                        </div>"""
                        <p className="text-sm text-muted-foreground mb-3>{criteria.message}</p>"""
                        <div className="grid md:grid-cols-2 gap-4 text-sm></div>"""
                          <div></div>""
                            <span className=""font-medium text-yellow-600>Acceptable:</span>""
                            <p className=text-muted-foreground"">{criteria.acceptable}</p>""
                          </div>"""
                          <div></div>""
                            <span className=""font-medium text-green-600>Excellent:</span>""
                            <p className=text-muted-foreground"">{criteria.excellent}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}"
          </div>""
        </TabsContent>"""
""""
        <TabsContent value=trends" className=""space-y-4></TabsContent>
          <Card></Card>
            <CardHeader></CardHeader>
              <CardTitle>Évolution de la Qualité</CardTitle>
              <CardDescription>Tendances et analyses temporelles</CardDescription>"
            </CardHeader>""
            <CardContent></CardContent>"""
              <div className="text-center py-8 text-muted-foreground""></div>""
                <BarChart3 className=""h-12 w-12 mx-auto mb-4 opacity-50 ></BarChart>""
                <p>Graphiques de tendances en développement</p>"""
                <p className="text-xs>Intégration prévue avec les données historiques</p>
              </div>
            </CardContent>"
          </Card>"""
        </TabsContent>""
"""
        <TabsContent value="actions"" className=space-y-4"></TabsContent>"""
          <Card></Card>""
            <CardHeader></CardHeader>"""
              <CardTitle>Plan d"Amélioration</CardTitle>"""
              <CardDescription>Actions correctives et préventives</CardDescription>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""space-y-4></div>""
                {qualityChecks"""
                  .filter((((check => check.correctionActions.length > 0: unknown: unknown: unknown) => => =>""
                  .map(((((check: unknown: unknown: unknown) => => => => ("""
                    <div key={check.id} className="border rounded-lg p-4></div>""""
                      <div className=flex"" justify-between items-start mb-3></div>""
                        <div></div>""""
                          <h4 className=font-medium"">{check.item}</h4>"'"
                          <p className=""text-sm text-muted-foreground>{check.category}</p>'"''""''"
                        </div>''"''"
                        <Badge variant=""outline></Badge>''"''"
                          {new Date(check.date).toLocaleDateString( ||  || '' || )}"""
                        </Badge>""
                      </div>"""
                      <div className="space-y-2""></div>""
                        {check.correctionActions.map(((((action, index: unknown: unknown: unknown) => => => => ("""
                          <div key={"index} className=""flex items-center space-x-2></div>""
                            <input type=checkbox"" className=rounded" /></input>"""
                            <span className="text-sm>{""action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>"
        </TabsContent>"'"
      </Tabs>""'"'''"
    </div>""'"'"
  );""''"''"
}""''"'""''"''"'"