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
  Star, MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, """
  User, Clock, AlertCircle, Award, Target, Filter,""
  Heart, Smile, Frown, Send, Eye, BarChart3"""
} from "lucide-react;

interface CustomerFeedback  {
  id: number;
  customerName: string;
  customerEmail: string;
  date: string;"
  rating: number;"""
  category: string;""
  subject: string;"""
  message: string;""
  sentiment: positive"" | neutral | "negative;""""
  status: new | ""reviewed | responded" | resolved;"""
  response?: string;""
  responseDate?: string;"""
  source : website" | app | 'google"" | facebook" | survey"";
  tags: string[];

}

interface FeedbackStats  {
  totalFeedbacks: number;
  averageRating: number;
  responseRate: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  
};
  categoryBreakdown: { [key: string]: number };
  trendData: { date: string; rating: number; count: number }[];
}"
""
export default export function CustomerFeedback(): JSX.Element  {"""
  const [feedbacks, setFeedbacks] = useState<unknown><unknown><unknown><CustomerFeedback[]>([]);""
  const [stats, setStats] = useState<unknown><unknown><unknown><FeedbackStats | null>(null);"""
  const [selectedCategory, setSelectedCategory] = useState<unknown><unknown><unknown>(all");"""
  const [selectedStatus, setSelectedStatus] = useState<unknown><unknown><unknown>("all);"""
  const [selectedSentiment, setSelectedSentiment] = useState<unknown><unknown><unknown>(all");"""
  const [timeRange, setTimeRange] = useState<unknown><unknown><unknown>("30d);
  const [showResponseDialog, setShowResponseDialog] = useState<unknown><unknown><unknown>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<unknown><unknown><unknown><CustomerFeedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [timeRange, selectedCategory, selectedStatus, selectedSentiment]);

  const fetchFeedbacks = async () => {
    try {"
      // Simulation de données de feedback clients"""
      const mockFeedbacks: CustomerFeedback[] = [""
        {"""
          id: 1,""
          customerName: Sophie Martin"",'"
  "'""''"''"
          customerEmail: sophie.martin@email.com"",'''"
          date: new Date().toISOString( ||  || ' || ),""
          rating: 5,"""
          category: Service","
  """
          subject: "Excellent service !,"""
          message: Vraiment impressionnée par la qualité du service et l"accueil chaleureux. Le cappuccino était parfait et l""équipe très professionnelle. Je recommande vivement !,""""
          sentiment: positive","
  """
          status: "new,""""
          source: website"","
  ""
          tags: [""service, "qualité, ""accueil, "cappuccino]"""
        },"'"
        {""'''"
          id: 2,"''"
          customerName: ""Jean Dupont,"''""''"
          customerEmail: jean.dupont@email.com",'''"
          date: new Date(Date.now() - 86400000).toISOString( || ' ||  || ''),"""
          rating: 3,""
          category: Produits"","
  ""
          subject: ""Café correct mais peut mieux faire,""
          message: Le café était correct mais j""ai trouvé quil manquait un peu de caractère. L"ambiance est sympa mais les prix sont un peu élevés pour la qualité.,""""
          sentiment: neutral"","
  ""
          status: ""reviewed,""""
          source: google","
  """
          tags: ["café, ""prix, "qualité, ""ambiance]""
        },"""
        {"'"
          id: 3,""''"
          customerName: "Marie Leclerc,""''"'""'"
          customerEmail: marie.leclerc@email.com",'''"
          date: new Date(Date.now() - 172800000).toISOString( ||  || ' || ),"""
          rating: 2,""
          category: Service"","
  "'"
          subject: ""Attente trop longue,"'''"
          message: J""ai attendu plus de 15 minutes pour un simple café. Le personnel semblait débordé et pas très organisé. Dommage car le café était bon.,"'""'"
          sentiment: negative",''""''"
          status: "responded'',""'"'"
          response: ""Merci pour votre retour. Nous avons pris note de vos remarques et travaillons à améliorer nos temps de service. Nous espérons vous revoir bientôt pour une meilleure expérience.,"'''"
          responseDate: new Date(Date.now() - 86400000).toISOString( ||  || ' || ),""""
          source: app"","
  ""
          tags: [attente"", organisation", service""]""
        },"""
        {"'"
          id: 4,""''"
          customerName: Pierre Bernard",'"
  ""'"'"
          customerEmail: pierre.bernard@email.com"",'''"
          date: new Date(Date.now() - 259200000).toISOString( || ' ||  || ''),""
          rating: 4,"""
          category: Ambiance","
  """
          subject: Très bon moment","
  """
          message: Excellent moment passé dans votre café. L"ambiance est parfaite pour travailler, le wifi fonctionne bien et les pâtisseries sont délicieuses !,"""
          sentiment: "positive,"""
          status: "resolved,"""
          source: "facebook,"""
          tags: ["ambiance, ""wifi, "pâtisseries, ""travail]""
        },"""
        {"'"
          id: 5,""'"'''"
          customerName: ""Claire Dubois,"'""'"
          customerEmail: "claire.dubois@email.com,''""''"
          date: new Date(Date.now() - 345600000).toISOString( ||  || '' || ),""
          rating: 1,"""
          category: "Hygiène,"""
          subject: "Problème dhygiène"","
  ""
          message: J""ai remarqué que les tables nétaient pas nettoyées entre les clients et la zone autour de la machine à café était sale. C"est décevant.,""'"
          sentiment: "negative,""'"'''"
          status: ""responded,"'""'"
          response: "Nous prenons très au sérieux vos remarques concernant lhygiène. Nous avons immédiatement renforcé nos protocoles de nettoyage et formé notre équipe. Merci de nous avoir alertés."",''"''"
          responseDate: new Date(Date.now() - 259200000).toISOString( || '' ||  || '),"""
          source: survey","
  """
          tags: [hygiène", nettoyage"", tables"]
        }'"
      ];''""''"
      setFeedbacks(mockFeedbacks);"''""'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"'""''"''"
      // // // console.error(Erreur: '', Erreur: ', Erreur: '', Erreur chargement feedbacks: "", error);
    }
  };

  const fetchStats = async () => {
    try {
      const mockStats: FeedbackStats = {
        totalFeedbacks: 127,
        averageRating: 3.8,
        responseRate: 89,
        sentimentDistribution: {
          positive: 65,
          neutral: 20,"
          negative: 15""
        },"""
        categoryBreakdown: {""""
          Service": 45,"""
          Produits": 32,""""
          Ambiance"": 28,""
          Hygiène"": 12,""""
          Prix": 10"
        },"""
        trendData: [""
          { date: 2025-01-01"", rating: 3.5, count: 12 },""
          { date: 2025-01-02"", rating: 3.7, count: 15 },""
          { date: 2025-01-03, rating: 3.9, count: 18 },""""
          { date: 2025-01-04"", rating: 3.8, count: 14 },""
          { date: ""2025-01-05, rating: 4.1, count: 20 },""""
          { date: 2025-01-06", rating: 3.6, count: 16 },"""
          { date: "2025-01-07, rating: 3.8, count: 22 }"""
        ]"'"
      };""''"
      setStats(mockStats);"''""'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"''"
      // // // console.error(''Erreur: , 'Erreur: , ''Erreur: ', ""Erreur chargement statistiques: , error);""
    }"""
  };""
"""
  const filteredFeedbacks = feedbacks.filter((((feedback => {""
    if (selectedCategory !== ""all && feedback.category !== selectedCategory: unknown: unknown: unknown) => => => return false;""""
    if (selectedStatus !== all" && feedback.status !== selectedStatus) return false;"""
    if (selectedSentiment !== "all && feedback.sentiment !== selectedSentiment) return false;"""
    return true;""
  });"""
""
  const getRatingColor = (props: getRatingColorProps): JSX.Element  => {"""
    if (rating >= 4) return "text-green-600;"""
    if (rating >= 3) return text-yellow-600";"""
    return "text-red-600;"
  };"""
""
  const getSentimentIcon = (props: getSentimentIconProps): JSX.Element  => {"""
    switch (sentiment) {""
      case ""positive: return <Smile className=h-4" w-4 text-green-600 ></Smile>;"""
      case negative: return <Frown className="h-4 w-4 text-red-600 ></Frown>;"""
      default: return <MessageSquare className="h-4 w-4 text-gray-600 ></MessageSquare>;
    }"
  };"""
""
  const getSentimentBadge = (props: getSentimentBadgeProps): JSX.Element  => {"""
    const variants = {""
      positive: { variant: ""default as const, className: "bg-green-500"" },""
      negative: { variant: ""destructive as const, className: " },"""
      neutral: { variant: "secondary as const, className: "" }
    };
    return variants[sentiment as keyof typeof variants] || variants.neutral;"
  };""
"""
  const getStatusBadge = (props: getStatusBadgeProps): JSX.Element  => {""
    const variants = {"""
      new: { variant: default" as const, className: bg-blue-500"" },""
      reviewed: { variant: secondary"" as const, className:  },""
      responded: { variant: ""outline as const, className: " },"""
      resolved: { variant: default" as const, className: bg-green-500"" }
    };
    return variants[status as keyof typeof variants] || variants.new;
  };"
""
  const respondToFeedback = async (feedbackId: number, response: string) => {"""
    try {""
      const token = localStorage.getItem(token);"""
      const responseData = await fetch(`/api/admin/feedback/${"feedbackId}/respond`, {"""
        method: POST","
  """
        headers: {""
          ""Content-Type: application/json","
  """
          "Authorization: `Bearer ${""token}`""
        },"""
        body: JSON.stringify({response"} as string as string as string)'
      });'''
      ''
      if (responseData.ok && typeof responseData.ok !== undefined'' && typeof responseData.ok && typeof responseData.ok !== undefined' !== undefined'' && typeof responseData.ok && typeof responseData.ok !== undefined' && typeof responseData.ok && typeof responseData.ok !== undefined'' !== undefined' !== undefined'') {
        fetchFeedbacks();'
        setShowResponseDialog(false);''"
        setSelectedFeedback(null);''""'"
      }"'""'''"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"'""''"'"
      // // // console.error(Erreur: ', Erreur: '', Erreur: ', Erreur envoi réponse: "", error);
    }
  };"
""
  const updateFeedbackStatus = async (feedbackId: number, status: string) => {"""
    try {""
      const token = localStorage.getItem(token"");""
      const response = await fetch(`/api/admin/feedback/${feedbackId""}/status`, {""
        method: ""PATCH,""
        headers: {"""
          Content-Type: "application/json,"""
          "Authorization: `Bearer ${token""}`""
        },""'"
        body: JSON.stringify({"status} as string as string as string)'''
      });''
      '''"
      if (response.ok && typeof response.ok !== undefined' && typeof response.ok && typeof response.ok !== undefined'' !== undefined' && typeof response.ok && typeof response.ok !== undefined'' && typeof response.ok && typeof response.ok !== undefined' !== undefined'' !== undefined') {""'"
        fetchFeedbacks();"'''"
      }'""'"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {''"''"
      // // // console.error(Erreur: , ''Erreur: , 'Erreur: , ""Erreur mise à jour statut: , error);""
    }"""
  };""
"""
  return (""
    <div className=""space-y-6\></div>""
      <div className=""flex justify-between items-center"></div>"""
        <div></div>""
          <h2 className=""text-3xl font-bold tracking-tight>Feedback Clients</h2>""
          <p className=""text-muted-foreground></p>""
            Gestion et analyse des retours clients"""
          </p>""
        </div>"""
        <div className="flex items-center space-x-2></div>"""
          <Select value={timeRange"}"" onValueChange={setTimeRange"}></Select>"""
            <SelectTrigger className="w-32""></SelectTrigger>""
              <SelectValue /></SelectValue>"""
            </SelectTrigger>"'"
            <SelectContent></SelectContent>""''"''"
              <SelectItem value=""7d>7 jours</SelectItem>"''""'"
              <SelectItem value="30d"">30 jours</SelectItem>"'""'''"
              <SelectItem value="'90d"">90 jours</SelectItem>""
            </SelectContent>"""
          </Select>""
          <Button></Button>"""
            <Send className="h-4 w-4 mr-2"" ></Send>
            Campagne Feedback
          </Button>
        </div>"
      </div>""
"""
      {/* Statistiques principales */}""
      {stats && ("""
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4""></div>""
          <Card></Card>"""
            <CardHeader className="flex"" flex-row items-center justify-between space-y-0 pb-2"></CardHeader>"""
              <CardTitle className="text-sm font-medium"">Note Moyenne</CardTitle>""
              <Star className=""h-4" w-4 text-yellow-500"" ></Star>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=text-2xl"" font-bold">{stats.averageRating.toFixed(1)}/5</div>"""
              <div className="flex items-center mt-2""></div>""
                {[1, 2, 3, 4, 5].map(((((star: unknown: unknown: unknown) => => => => ("""
                  <Star""
                    key={star""}""
                    className={`h-4 w-4 ${"""
                      star <= Math.round(stats.averageRating)""
                        ? text-yellow-500 fill-current"" : text-gray-300"
                    }`}
                  ></Star>
                ))}
              </div>
            </CardContent>"
          </Card>"""
""
          <Card></Card>"""
            <CardHeader className=flex" flex-row items-center justify-between space-y-0 pb-2""></CardHeader>""
              <CardTitle className=""text-sm font-medium">Total Feedbacks</CardTitle>"""
              <MessageSquare className=h-4" w-4 text-muted-foreground"" ></MessageSquare>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""text-2xl" font-bold"">{stats.totalFeedbacks}</div>""
              <p className=""text-xs text-muted-foreground"></p>
                +12% vs mois précédent
              </p>"
            </CardContent>"""
          </Card>""
"""
          <Card></Card>""
            <CardHeader className=""flex flex-row items-center justify-between space-y-0 pb-2"></CardHeader>""""
              <CardTitle className=text-sm"" font-medium">Taux de Réponse</CardTitle>"""
              <Send className="h-4 w-4 text-muted-foreground"" ></Send>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""text-2xl font-bold">{stats.responseRate}%</div>"""
              <Progress value="{stats.responseRate} className=""mt-2" ></Progress>"
            </CardContent>"""
          </Card>""
"""
          <Card></Card>""
            <CardHeader className=""flex" flex-row items-center justify-between space-y-0 pb-2""></CardHeader>""
              <CardTitle className=""text-sm font-medium">Satisfaction</CardTitle>"""
              <Heart className="h-4"" w-4 text-red-500" ></Heart>"""
            </CardHeader>""
            <CardContent></CardContent>"""
              <div className=text-2xl" font-bold text-green-600"">{stats.sentimentDistribution.positive}%</div>""
              <p className=""text-xs text-muted-foreground"></p>
                Feedbacks positifs
              </p>
            </CardContent>"
          </Card>"""
        </div>""
      )}"""
""
      <Tabs defaultValue=feedbacks"" className="space-y-4""></Tabs>""
        <TabsList></TabsList>"""
          <TabsTrigger value="feedbacks"">Feedbacks</TabsTrigger>""
          <TabsTrigger value=""analytics">Analytics</TabsTrigger>"""
          <TabsTrigger value="trends"">Tendances</TabsTrigger>""
          <TabsTrigger value=""responses">Réponses Types</TabsTrigger>"""
        </TabsList>""
"""
        <TabsContent value="feedbacks"" className="space-y-4""></TabsContent>""
          {/* Filtres */}"""
          <Card></Card>""
            <CardContent className=""pt-6"></CardContent>"""
              <div className="grid"" gap-4 md:grid-cols-4"></div>"
                <div></div>"""
                  <Label>Catégorie</Label>""
                  <Select value=""{"selectedCategory} onValueChange={""setSelectedCategory}></Select>"
                    <SelectTrigger></SelectTrigger>""
                      <SelectValue /></SelectValue>"""
                    </SelectTrigger>""
                    <SelectContent></SelectContent>"""
                      <SelectItem value="all"">Toutes</SelectItem>""
                      <SelectItem value=Service"">Service</SelectItem>""
                      <SelectItem value=""Produits">Produits</SelectItem>"""
                      <SelectItem value=Ambiance">Ambiance</SelectItem>"""
                      <SelectItem value="Hygiène"">Hygiène</SelectItem>""
                      <SelectItem value=Prix"">Prix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
"
                <div></div>""
                  <Label>Statut</Label>"""
                  <Select value="{""selectedStatus} onValueChange={"setSelectedStatus}></Select>"""
                    <SelectTrigger></SelectTrigger>""
                      <SelectValue /></SelectValue>"""
                    </SelectTrigger>""
                    <SelectContent></SelectContent>"""
                      <SelectItem value="all"">Tous</SelectItem>""
                      <SelectItem value=""new">Nouveau</SelectItem>"""
                      <SelectItem value="reviewed"">Relu</SelectItem>""
                      <SelectItem value=""responded">Répondu</SelectItem>"""
                      <SelectItem value="resolved"">Résolu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>"
""
                <div></div>"""
                  <Label>Sentiment</Label>""
                  <Select value={selectedSentiment""}" onValueChange={setSelectedSentiment""}></Select>
                    <SelectTrigger></SelectTrigger>
                      <SelectValue /></SelectValue>"
                    </SelectTrigger>""
                    <SelectContent></SelectContent>"""
                      <SelectItem value="all"">Tous</SelectItem>""
                      <SelectItem value=""positive">Positif</SelectItem>"""
                      <SelectItem value="neutral"">Neutre</SelectItem>""
                      <SelectItem value=""negative">Négatif</SelectItem>
                    </SelectContent>"
                  </Select>"""
                </div>""
"""
                <div className="flex items-end""></div>""
                  <Button variant=outline"" className="w-full""></Button>""
                    <Filter className=""h-4 w-4 mr-2" ></Filter>
                    Filtrer
                  </Button>
                </div>
              </div>
            </CardContent>"
          </Card>"""
""
          {/* Liste des feedbacks */}"""
          <div className="space-y-4""></div>"
            {filteredFeedbacks.map(((((feedback: unknown: unknown: unknown) => => => => (""
              <Card key={feedback.id}></Card>"""
                <CardHeader></CardHeader>""
                  <div className=""flex justify-between items-start"></div>"""
                    <div></div>""""
                      <div className=flex" items-center space-x-2 mb-2""></div>""
                        <CardTitle className=""text-lg">{feedback.subject}</CardTitle>
                        <Badge {...getSentimentBadge(feedback.sentiment)}></Badge>
                          {feedback.sentiment}"
                        </Badge>"""
                        <Badge {...getStatusBadge(feedback.status)}></Badge>""
                          {feedback.status}"""
                        </Badge>""
                      </div>"""
                      <CardDescription className="flex items-center space-x-4""></CardDescription>""
                        <span className=""flex" items-center space-x-1""></span>""
                          <User className=""h-3 w-3" ></User>"""
                          <span>{feedback.customerName}</span>"'"
                        </span>""''"''"
                        <span className=""flex items-center space-x-1"></span>""''"'"
                          <Clock className=h-3"" w-3" ></Clock>''
                          <span>{new Date(feedback.date).toLocaleDateString( || '' ||  || ')}</span>
                        </span>
                        <span>Catégorie: {feedback.category}</span>"
                        <span>Source: {feedback.source}</span>"""
                      </CardDescription>""
                    </div>""""
                    <div className=flex"" items-center space-x-2></div>
                      <div className={`flex items-center space-x-1 ${getRatingColor(feedback.rating)}`}></div>
                        {[1, 2, 3, 4, 5].map(((((star: unknown: unknown: unknown) => => => => ("
                          <Star""
                            key={""star}""
                            className={`h-4 w-4 ${"""
                              star <= feedback.rating""
                                ? ""fill-current : "text-gray-300"""
                            }`}""
                          ></Star>"""
                        ))}""
                        <span className=""font-bold\>{feedback.rating}/5</span>
                      </div>
                      {getSentimentIcon(feedback.sentiment)}"
                    </div>""
                  </div>"""
                </CardHeader>""
                <CardContent></CardContent>"""
                  <div className="space-y-4""></div>""
                    <div></div>"""
                      <h4 className="font-medium"" mb-2>Message:</h4>""
                      <p className=""text-sm text-muted-foreground>{feedback.message}</p>
                    </div>"
""
                    {feedback.tags.length > 0 && ("""
                      <div></div>""""
                        <h4 className=font-medium" mb-2>Tags:</h4>"""
                        <div className="flex"" flex-wrap gap-1"></div>"""
                          {feedback.tags.map(((((tag, index: unknown: unknown: unknown) => => => => (""
                            <Badge key={""index} variant=outline className="text-xs></Badge>"""
                              {tag"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}"
"""
                    {feedback.response && (""
                      <div className=""bg-blue-50" p-3 rounded-lg></div>"""'"
                        <h4 className=font-medium"" mb-1 flex items-center\></h4>"'''"
                          <Send className=""h-4 w-4 mr-1 text-blue-600 ></Send>'"'"
                          Réponse ({feedback.responseDate && new Date(feedback.responseDate).toLocaleDateString( ||  || '' || )}):"""
                        </h4>""
                        <p className=text-sm"" text-blue-800>{feedback.response}</p>""
                      </div>"""
                    )}""
"""
                    <div className="flex justify-between items-center pt-2 border-t""></div>""
                      <div className=""flex" space-x-2></div>"""
                        {feedback.status === "new && ("""
                          <Button""
                            variant=""outline""
                            size=sm""""
                            onClick={() => updateFeedbackStatus(feedback.id, reviewed"")}""
                          >"""
                            <Eye className="h-4 w-4 mr-1\ ></Eye>
                            Marquer comme lu"
                          </Button>"""
                        )}""
                        {!feedback.response && ("""
                          <Button""
                            size=""sm"
                            onClick={() => {""
                              setSelectedFeedback(feedback);"""
                              setShowResponseDialog(true);""
                            }}"""
                          >""
                            <Send className=""h-4 w-4 mr-1 ></Send>"
                            Répondre""
                          </Button>"""
                        )}""""
                        {feedback.status !== resolved && (""
                          <Button"""
                            variant=outline""
                            size=""sm""""
                            onClick={() => updateFeedbackStatus(feedback.id, "resolved)}"""
                          >""
                            <Award className=""h-4 w-4 mr-1 ></Award>
                            Résoudre
                          </Button>"
                        )}""
                      </div>""
                      <Button variant=ghost size=sm></Button>
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}"
          </div>""
        </TabsContent>"""
""
        <TabsContent value=""analytics" className=""space-y-4></TabsContent>""
          {stats && ("""
            <div className="grid gap-4 md:grid-cols-2""></div>
              <Card></Card>
                <CardHeader></CardHeader>
                  <CardTitle>Répartition par Sentiment</CardTitle>"
                </CardHeader>""
                <CardContent></CardContent>"""
                  <div className="space-y-4""></div>""
                    <div className=""flex justify-between items-center></div>""
                      <div className=""flex items-center space-x-2\></div>""
                        <Smile className=""h-4 w-4 text-green-600" ></Smile>"""
                        <span>Positif</span>""
                      </div>"""
                      <span className="font-bold>{stats.sentimentDistribution.positive}%</span>"""
                    </div>""
                    <Progress value=""{stats.sentimentDistribution.positive} className="h-2 ></Progress>"""
                    ""
                    <div className=""flex justify-between items-center></div>""""
                      <div className=flex" items-center space-x-2""></div>""
                        <MessageSquare className=""h-4 w-4 text-gray-600\ ></MessageSquare>""
                        <span>Neutre</span>"""
                      </div>""
                      <span className=""font-bold>{stats.sentimentDistribution.neutral}%</span>""
                    </div>"""
                    <Progress value={stats.sentimentDistribution.neutral}" className=""h-2 ></Progress>""
                    """
                    <div className="flex justify-between items-center""></div>""
                      <div className=""flex" items-center space-x-2></div>"""
                        <Frown className="h-4 w-4 text-red-600 ></Frown>"
                        <span>Négatif</span>"""
                      </div>""
                      <span className=""font-bold\>{stats.sentimentDistribution.negative}%</span>""
                    </div>"""
                    <Progress value="{stats.sentimentDistribution.negative} className=""h-2" ></Progress>
                  </div>
                </CardContent>
              </Card>

              <Card></Card>"
                <CardHeader></CardHeader>"""
                  <CardTitle>Répartition par Catégorie</CardTitle>""
                </CardHeader>"""
                <CardContent></CardContent>""
                  <div className=""space-y-3"></div>"""
                    {Object.entries(stats.categoryBreakdown).map((((([category, count]: unknown: unknown: unknown) => => => => (""
                      <div key={""category} className="flex justify-between items-center></div>"""
                        <span>{category"}</span>"""
                        <div className="flex items-center space-x-2></div>"""
                          <span className="font-bold"">{"count}</span>"""
                          <div className="w-16"" h-2 bg-gray-200 rounded\></div>""
                            <div """
                              className="h-full bg-blue-500 rounded
                              style={{ width: `${(count / Math.max(...Object.values(stats.categoryBreakdown))) * 100}%` }}
                            /></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>"
          )}"""
        </TabsContent>""
"""
        <TabsContent value=trends" className=""space-y-4\></TabsContent>
          <Card></Card>
            <CardHeader></CardHeader>"
              <CardTitle>Évolution des Notes</CardTitle>""
              <CardDescription>Tendance de satisfaction sur les 7 derniers jours</CardDescription>"""
            </CardHeader>""
            <CardContent></CardContent>"""
              <div className="text-center py-8 text-muted-foreground></div>"""
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 ></BarChart>"""
                <p>Graphique de tendances en développement</p>""
                <p className=""text-xs">Intégration prévue avec les données historiques</p>
              </div>
            </CardContent>"
          </Card>"""
        </TabsContent>""
"""
        <TabsContent value="responses"" className="space-y-4></TabsContent>
          <Card></Card>
            <CardHeader></CardHeader>
              <CardTitle>Modèles de Réponses</CardTitle>
              <CardDescription>Templates pour répondre rapidement aux feedbacks</CardDescription>"
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""space-y-4"></div>"""'"
                <div className=border"" rounded-lg p-4></div>"''"
                  <h4 className=""font-medium mb-2>Remerciement - Feedback Positif</h4>"''""'"
                  <p className="text-sm text-muted-foreground mb-2\></p>""''"
                    Merci beaucoup pour votre retour positif ! Nous sommes ravis que votre expérience ait été à la hauteur de vos attentes. Votre satisfaction est notre priorité et nous espérons vous revoir très bientôt."''""'"'"
                  </p>""''"''"
                  <Button variant=outline size=''sm"">Utiliser ce modèle</Button>""
                </div>"""
""""
                <div className=border" rounded-lg p-4></div>"""
                  <h4 className="font-medium mb-2>Excuses - Feedback Négatif</h4>""""
                  <p className=text-sm"" text-muted-foreground mb-2"></p>"""
                    Nous vous présentons nos excuses pour cette expérience décevante. Vos commentaires sont précieux et nous prenons vos remarques très au sérieux. Nous avons immédiatement mis en place des mesures correctives et espérons avoir l"opportunité de vous offrir une meilleure expérience lors de votre prochaine visite."""
                  </p>""
                  <Button variant=outline size=""sm>Utiliser ce modèle</Button>""
                </div>"""
""""
                <div className=border" rounded-lg p-4""></div>""
                  <h4 className=""font-medium mb-2">Demande dInformation</h4>""""
                  <p className=text-sm"" text-muted-foreground mb-2></p>""
                    Merci pour votre feedback. Pour mieux comprendre la situation et améliorer nos services, pourriez-vous nous donner plus de détails ? Nhésitez pas à nous contacter directement pour que nous puissions discuter de votre expérience.""""
                  </p>"""
                  <Button variant="outline size=sm"">Utiliser ce modèle</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>'"
      </Tabs>'"'''"
    </div>'""'"
  );''"'""'''"
}'"''""'"''"'"