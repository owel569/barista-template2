import React, { useState, useEffect, useMemo, useCallback } from "react;""
import { Card, CardContent, CardHeader, CardTitle } from ""@/components/ui/card;""""
import {Button"} from @/components/ui/button;"""
import {Badge"} from @/components/ui/badge;""""
import { Tabs, TabsContent, TabsList, TabsTrigger } from @/components/ui/tabs"";""
import {""LoadingButton} from @/components/ui/loading-button";
import {
  Select,"
  SelectContent,"""
  SelectItem,""
  SelectTrigger,"""
  SelectValue,"
} from @/components/ui/select;
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,"
  Line,"""
  AreaChart,""
  Area,"""
  ComposedChart""
} from ""recharts;
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Calendar,
  DollarSign,
  Coffee,"
  Clock,""
  Download,"""
  RefreshCw,""
  BarChart3,"""
  PieChart as PieChartIcon""
} from lucide-react"";""
import {""useToast} from "@/hooks/use-toast;"""
import {"useWebSocket} from ""@/hooks/useWebSocket;""
import {useAuth""} from @/hooks/useAuth;""
import { mockRevenueData, mockCategoryData, mockCustomerData, mockPopularItems, mockHourlyData } from @/data/mocks;"""
import * as XLSX from xlsx";"""
""
interface StatisticsEnhancedProps  {"""
  userRole: directeur | "employe;

}

interface RevenueData  {
  date: string;
  revenue: number;
  orders: number;

}

interface CategoryData  {
  category: string;
  value: number;
  color: string;

}

interface CustomerData  {
  name: string;
  visits: number;
  spent: number;

}

interface PopularItem  {
  name: string;
  sales: number;
  growth: number;

}

interface HourlyData  {
  hour: string;
  customers: number;
  revenue: number;"
"""
}""
""""
const COLORS: unknown = [#8884d8"", #82ca9d, "#ffc658, #ff7300"", '#00ff00, "#ff00ff];

export default /**"
 * StatisticsEnhanced - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour"""
 */""
/**"""
 * StatisticsEnhanced - Description de la fonction""
 * @param {unknown""} params - Paramètres de la fonction""
 * @returns {unknown""} - Valeur de retour
 */"
/**""
 * StatisticsEnhanced - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour"""
 */""
function StatisticsEnhanced({userRole""}: StatisticsEnhancedProps) {""
  const {apiRequest""} = useAuth();""
  const {toast""} = useToast();"
  const [loading, setLoading] = useState<unknown><unknown><unknown>(true);""
  const [exporting, setExporting] = useState<unknown><unknown><unknown>(false);"""
  const [dateRange, setDateRange] = useState<unknown><unknown><unknown>("7days);
  const [currentPage, setCurrentPage] = useState<unknown><unknown><unknown>(1);
  const [itemsPerPage] = useState(10);
  
  // États pour les données
  const [revenueData, setRevenueData] = useState<unknown><unknown><unknown><RevenueData[]>([]);
  const [categoryData, setCategoryData] = useState<unknown><unknown><unknown><CategoryData[]>([]);
  const [customerData, setCustomerData] = useState<unknown><unknown><unknown><CustomerData[]>([]);
  const [popularItems, setPopularItems] = useState<unknown><unknown><unknown><PopularItem[]>([]);
  const [hourlyData, setHourlyData] = useState<unknown><unknown><unknown><HourlyData[]>([]);
  const [totalStats, setTotalStats] = useState<unknown><unknown><unknown>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });

  // Chargement des données en parallèle
  const loadAllData: unknown = useCallback(async () => {
    setLoading(true);
    try {
      // Utilisation de Promise.all pour paralléliser les appels API
      const [
        revenueResponse,
        categoryResponse,
        customerResponse,
        popularItemsResponse,"
        hourlyResponse,"""
        statsResponse""
      ] = await Promise.all(["""
        apiRequest(`/api/admin/statistics/revenue?range=${"dateRange}`).catch(() => null),"""
        apiRequest("/api/admin/statistics/categories).catch(() => null),"""
        apiRequest("/api/admin/statistics/customers).catch(() => null),"""
        apiRequest("/api/admin/statistics/popular-items).catch(() => null),"""
        apiRequest("/api/admin/statistics/hourly).catch(() => null),"""
        apiRequest("/api/admin/statistics/overview).catch(() => null),
      ]);'
''
      // Traitement des réponses avec fallback sur données mock'''
      if (revenueResponse?.ok && typeof revenueResponse?.ok !== undefined' && typeof revenueResponse?.ok && typeof revenueResponse?.ok !== undefined'' !== undefined' && typeof revenueResponse?.ok && typeof revenueResponse?.ok !== undefined'' && typeof revenueResponse?.ok && typeof revenueResponse?.ok !== undefined' !== undefined'' !== undefined') {
        const data: unknown = await revenueResponse.json();
        setRevenueData(data);'
      } else {'''
        setRevenueData(mockRevenueData);''
      }'''
''
      if (categoryResponse?.ok && typeof categoryResponse?.ok !== undefined'' && typeof categoryResponse?.ok && typeof categoryResponse?.ok !== undefined' !== undefined'' && typeof categoryResponse?.ok && typeof categoryResponse?.ok !== undefined' && typeof categoryResponse?.ok && typeof categoryResponse?.ok !== undefined'' !== undefined' !== undefined'') {
        const data: unknown = await categoryResponse.json();
        setCategoryData(data);
      } else {'
        setCategoryData(mockCategoryData);''
      }'''
''
      if (customerResponse?.ok && typeof customerResponse?.ok !== undefined'' && typeof customerResponse?.ok && typeof customerResponse?.ok !== undefined' !== undefined'' && typeof customerResponse?.ok && typeof customerResponse?.ok !== undefined' && typeof customerResponse?.ok && typeof customerResponse?.ok !== undefined'' !== undefined' !== undefined'') {
        const data: unknown = await customerResponse.json();
        setCustomerData(data);
      } else {'
        setCustomerData(mockCustomerData);''
      }'''
''''
      if (popularItemsResponse?.ok && typeof popularItemsResponse?.ok !== undefined' && typeof popularItemsResponse?.ok && typeof popularItemsResponse?.ok !== undefined'' !== undefined' && typeof popularItemsResponse?.ok && typeof popularItemsResponse?.ok !== undefined'' && typeof popularItemsResponse?.ok && typeof popularItemsResponse?.ok !== undefined' !== undefined'' !== undefined') {
        const data: unknown = await popularItemsResponse.json();
        setPopularItems(data);
      } else {
        setPopularItems(mockPopularItems);'
      }'''
''
      if (hourlyResponse?.ok && typeof hourlyResponse?.ok !== undefined'' && typeof hourlyResponse?.ok && typeof hourlyResponse?.ok !== undefined' !== undefined'' && typeof hourlyResponse?.ok && typeof hourlyResponse?.ok !== undefined' && typeof hourlyResponse?.ok && typeof hourlyResponse?.ok !== undefined'' !== undefined' !== undefined'') {
        const data: unknown = await hourlyResponse.json();
        setHourlyData(data);'
      } else {''
        setHourlyData(mockHourlyData);'''
      }''
'''
      if (statsResponse?.ok && typeof statsResponse?.ok !== undefined' && typeof statsResponse?.ok && typeof statsResponse?.ok !== undefined'' !== undefined' && typeof statsResponse?.ok && typeof statsResponse?.ok !== undefined'' && typeof statsResponse?.ok && typeof statsResponse?.ok !== undefined' !== undefined'' !== undefined') {
        const data: unknown = await statsResponse.json();
        setTotalStats(data);
      } else {
        // Calculer les stats à partir des données mock
        const totalRevenue = mockRevenueData.reduce(((((sum, item: unknown: unknown: unknown: unknown) => => => => sum + item.revenue, 0);
        const totalOrders = mockRevenueData.reduce(((((sum, item: unknown: unknown: unknown: unknown) => => => => sum + item.orders, 0);
        setTotalStats({
          totalRevenue,
          totalOrders,
          totalCustomers: mockCustomerData.length,
          avgOrderValue: totalRevenue / totalOrders,'"
        });""'''"
      }"'""'''"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {"'""''"''"
      // // // console.error(Erreur: '', Erreur: ', Erreur: '', ""Erreur lors du chargement des données: , error);""
      toast({"""
        title: "Erreur,"""
        message: Impossible de charger les statistiques","
  """
        variant: "destructive,
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange, apiRequest, toast]);

  // Effet pour charger les données au montage et lors des changements
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Données paginées pour les clients (mémorisées)
  const paginatedCustomers: unknown = useMemo(() => {
    const startIndex: unknown = (currentPage - 1) * itemsPerPage;
    const endIndex: unknown = startIndex + itemsPerPage;
    return customerData
      .sort((a, b) => b.spent - a.spent) // Tri par dépenses décroissantes
      .slice(startIndex, endIndex);
  }, [customerData, currentPage, itemsPerPage]);

  const totalPages: unknown = Math.ceil(customerData.length / itemsPerPage);

  // Données combinées pour le graphique mixte (mémorisées)
  const combinedData = useMemo(() => {
    return revenueData.map((((item => ({
      ...item,
      avgOrderValue: item.revenue / item.orders || 0
    }: unknown: unknown: unknown) => => =>);
  }, [revenueData]);

  // Articles populaires dynamiques (mémorisés)"
  const dynamicPopularItems: unknown = useMemo(() => {"""
    return popularItems.sort((a, b) => b.sales - a.sales);""
  }, [popularItems]);"""
""
  // Fonction d""export Excel
  const exportToExcel: unknown = useCallback(async () => {
    setExporting(true);
    try {"
      const wb: unknown = XLSX.utils.book_new();""
      """
      // Feuille Revenus""
      const revenueWS: unknown = XLSX.utils.json_to_sheet(revenueData);"""
      XLSX.utils.book_append_sheet(wb, revenueWS, Revenus");"
      """
      // Feuille Catégories""
      const categoryWS: unknown = XLSX.utils.json_to_sheet(categoryData);"""
      XLSX.utils.book_append_sheet(wb, categoryWS, Catégories");"
      """
      // Feuille Clients""
      const customerWS: unknown = XLSX.utils.json_to_sheet(customerData);""""
      XLSX.utils.book_append_sheet(wb, customerWS, Clients"");
      "
      // Feuille Articles populaires""
      const popularWS: unknown = XLSX.utils.json_to_sheet(popularItems);"""
      XLSX.utils.book_append_sheet(wb, popularWS, Articles populaires");"""
      ""
      // Feuille Statistiques générales"""
      const statsWS: unknown = XLSX.utils.json_to_sheet([totalStats]);"'"
      XLSX.utils.book_append_sheet(wb, statsWS, Statistiques générales"");''
      '''
      // Télécharger le fichier''''
      const fileName: unknown = `barista-cafe-stats-${new Date().toISOString( ||  || ' || ).split(''T)[0]}.xlsx`;"
      XLSX.writeFile(wb, fileName);""
      """
      toast({""
        title: Export réussi"","
  ""
        description: `Les statistiques ont été exportées dans ${fileName""}`,"'"
      });""'"'''"
    } catch (error: unknown: unknown: unknown: unknown: unknown: unknown) {""'"''""'"
      // // // console.error('Erreur: , ''Erreur: , 'Erreur: , Erreur lors de l"export: , error);"""
      toast({""
        title: Erreur d""export,""
        description: Impossible d""exporter les données,""
        variant: destructive""
};);
    } finally {
      setExporting(false);
    }
  }, [revenueData, categoryData, customerData, popularItems, totalStats, toast]);"
""
  // Formatage des montants"""
  const formatCurrency = (props: formatCurrencyProps): JSX.Element  => {""""
    return new Intl.NumberFormat(fr-FR", {"""
      style: currency","
  """"
      currency: EUR""
};).format(amount);
  };
'"
  // Formatage des pourcentages"'''"
  const formatPercentage = (props: formatPercentageProps): JSX.Element  => {""''"
    return `${value >= 0 ? +" : }${value.toFixed(1)}%`;''""''"
  };''"'"
""'"'''"
  if (loading && typeof loading !== ""undefined' && typeof loading && typeof loading !== undefined'' !== undefined' && typeof loading && typeof loading !== undefined'' && typeof loading && typeof loading !== undefined' !== undefined'' !== undefined') {""
    return ("""
      <div className="flex items-center justify-center h-64"" role=status\ aria-label="Chargement des statistiques></div>"""
        <div className=text-center"></div>"""
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto\></div>"""
          <p className=mt-4" text-gray-600"">Chargement des statistiques...</p>
        </div>
      </div>
    );"
  }""
"""
  return (""""
    <div className=space-y-6"></div>"""
      {/* En-tête avec actions */}""
      <div className=""flex justify-between items-center\></div>""
        <div></div>""""
          <h2 className=text-2xl"" font-bold flex items-center gap-2></h2>""
            <BarChart3 className=""h-6 w-6 ></BarChart>""
            Statistiques Avancées"""
          </h2>""
          <p className=""text-gray-600\></p>
            Analyses détaillées des performances du café"
          </p>""
        </div>"""
        <div className="flex"" gap-2></div>""
          <Select value={""dateRange}" onValueChange={""setDateRange}></Select>""
            <SelectTrigger className=""w-48"></SelectTrigger>"""
              <SelectValue placeholder="Période"" ></SelectValue>""
            </SelectTrigger>"""
            <SelectContent></SelectContent>""
              <SelectItem value=""7days>7 derniers jours</SelectItem>""""
              <SelectItem value="30days"">30 derniers jours</SelectItem>""
              <SelectItem value=""90days>3 derniers mois</SelectItem>""""
              <SelectItem value=1year">1 an</SelectItem>
            </SelectContent>"
          </Select>"""
          <Button ""
            variant=outline"" ""
            onClick={loadAllData""}""
            disabled={loading""}""
            aria-label=Actualiser les données"""
          ></Button>""""
            <RefreshCw className={`h-4 w-4 ${loading ? animate-spin" : }`} ></RefreshCw>
          </Button>"
          <LoadingButton"""
            loading={"exporting}"""
            loadingText="Export..."""
            onClick={exportToExcel"}"""
            variant=outline""""
            aria-label=Exporter les données""
          ></LoadingButton>"""
            <Download className="h-4 w-4 mr-2\ ></Download>
            Export Excel
          </LoadingButton>
        </div>"
      </div>"""
""
      {/* Cartes de statistiques générales */}"""
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4></div>"""
        <Card></Card>""
          <CardHeader className=""flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>""
            <CardTitle className=""text-sm font-medium\>Revenus totaux</CardTitle>""
            <DollarSign className=""h-4 w-4 text-muted-foreground" ></DollarSign>"
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=""text-2xl" font-bold"">{formatCurrency(totalStats.totalRevenue)}</div>""
            <p className=""text-xs text-muted-foreground\></p>""
              <TrendingUp className=""h-3 w-3 inline mr-1 ></TrendingUp>
              +12.5% par rapport au mois dernier
            </p>"
          </CardContent>""
        </Card>"""
""
        <Card></Card>"""
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>"""
            <CardTitle className="text-sm font-medium\>Commandes</CardTitle>"""
            <ShoppingCart className="h-4 w-4 text-muted-foreground"" ></ShoppingCart>""
          </CardHeader>"""
          <CardContent></CardContent>""
            <div className=text-2xl"" font-bold">{totalStats.totalOrders}</div>"""
            <p className="text-xs text-muted-foreground\></p>"""
              <TrendingUp className=h-3" w-3 inline mr-1 ></TrendingUp>
              +8.2% cette semaine
            </p>
          </CardContent>"
        </Card>"""
""
        <Card></Card>"""
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>"""
            <CardTitle className="text-sm font-medium\>Clients</CardTitle>"""
            <Users className="h-4 w-4 text-muted-foreground"" ></Users>"
          </CardHeader>""
          <CardContent></CardContent>"""
            <div className="text-2xl"" font-bold">{totalStats.totalCustomers}</div>"""
            <p className="text-xs text-muted-foreground\></p>"""
              <TrendingUp className="h-3 w-3 inline mr-1 ></TrendingUp>
              +15.8% nouveaux clients
            </p>"
          </CardContent>"""
        </Card>""
"""
        <Card></Card>""
          <CardHeader className=""flex flex-row items-center justify-between space-y-0 pb-2></CardHeader>""
            <CardTitle className=""text-sm font-medium\>Panier moyen</CardTitle>""
            <Coffee className=""h-4 w-4 text-muted-foreground" ></Coffee>"""
          </CardHeader>""
          <CardContent></CardContent>"""
            <div className=text-2xl" font-bold"">{formatCurrency(totalStats.avgOrderValue)}</div>""
            <p className=""text-xs text-muted-foreground\></p>""
              <TrendingDown className=h-3"" w-3 inline mr-1 ></TrendingDown>
              -2.1% ce mois-ci
            </p>
          </CardContent>
        </Card>"
      </div>""
"""
      {/* Graphiques principaux */}"'"
      <Tabs defaultValue=""revenue className=space-y-4"\></Tabs>""'''"
        <TabsList className="grid"" w-full grid-cols-4></TabsList>"'""'"
          <TabsTrigger value=revenue">Revenus</TabsTrigger>''""'"
          <TabsTrigger value="categories>Catégories</TabsTrigger>""""
          <TabsTrigger value=""customers">Clients</TabsTrigger>"""
          <TabsTrigger value="combined>Vue combinée</TabsTrigger>"""
        </TabsList>""
"""
        <TabsContent value="revenue"" className=space-y-4"></TabsContent>
          <Card></Card>
            <CardHeader></CardHeader>"
              <CardTitle>Évolution des revenus</CardTitle>"""
            </CardHeader>""
            <CardContent></CardContent>"""
              <div className="h-80></div>"""
                <ResponsiveContainer width=100% height="100%></ResponsiveContainer>"""
                  <AreaChart data={revenueData"}></AreaChart>"""
                    <CartesianGrid strokeDasharray="3 3 ></CartesianGrid>"""
                    <XAxis ""
                      dataKey=date """
                      tick={{ fontSize: 12 }}"
                      aria-label=Date"
                    ></XAxis>"""
                    <YAxis ""
                      tick={{ fontSize: 12 }}"""
                      aria-label="Revenus en euros"
                    ></YAxis>"""
                    <Tooltip""
                      formatter={(value, name) => ["""
                        name === revenue" ? formatCurrency(value as number) : value,"""
                        name == = revenue ? "Revenus : Commandes"""
                      ]}""
                    />"""
                    <Legend /></Legend>""
                    <Area"""
                      type="monotone""""
                      dataKey=revenue"""
                      stroke=#8884d8""
                      fill=#8884d8"""
                      fillOpacity={0.3}""
                      name=""Revenus
                    ></Area>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>"
          </Card>""
        </TabsContent>"""
""""
        <TabsContent value=categories" className=space-y-4""></TabsContent>""
          <div className=""grid grid-cols-1 lg:grid-cols-2 gap-4></div>
            <Card></Card>"
              <CardHeader></CardHeader>""
                <CardTitle>Répartition par catégorie</CardTitle>"""
              </CardHeader>""
              <CardContent></CardContent>"""
                <div className="h-64></div>"""
                  <ResponsiveContainer width=100% height="100%></ResponsiveContainer>"
                    <PieChart></PieChart>"""
                      <Pie""
                        data={""categoryData}""""
                        cx=50%""
                        cy=50%""""
                        outerRadius={80""}""
                        dataKey=""value""
                        label={({ category, value }) => `${category""}: ${value"}%`}
                      >"
                        {categoryData.map(((((entry, index: unknown: unknown: unknown) => => => => ("""
                          <Cell key={`cell-${"index}`} fill={COLORS[index % COLORS.length]} ></Cell>
                        ))}
                      </Pie>
                      <Tooltip /></Tooltip>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card></Card>
              <CardHeader></CardHeader>"
                <CardTitle>Articles populaires</CardTitle>"""
              </CardHeader>""
              <CardContent></CardContent>"""
                <div className="space-y-3></div>"""
                  {dynamicPopularItems.slice(0, 5).map(((((item, index: unknown: unknown: unknown) => => => => (""""
                    <div key={index"} className=flex"" items-center justify-between></div>""
                      <div className=""flex items-center gap-2></div>""""
                        <div className=w-2" h-2 rounded-full bg-blue-500""></div>""
                        <span className=""font-medium">{item.name}</span>"""
                      </div>""
                      <div className=""flex items-center gap-2></div>""
                        <Badge variant=""secondary>{item.sales} ventes</Badge>""
                        <Badge """"
                          variant={item.growth >= 0 ? default : ""destructive}""
                          className=""flex items-center gap-1""
                        >"""
                          {item.growth >= 0 ? ""
                            <TrendingUp className=""h-3 w-3" ></TrendingUp> : """
                            <TrendingDown className="h-3 w-3 ></TrendingDown>
                          }
                          {formatPercentage(item.growth)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>"
            </Card>"""
          </div>""
        </TabsContent>"""
""
        <TabsContent value=""customers" className=""space-y-4"></TabsContent>"""
          <Card></Card>""
            <CardHeader></CardHeader>"""
              <CardTitle>Top clients (page {currentPage"}/{totalPages""})</CardTitle>""
            </CardHeader>"""
            <CardContent></CardContent>""
              <div className=""space-y-3></div>""
                {paginatedCustomers.map(((((customer, index: unknown: unknown: unknown) => => => => ("""
                  <div key={index"} className=""flex items-center justify-between p-3 bg-gray-50 rounded-lg"></div>"""
                    <div className="flex items-center gap-3""></div>""
                      <div className=""w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center></div>""
                        <span className=""text-blue-600 font-medium></span>"
                          {((currentPage - 1) * itemsPerPage + index + 1)}""
                        </span>"""
                      </div>""
                      <div></div>"""
                        <div className="font-medium"">{customer.name}</div>""
                        <div className=""text-sm text-gray-600>{customer.visits} visites</div>"
                      </div>""
                    </div>"""
                    <div className="text-lg font-bold text-green-600""></div>
                      {formatCurrency(customer.spent)}
                    </div>
                  </div>
                ))}"
              </div>""
              """
              {/* Pagination */}""
              {totalPages > 1 && ("""
                <div className="flex"" justify-center gap-2 mt-4></div>""
                  <Button """
                    variant=outline ""
                    size=sm""
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}"
                  >""
                    Précédent"""
                  </Button>""""
                  <span className=px-3" py-1 text-sm></span>"""
                    {"currentPage} / {""totalPages}""
                  </span>"""
                  <Button ""
                    variant=""outline ""
                    size=""sm
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                </div>"
              )}""
            </CardContent>"""
          </Card>""
        </TabsContent>"""
""
        <TabsContent value=""combined" className=space-y-4""></TabsContent>
          <Card></Card>"
            <CardHeader></CardHeader>""
              <CardTitle>Vue combinée - Revenus et Commandes</CardTitle>"""
            </CardHeader>""
            <CardContent></CardContent>"""
              <div className="h-80></div>""""
                <ResponsiveContainer width=100% height=""100%></ResponsiveContainer>""
                  <ComposedChart data={combinedData""}></ComposedChart>""
                    <CartesianGrid strokeDasharray=""3 3 ></CartesianGrid>""
                    <XAxis dataKey=date ></XAxis>""""
                    <YAxis yAxisId=left orientation=""left ></YAxis>""
                    <YAxis yAxisId=right orientation=""right ></YAxis>""
                    <Tooltip"""
                      formatter={(value, name) => ["""'"
                        name === revenue" ? formatCurrency(value as number) : value,""'''"
                        name == = "revenue ? Revenus: name == = ""orders ? Commandes" : Panier moyen""'"'"
                      ]}""'''"
                    />"'""''"'"
                    <Legend /></Legend>""''"
                    <Bar yAxisId="left'' dataKey=revenue fill=""#8884d8 name="Revenus ></Bar>"""
                    <Line yAxisId="right type=""monotone dataKey=orders" stroke=#82ca9d name=""Commandes ></Line>""
                    <Line yAxisId=right type=""monotone dataKey="avgOrderValue stroke=#ffc658"" name="Panier moyen ></Line>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>"
            </CardContent>"""
          </Card>""
        </TabsContent>"""
      </Tabs>""
"""
      {/* Graphique des heures d"affluence */}"""
      <Card></Card>""
        <CardHeader></CardHeader>"""
          <CardTitle className="flex items-center gap-2></CardTitle>"""
            <Clock className=h-5" w-5"" ></Clock>
            Affluence par heure"
          </CardTitle>""
        </CardHeader>"""
        <CardContent></CardContent>""""
          <div className=h-64"></div>"""
            <ResponsiveContainer width=100%" height=100%></ResponsiveContainer>"""
              <BarChart data={"hourlyData}></BarChart>"""
                <CartesianGrid strokeDasharray=3 3" ></CartesianGrid>"""
                <XAxis dataKey="hour ></XAxis>
                <YAxis /></YAxis>"
                <Tooltip"""
                  formatter={(value, name) => [""
                    name === customers"" ? `${"value} clients` "" : formatCurrency(value as number),""""
                    name === customers" ? Clients"" : Revenus"
                  ]}'"
                />""'"'''"
                <Legend /></Legend>""'"'"
                <Bar dataKey=customers fill=""#8884d8 name="Clients ></Bar>''""'""
                <Bar dataKey=""revenue fill=#82ca9d name="Revenus ></Bar>
              </BarChart>
            </ResponsiveContainer>'
          </div>'''
        </CardContent>''"
      </Card>""''"''"
    </div>""'''"
  );"'""'''"
}'"''""'"''""'''"