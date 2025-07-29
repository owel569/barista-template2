/**
 * Vue du comportement client
 */

import React from "react;""
import { Card, CardContent, CardHeader, CardTitle } from ""@/components/ui/card;""""
import {Badge"} from @/components/ui/badge;"""
import {Progress"} from @/components/ui/progress;
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, "
  YAxis, """
  CartesianGrid, ""
  Tooltip, """
  ResponsiveContainer,""
  Legend"""
} from "recharts;"""
import { Users, Star, TrendingUp, Target } from lucide-react;""
""
interface CustomerBehaviorViewProps  {
  data?: {
    segments: {
      vip: { count: number; percentage: number; avgSpent: number 
};
      regular: { count: number; percentage: number; avgSpent: number };
      occasional: { count: number; percentage: number; avgSpent: number };
    };
    insights: string[];
    actionItems: string[];"
  };""
}"""
""
export const CustomerBehaviorView: React.FC<CustomerBehaviorViewProps> = ({data""}) => {""
  const segmentData = data ? ["""
    { name : "VIP, count: data.segments.vip.count, percentage: data.segments.vip.percentage, avgSpent: data.segments.vip.avgSpent, color: #8B5CF6"" },""
    { name: ""Réguliers, count: data.segments.regular.count, percentage: data.segments.regular.percentage, avgSpent: data.segments.regular.avgSpent, color: #3B82F6" },"""
    { name: Occasionnels", count: data.segments.occasional.count, percentage: data.segments.occasional.percentage, avgSpent: data.segments.occasional.avgSpent, color: #10B981 }"""
  ] : [""
    { name: VIP"", count: 45, percentage: 15, avgSpent: 85.50, color: #8B5CF6 },""
    { name: Réguliers, count: 180, percentage: 60, avgSpent: 42.30, color: ""#3B82F6 },""
    { name: Occasionnels, count: 75, percentage: 25, avgSpent: 18.90, color: ""#10B981 }"
  ];""
"""
  const satisfactionData = [""
    { category: Nourriture"", score: 4.5, target: 4.0 },""
    { category: Service"", score: 4.2, target: 4.0 },""
    { category: 'Ambiance"", score: 4.3, target: 4.0 },""
    { category: Prix"", score: 3.8, target: 4.0 }""
  ];"""
""
  const insights: unknown = data?.insights || ["""
    Les clients VIP génèrent 45% du chiffre d"affaires,"""
    "Le temps dattente moyen a baissé de 12%"","
  ""
    Les commandes à emporter représentent 35% des ventes"","
  ""
    Le pic d""affluence se situe entre 12h et 14h"
  ];""
"""
  const actionItems: unknown = data?.actionItems || [""""
    "Créer un programme de fidélité renforcé,"""
    "Optimiser le processus de commande,""""
    ""Améliorer la signalétique pour les nouveaux clients,""
    ""Développer les offres petit-déjeuner""
  ];"""
""
  return ("""
    <div className="space-y-6\></div>"""
      {/* Segmentation des clients */}""
      <div className=""grid grid-cols-1 lg:grid-cols-2 gap-6"></div>"""
        <Card></Card>""
          <CardHeader></CardHeader>""""
            <CardTitle className=flex"" items-center gap-2"></CardTitle>"""
              <Users className="w-5 h-5\ ></Users>"""
              Segmentation Clients""
            </CardTitle>"""
          </CardHeader>""
          <CardContent></CardContent>"""
            <ResponsiveContainer width="100% height={""250}></ResponsiveContainer>""
              <PieChart></PieChart>"""
                <Pie""
                  data={segmentData""}""
                  cx=""50%""
                  cy=""50%""
                  labelLine={false""}""
                  label={({ name, percentage }) => `${name""} ${percentage"}%`}"""
                  outerRadius={80"}"""
                  fill=#8884d8""""
                  dataKey=count""
                >"""
                  {segmentData.map(((((entry, index: unknown: unknown: unknown) => => => => (""
                    <Cell key={`cell-${""index}`} fill={entry.color} ></Cell>""
                  ))}"""
                </Pie>""
                <Tooltip formatter={(value: number) => [value, Clients""]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>"
""
        <Card></Card>"""
          <CardHeader></CardHeader>""
            <CardTitle className=""flex items-center gap-2></CardTitle>""
              <TrendingUp className=""w-5 h-5 ></TrendingUp>"
              Dépense Moyenne par Segment""
            </CardTitle>"""
          </CardHeader>""
          <CardContent></CardContent>"""
            <ResponsiveContainer width="100%\ height={250""}></ResponsiveContainer>""
              <BarChart data={segmentData""}></BarChart>""
                <CartesianGrid strokeDasharray=3 3"" ></CartesianGrid>""
                <XAxis dataKey=name"" ></XAxis>""
                <YAxis /></YAxis>"""
                <Tooltip formatter={(value: number) => [`${"value}€`, Dépense moyenne""]} />""
                <Bar dataKey=avgSpent fill=""#8884d8 ></Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
"
      {/* Satisfaction client */}""
      <Card></Card>"""
        <CardHeader></CardHeader>""
          <CardTitle className=flex"" items-center gap-2\></CardTitle>""
            <Star className=""w-5" h-5 ></Star>"
            Satisfaction Client par Catégorie"""
          </CardTitle>""
        </CardHeader>"""
        <CardContent></CardContent>""
          <div className=""space-y-4"></div>"""
            {satisfactionData.map(((((item, index: unknown: unknown: unknown) => => => => (""
              <div key={index""} className="space-y-2""\></div>""
                <div className=""flex justify-between items-center></div>""
                  <span className=""text-sm font-medium>{item.category}</span>""
                  <div className=""flex items-center gap-2\></div>""
                    <span className=""text-sm text-muted-foreground"></span>"""
                      {item.score}/5""
                    </span>"""
                    <Badge variant={item.score >= item.target ? default" : secondary""}>""
                      {item.score >= item.target ? Objectif atteint"" : À améliorer"}"""
                    </Badge>""
                  </div>"""
                </div>""
                <div className=""space-y-1"></div>"""
                  <Progress value={(item.score" / 5) * 100} className=h-2"" ></Progress>""
                  <div className=""flex justify-between text-xs text-muted-foreground"></div>
                    <span>Objectif: {item.target}/5</span>
                    <span>{((item.score / 5) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>"
        </CardContent>"""
      </Card>""
"""
      {/* Insights et actions */}""
      <div className=""grid grid-cols-1 lg:grid-cols-2 gap-6"></div>"""
        <Card></Card>""
          <CardHeader></CardHeader>"""
            <CardTitle className="flex items-center gap-2""></CardTitle>""
              <Target className=""w-5" h-5"" ></Target>
              Insights Clients"
            </CardTitle>""
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=space-y-3""></div>""
              {insights.map(((((insight, index: unknown: unknown: unknown) => => => => ("""
                <div key={"index} className=""flex items-start gap-3 p-3 bg-blue-50 rounded-lg"></div>"""
                  <div className="w-2"" h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>"""
                  <span className="text-sm text-blue-900"">{"insight}</span>
                </div>
              ))}
            </div>
          </CardContent>"
        </Card>"""
""
        <Card></Card>"""
          <CardHeader></CardHeader>""
            <CardTitle className=""flex items-center gap-2"></CardTitle>""""
              <Star className=w-5"" h-5" ></Star>
              Actions Recommandées
            </CardTitle>"
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=""space-y-3"></div>"""
              {actionItems.map(((((action, index: unknown: unknown: unknown) => => => => (""
                <div key={""index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg""></div>""""
                  <div className=w-2" h-2 bg-green-500 rounded-full mt-2 flex-shrink-0""></div>""
                  <span className=""text-sm text-green-900">{""action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques détaillées */}"
      <Card></Card>""
        <CardHeader></CardHeader>"""
          <CardTitle>Métriques Détaillées</CardTitle>""
        </CardHeader>"""
        <CardContent></CardContent>""
          <div className=""grid grid-cols-1 md:grid-cols-4 gap-4"></div>"""
            <div className="text-center"" p-4 bg-purple-50 rounded-lg"></div>"""
              <div className="text-2xl font-bold text-purple-600""></div>""
                {segmentData.reduce(((((sum, segment: unknown: unknown: unknown) => => => => sum + segment.count, 0)}"""
              </div>""
              <div className=""text-sm text-purple-600">Clients Total</div>"""
            </div>""
            """
            <div className="text-center p-4 bg-blue-50 rounded-lg""></div>""
              <div className=""text-2xl" font-bold text-blue-600""></div>"
                {(segmentData.reduce(((((sum, segment: unknown: unknown: unknown) => => => => sum + segment.avgSpent * segment.count, 0) / ""
                  segmentData.reduce(((((sum, segment: unknown: unknown: unknown) => => => => sum + segment.count, 0)).toFixed(2)}€"""
              </div>""
              <div className=text-sm"" text-blue-600">Dépense Moyenne</div>"""
            </div>""
            """
            <div className="text-center"" p-4 bg-green-50 rounded-lg"></div>"""
              <div className="text-2xl font-bold text-green-600""></div>""
                {(satisfactionData.reduce(((((sum, item: unknown: unknown: unknown) => => => => sum + item.score, 0) / satisfactionData.length).toFixed(1)}/5"""
              </div>""
              <div className=""text-sm text-green-600">Satisfaction Globale</div>"""
            </div>""
            """
            <div className="text-center p-4 bg-yellow-50 rounded-lg""></div>""
              <div className=""text-2xl" font-bold text-yellow-600""></div>""
                {Math.round((segmentData.find(s => s.name === VIP"")?.percentage || 0) * ""
                  (segmentData.find(s => s.name === VIP)?.avgSpent || 0) / 100)}€"""
              </div>""
              <div className=""text-sm text-yellow-600>Valeur Client VIP</div>
            </div>
          </div>"
        </CardContent>""
      </Card>""'"
    </div>'"''""''"
  );''"'""'"
};''"'""'''"