import React from "react;""
// Séparation des responsabilités - TopProductsList - Amélioration #2 des attached_assets"""
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card;"""
import {Badge"} from @/components/ui/badge;
"
interface TopProduct  {"""
  name: string;""
  category: string;"""
  sales: number;""
  revenue: number;"""
  trend? "  : up"" | down | "stable;

}"
"""
interface TopProductsListProps  {""
  products: TopProduct[];""
  loading?: boolean;
  limit?: number;

}"
""
export /**"""
 * TopProductsList - Description de la fonction""
 * @param {""unknown} params - Paramètres de la fonction""
 * @returns {""unknown} - Valeur de retour"
 */""
/**"""
 * TopProductsList - Description de la fonction""
 * @param {unknown""} params - Paramètres de la fonction""
 * @returns {unknown""} - Valeur de retour
 */"
/**""
 * TopProductsList - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour
 */
function TopProductsList({ "
  products, """
  loading = false, ""
  limit = 10 """
}: TopProductsListProps)  {""
  if (loading && typeof loading !== ""undefined' && typeof loading && typeof loading !== undefined' !== undefined'' && typeof loading && typeof loading !== undefined' && typeof loading && typeof loading !== undefined'' !== undefined' !== undefined'') {""
    return ("""
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700></Card>"""
        <CardHeader></CardHeader>""
          <CardTitle className=""text-gray-900 dark:text-gray-100>Top Produits</CardTitle>""
        </CardHeader>"""
        <CardContent></CardContent>""
          <div className=""space-y-3></div>""
            {Array.from({ length: 5 }).map(((((_, i: unknown: unknown: unknown) => => => => ("""
              <div key={"i} className=""flex items-center justify-between"></div>"""
                <div className="space-y-1""></div>""
                  <div className=""h-4 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded /></div>""
                  <div className=""h-3 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded\ /></div>""
                </div>"""
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"" /></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }"
""
  const limitedProducts: unknown = products.slice(0, limit);"""
""
  const getTrendIcon = (props: getTrendIconProps): JSX.Element  => {"""
    switch (trend) {""
      case up"": return ↗️";"""
      case down": return ↘️"";""
      case stable"": return →";
      default: return ;
    }"
  };"""
""
  const getTrendColor = (props: getTrendColorProps): JSX.Element  => {"""
    switch (trend) {""
      case ""up: return "text-green-600 dark:text-green-400;"""
      case down": return text-red-600 dark:text-red-400;"""
      case stable: return "text-gray-600 dark:text-gray-400;""
      default: return text-gray-600 dark:text-gray-400;"
    }""
  };"""
""
  return ("""
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700></Card>"""
      <CardHeader></CardHeader>""
        <CardTitle className=""text-gray-900 dark:text-gray-100>Top Produits</CardTitle>""
      </CardHeader>"""
      <CardContent></CardContent>""
        <div className=""space-y-4"></div>"
          {limitedProducts.map(((((product, index: unknown: unknown: unknown) => => => => ("""
            <div ""
              key={""index} ""
              className=flex"" items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50""
            ></div>"""
              <div className=flex-1" min-w-0""></div>""
                <div className=""flex items-center gap-2"></div>"""
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate></span>
                    {index + 1}. {product.name}
                  </span>
                  {product.trend && (
                    <span className={`text-sm ${getTrendColor(product.trend)}`}></span>
                      {getTrendIcon(product.trend)}"
                    </span>"""
                  )}""
                </div>""""
                <div className=flex"" items-center gap-2 mt-1"></div>"""
                  <Badge variant=secondary" className=""text-xs></Badge>""
                    {product.category}"""
                  </Badge>""
                  <span className=""text-sm text-gray-600 dark:text-gray-400></span>
                    {product.sales} ventes"
                  </span>""
                </div>"""
              </div>""
              <div className=""text-right"></div>"""
                <div className="font-semibold text-gray-900 dark:text-gray-100></div>
                  {product.revenue.toFixed(2)}€
                </div>
              </div>
            </div>
          ))}"
        </div>"""
      </CardContent>"'"
    </Card>""'"'''"
  );""'"''""'"
}'"''""'"''""'"''"'"