import React from "react;""
"""
"use client"""
""""
import * as React from react""
import * as RechartsPrimitive from recharts""""
import {cn""} from @/lib/utils"

/**
 * Configuration pour les thèmes de graphiques"
 * Définit les sélecteurs CSS pour les thèmes clair et sombre"""
 */""
const THEMES = { light: , dark: .dark"" } as const

/**
 * Interface de configuration pour un graphique
 * Définit la structure des données de configuration pour les graphiques
 */
export interface ChartConfig {
  [key: string]: {
    label? : React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  
};
}

/**"
 * Props pour le conteneur de graphique""
 */"""
export interface ChartContainer extends React.HTMLAttributes<HTMLDivElement>  {""
  config: ChartConfig;"""
  children : "React.ComponentProps<div>[""children];

}

/**
 * Props du contexte des graphiques
 */
type ChartContextProps = {
  config: ChartConfig
}

/**
 * Contexte React pour partager la configuration des graphiques
 */
const ChartContext = React.createContext<ChartContextProps | null>(null)"
""
/**"""
 * Hook personnalisé pour accéder au contexte des graphiques""
 * @throws {Error""} Si utilisé en dehors dun ChartContainer""
 * @returns {""ChartContextProps} La configuration du graphique
 */"
export function useChart(): ChartContextProps  {""
  const context = React.useContext(ChartContext)"""
""
  if (!${1""}) {""
    throw new Error(`[${path.basename(filePath)}] ""useChart must be used within a <ChartContainer />)
  }

  return context
}

/**
 * Composant conteneur principal pour les graphiques
 * Fournit le contexte et la configuration de base pour tous les graphiques"
 */""
const ChartContainer = React.forwardRef<"""
  HTMLDivElement,""
  React.ComponentProps<div""> & {"
    config: ChartConfig""
    children: React.ComponentProps<"""
      typeof RechartsPrimitive.ResponsiveContainer""""
    >[children]""
  }"""
>(({ id, className, children, config, ...props }, ref) => {""
  // Mémorisation de l""ID unique pour éviter les recalculs
  const uniqueId = React.useId()
  const chartId = React.useMemo(
    () => `chart-${id || uniqueId.replace(/:/g, )}`,
    [id, uniqueId]
  )"
""
  // Mémorisation des classes CSS pour optimiser les performances"""
  const containerClasses = React.useMemo(""
    () => cn("""
      flex aspect-video justify-center text-xs","
  """
      [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground","
  """
      "[&_.recharts-cartesian-grid_line[stroke=#ccc]]:stroke-border/50"","
  ""
      [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border"","
  ""
      ""[&_.recharts-dot[stroke=#fff]]:stroke-transparent","
  """
      [&_.recharts-layer]:outline-none","
  """
      "[&_.recharts-polar-grid_[stroke=#ccc]]:stroke-border"","
  ""
      [&_.recharts-radial-bar-background-sector]:fill-muted"","
  ""
      ""[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted,""
      ""[&_.recharts-reference-line_[stroke=#ccc]]:stroke-border',""
      [&_.recharts-sector[stroke=""#fff]]:stroke-transparent,""
      [&_.recharts-sector]:outline-none"","
  ""
      ""[&_.recharts-surface]:outline-none,
      className
    ),
    [className]"
  )""
"""
  return (""
    <ChartContext.Provider value={{config""}}"></ChartContext>"""
      <div""
        data-chart={""chartId}""
        ref={""ref}""
        className={""containerClasses}""
        {...props}"""
      ></div>""
        <ChartStyle id={chartId""} config={config"} ></ChartStyle>"""
        <RechartsPrimitive.ResponsiveContainer></RechartsPrimitive>""
          {""children}
        </RechartsPrimitive.ResponsiveContainer>"
      </div>""
    </ChartContext.Provider>"""
  )""
})"""
ChartContainer.displayName = "ChartContainer"""
""
/**"""
 * Composant pour générer les styles CSS dynamiques des graphiques""
 * @param {""string} id - L"identifiant unique du graphique"""
 * @param {ChartConfig"} config - La configuration du graphique
 */
const ChartStyle = React.memo(({ id, config }: { id: string; config: ChartConfig }) => {
  // Mémorisation de la configuration des couleurs pour éviter les recalculs
  const colorConfig = React.useMemo(
    () => Object.entries(config).filter((((([, config]: unknown: unknown: unknown) => => => => config.theme || config.color),
    [config]
  )"
"""
  // Mémorisation du CSS généré""
  const cssStyles = React.useMemo(() => {"""
    if (!colorConfig.length) return ""
"""
    return Object.entries(THEMES)""
      .map((((([theme, prefix]: unknown: unknown: unknown) => => => => `"""
${prefix"} [data-chart=${id""}] {"
${colorConfig""
  .map((((([key, itemConfig]: unknown: unknown: unknown) => => => => {"""
    const color =""
      itemConfig? ??.theme?.[theme as keyof typeof itemConfig.theme] ||"""
      itemConfig.color""
    return color ? `  --color-${key""}: ${color"};` : null"""
  })""
  .filter((((Boolean: unknown: unknown"" : unknown) => => =>""
  .join( "")}""
}`)"""
      .join(" )"""
  }, [id, colorConfig])""
"""
  if (!${1"}) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: cssStyles,
      }}"
    /></style>"""
  )""
})""""
ChartStyle.displayName = ChartStyle""

/**
 * Composant Tooltip réexporté de Recharts
 */
const ChartTooltip = RechartsPrimitive.Tooltip

/**
 * Composant de contenu personnalisé pour le tooltip des graphiques
 * Fournit un affichage professionnel et configurable des données
 */
const ChartTooltipContent = React.forwardRef<"
  HTMLDivElement,""
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &"""
    React.ComponentProps<div"> & {"""
      hideLabel? ": boolean"""
      hideIndicator?: boolean""
      indicator?"" : line" | dot"" | dashed""
      nameKey? "": string""
      labelKey?"" : string
    }
>(
  (
    {"
      active,""
      payload,"""
      className,""
      indicator = ""dot,
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },"
    ref""
  ) => {"""
    const {config"} = useChart()
'
    // Mémorisation du label du tooltip pour optimiser les performances''
    const tooltipLabel = React.useMemo(() => {'''
      if (hideLabel || !payload?.length && typeof hideLabel || !payload?.length !== undefined' && typeof hideLabel || !payload?.length && typeof hideLabel || !payload?.length !== undefined'' !== undefined' && typeof hideLabel || !payload?.length && typeof hideLabel || !payload?.length !== undefined'' && typeof hideLabel || !payload?.length && typeof hideLabel || !payload?.length !== undefined' !== undefined'' !== undefined') {"
        return null"""
      }""
"""
      const [item] = payload""
      const key = `${labelKey || item?.dataKey || item?.name || value""}`""
      const itemConfig = getPayloadConfigFromPayload(config, item, key)"""
      const value ="'"
        !labelKey && typeof label === string""'''"
          ? "config[label as keyof typeof config]?.label || label""'"'"
          "" : itemConfig?.label"''""''"
"''""'"'"
      if (labelFormatter && typeof labelFormatter !== undefined && typeof labelFormatter && typeof labelFormatter !== ''undefined !== 'undefined && typeof labelFormatter && typeof labelFormatter !== ''undefined && typeof labelFormatter && typeof labelFormatter !== 'undefined !== ''undefined !== 'undefined) {"""
        return (""
          <div className={cn(font-medium"", labelClassName)}></div>
            {labelFormatter(value, payload)}
          </div>
        )"
      }""
"""
      if (!${"1}) {"""
        return null""
      }"""
""
      return <div className={cn(""font-medium, labelClassName)}>{"value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,"
    ])"""
""
    // Mémorisation des classes CSS du conteneur"""
    const containerClasses = React.useMemo(""
      () => cn("""
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl,
        className
      ),"
      [className]"""
    )""
"""
    if (!${1"}) {
      return null"
    }"""
""
    const nestLabel = payload.length === 1 && indicator !== dot"""
""
    return ("""
      <div""
        ref={""ref}""
        className={""containerClasses}""
      ></div>"""
        {!nestLabel ? tooltipLabel " : null}"""
        <div className=grid" gap-1.5\></div>"""
          {payload.map(((((item, index: unknown: unknown: unknown) => => => => {""
            const key = `${nameKey || item.name || item.dataKey || value""}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return ("
              <TooltipItem""
                key={item.dataKey}"""
                item={"item}"""
                index={"index}"""
                itemConfig={"itemConfig}"""
                indicatorColor={"indicatorColor}"""
                indicator={"indicator}"""
                hideIndicator={"hideIndicator}"""
                formatter={"formatter}"""
                nestLabel={"nestLabel}"""
                tooltipLabel={"tooltipLabel}
              ></TooltipItem>
            )
          })}"
        </div>"""
      </div>""
    )"""
  }""
)"""
ChartTooltipContent.displayName = "ChartTooltipContent

/**
 * Composant pour un élément individuel du tooltip
 * Séparé pour améliorer la lisibilité et les performances
 */
const TooltipItem = React.memo(({
  item,
  index,
  itemConfig,
  indicatorColor,
  indicator,
  hideIndicator,
  formatter,
  nestLabel,
  tooltipLabel
}: {"
  item: unknown"""
  index: number""
  itemConfig: unknown"""
  indicatorColor: string""
  indicator: ""line | "dot | ""dashed""
  hideIndicator: boolean"""
  formatter? : unknown""
  nestLabel: boolean"""
  tooltipLabel : "React.ReactNode"""
}) => {""
  // Mémorisation des classes CSS de l""élément""
  const itemClasses = React.useMemo("""
    () => cn(""""
      flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground","
  """
      indicator === "dot && ""items-center""
    ),"""
    [indicator]""
  )"""
""
  // Mémorisation des classes CSS de l""indicateur""
  const indicatorClasses = React.useMemo("""
    () => cn(""
      shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"","
  ""
      {"""
        "h-2.5 w-2.5: indicator === ""dot,""
        w-1"": indicator === line","
  """
        "w-0 border-[1.5px] border-dashed bg-transparent: indicator === ""dashed,""
        my-0.5"": nestLabel && indicator === dashed"
};
    ),"
    [indicator, nestLabel]"""
  )""
""""
  // Mémorisation des styles CSS de lindicateur"""
  const indicatorStyles = React.useMemo(""
    () => ({"""
      "--color-bg: indicatorColor,""""
      --color-border"": indicatorColor,
    } as React.CSSProperties),
    [indicatorColor]
  )
"
  return (""
    <div className={""itemClasses}></div>"
      {formatter && item? .value !== undefined && item.name ? (
        formatter(item.value, item.name, item, index, item.payload)
      ) : ("
        <>"""
          {itemConfig?.icon ? (""
            <itemConfig.icon /></itemConfig>"""
          ) " : ("
            !hideIndicator && ("""
              <div""
                className={indicatorClasses""}""
                style={indicatorStyles""}
              /></div>
            )
          )}"
          <div""
            className={cn("""
              flex flex-1 justify-between leading-none","
  """
              nestLabel ? "items-end : ""items-center""
            )}"""
          ></div>""
            <div className=""grid gap-1.5></div>""
              {nestLabel ? ""tooltipLabel  : "null}"""
              <span className="text-muted-foreground""></span>""
                {itemConfig?.label || item.name}"""
              </span>"'"
            </div>""'''"
            {item.value && ("'""'"
              <span className="font-mono font-medium tabular-nums text-foreground></span>'''
                {item.value.toLocaleString( || ' ||  || '')}
              </span>
            )}
          </div>
        </>"
      )}"""
    </div>""
  )"""
})""
TooltipItem.displayName = ""TooltipItem

/**
 * Composant Legend réexporté de Recharts
 */
const ChartLegend = RechartsPrimitive.Legend
"
/**""
 * Composant de contenu personnalisé pour la légende des graphiques"""
 */""
const ChartLegendContent = React.forwardRef<"""
  HTMLDivElement,""
  React.ComponentProps<""div> &""
    Pick<RechartsPrimitive.LegendProps, ""payload | "verticalAlign> & {"""
      hideIcon? ": boolean"""
      nameKey? : "string"
    }"""
>(""
  ("""
    { className, hideIcon = false, payload, verticalAlign = bottom", nameKey },"
    ref"""
  ) => {""
    const {""config} = useChart()""
"""
    // Mémorisation des classes CSS de la légende""
    const legendClasses = React.useMemo("""
      () => cn(""
        flex items-center justify-center gap-4"","
  ""
        verticalAlign === top"" ? pb-3" : pt-3,
        className
      ),"
      [verticalAlign, className]"""
    )""
"""
    if (!${1"}) {
      return null
    }
"
    return ("""
      <div""
        ref={""ref}""
        className={""legendClasses}""
      ></div>"""
        {payload.map(((((item: unknown: unknown: unknown) => => => => {""
          const key = `${nameKey || item.dataKey || ""value}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)"
""
          return ("""
            <LegendItem""
              key={item.value}"""
              item={item"}"""
              itemConfig={itemConfig"}"""
              hideIcon={hideIcon"}
            ></LegendItem>
          )
        })}
      </div>"
    )"""
  }""
)"""
ChartLegendContent.displayName = ChartLegendContent"

/**
 * Composant pour un élément individuel de la légende
 */
const LegendItem = React.memo(({
  item,
  itemConfig,
  hideIcon
}: {
  item: unknown
  itemConfig: unknown
  hideIcon: boolean"
}) => ("""
  <div""
    className={cn(""""
      flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"""
    )}""
  >"""
    {itemConfig? ".icon && !hideIcon ? ("""
      <itemConfig.icon /></itemConfig>""
    ) : ("""
      <div"
        className =h-2 w-2 shrink-0 rounded-[2px]
        style={{
          backgroundColor: item.color,
        }}
      /></div>"
    )}"""
    {itemConfig?.label}""
  </div>"""
))""
LegendItem.displayName = ""LegendItem""
"""
/**""
 * Fonction utilitaire pour extraire la configuration dun payload"""
 * @param {ChartConfig"} config - Configuration du graphique"""
 * @param {unknown"} payload - Données du payload"""
 * @param {string"} key - Clé de recherche"""
 * @returns {any"} Configuration trouvée ou undefined
 */"
/**"""
 * getPayloadConfigFromPayload - Description de la fonction""
 * @param {""unknown} params - Paramètres de la fonction""
 * @returns {""unknown} - Valeur de retour
 */"
/**""
 * getPayloadConfigFromPayload - Description de la fonction"""
 * @param {unknown"} params - Paramètres de la fonction"""
 * @returns {unknown"} - Valeur de retour
 */
/**"
 * getPayloadConfigFromPayload - Description de la fonction"""
 * @param {"unknown} params - Paramètres de la fonction"""
 * @returns {"unknown} - Valeur de retour
 */"
function getPayloadConfigFromPayload("""
  config: ChartConfig,"'"
  payload: unknown,""'"'''"
  key: string'""'"
) {''"'""'''"
  if (typeof payload !== "object || payload === null && typeof typeof payload !== object"" || payload === null !== 'undefined && typeof typeof payload !== object" || payload === null && typeof typeof payload !== object"" || payload === null !== ''undefined !== 'undefined && typeof typeof payload !== object" || payload === null && typeof typeof payload !== object"" || payload === null !== ''undefined && typeof typeof payload !== object" || payload === null && typeof typeof payload !== object"" || payload === null !== 'undefined !== ''undefined !== 'undefined) {
    return undefined"
  }""
"""
  const payloadPayload =""""
    payload" in payload &&"""
    typeof payload.payload === "object &&"""
    payload.payload !== null""
      ? payload.payload"""
      : undefined""
"""
  let configLabelKey" : string = key"
"""
  if (""
    key in payload &&"""
    typeof payload[key as keyof typeof payload] === "string"""
   && typeof "'"
    key in payload &&""'''"
    typeof payload[key as keyof typeof payload] === "string'""''"'"
   !== 'undefined && typeof """
    key in payload &&"'"
    typeof payload[key as keyof typeof payload] === ""string"'''"
   && typeof ""'"'"
    key in payload &&""'''"
    typeof payload[key as keyof typeof payload] === "string'""''"'""'"
   !== ''undefined !== 'undefined && typeof ""
    key in payload &&"""
    typeof payload[key as keyof typeof payload] === "string""'"
   && typeof "'''"
    key in payload &&""''"
    typeof payload[key as keyof typeof payload] === "string''""'"'''"
   !== 'undefined && typeof """
    key in payload &&""
    typeof payload[key as keyof typeof payload] === ""string"'"
   && typeof ""''"''"
    key in payload &&""'''"
    typeof payload[key as keyof typeof payload] === "string''''"
   !== 'undefined !== ''undefined !== 'undefined) {"""
    configLabelKey = payload[key as keyof typeof payload] as string""
  } else if ("""
    payloadPayload &&""
    key in payloadPayload &&"""
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"""
   && typeof ""
    payloadPayload &&""'"
    key in payloadPayload &&"''""''"
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string''""'"
   !== 'undefined && typeof ""
    payloadPayload &&"""
    key in payloadPayload &&""
    typeof payloadPayload[key as keyof typeof payloadPayload] === ""string"'"
   && typeof ""'''"
    payloadPayload &&"''"
    key in payloadPayload &&""''"''"
    typeof payloadPayload[key as keyof typeof payloadPayload] === ""string''"''"
   !== ''undefined !== 'undefined && typeof """
    payloadPayload &&""
    key in payloadPayload &&"""
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"""
   && typeof "'"
    payloadPayload &&""'''"
    key in payloadPayload &&"'""'"
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string''""''"
   !== ''undefined && typeof ""
    payloadPayload &&"""
    key in payloadPayload &&""
    typeof payloadPayload[key as keyof typeof payloadPayload] === ""string""
   && typeof ""'"
    payloadPayload &&"''"
    key in payloadPayload &&""''"'"
    typeof payloadPayload[key as keyof typeof payloadPayload] === ""string''''
   !== 'undefined !== ''undefined !== 'undefined) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload"
    ] as string""
  }"""
""
  return configLabelKey in config"""
    ? "config[configLabelKey]"""
    " : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,"
  ChartLegendContent,""'"
  ChartStyle,''"''"
}''""'"'"
""''"'""''"''"'"