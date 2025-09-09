"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

/**
 * Configuration pour les thèmes de graphiques
 * Définit les sélecteurs CSS pour les thèmes clair et sombre
 */
const THEMES = { light: "", dark: ".dark" } as const

/**
 * Interface de configuration pour un graphique
 * Définit la structure des données de configuration pour les graphiques
 */
export interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  };
}

/**
 * Interface pour les données du payload des graphiques
 */
interface PayloadData {
  name?: string;
  dataKey?: string;
  value?: number | string;
  payload?: Record<string, unknown>;
  color?: string;
  fill?: string;
}

/**
 * Interface pour les éléments de tooltip
 */
interface TooltipPayloadItem extends PayloadData {
  name: string;
  value: number | string;
}

/**
 * Interface pour les éléments de légende
 */
interface LegendPayloadItem extends PayloadData {
  value: string;
  color: string;
}

/**
 * Interface pour la configuration d'un élément du graphique
 */
interface ItemConfig {
  label?: React.ReactNode;
  icon?: React.ComponentType;
  color?: string;
  theme?: Record<string, string>;
}

/**
 * Props pour le conteneur de graphique
 */
export interface ChartContainer extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ComponentProps<"div">["children"];
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
const ChartContext = React.createContext<ChartContextProps | null>(null)

/**
 * Hook personnalisé pour accéder au contexte des graphiques
 * @throws {Error} Si utilisé en dehors d'un ChartContainer
 * @returns {ChartContextProps} La configuration du graphique
 */
function useChart(): ChartContextProps {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

/**
 * Composant conteneur principal pour les graphiques
 * Fournit le contexte et la configuration de base pour tous les graphiques
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  // Mémorisation de l'ID unique pour éviter les recalculs
  const uniqueId = React.useId()
  const chartId = React.useMemo(
    () => `chart-${id || uniqueId.replace(/:/g, "")}`,
    [id, uniqueId]
  )

  // Mémorisation des classes CSS pour optimiser les performances
  const containerClasses = React.useMemo(
    () => cn(
      "flex aspect-video justify-center text-xs",
      "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
      "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
      "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
      "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
      "[&_.recharts-layer]:outline-none",
      "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
      "[&_.recharts-radial-bar-background-sector]:fill-muted",
      "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
      "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
      "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
      "[&_.recharts-sector]:outline-none",
      "[&_.recharts-surface]:outline-none",
      className
    ),
    [className]
  )

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={containerClasses}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

/**
 * Composant pour générer les styles CSS dynamiques des graphiques
 * @param {string} id - L'identifiant unique du graphique
 * @param {ChartConfig} config - La configuration du graphique
 */
const ChartStyle = React.memo(({ id, config }: { id: string; config: ChartConfig }) => {
  // Mémorisation de la configuration des couleurs pour éviter les recalculs
  const colorConfig = React.useMemo(
    () => Object.entries(config).filter(([, config]) => config.theme || config.color),
    [config]
  )

  // Mémorisation du CSS généré
  const cssStyles = React.useMemo(() => {
    if (!colorConfig.length) return ""

    return Object.entries(THEMES)
      .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .filter(Boolean)
  .join("\n")}
}`)
      .join("\n")
  }, [id, colorConfig])

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: cssStyles,
      }}
    />
  )
})
ChartStyle.displayName = "ChartStyle"

/**
 * Composant Tooltip réexporté de Recharts
 */
const ChartTooltip = RechartsPrimitive.Tooltip

/**
 * Type pour les fonctions de formatage
 */
type FormatterFunction = (
  value: number | string,
  name: string,
  item: TooltipPayloadItem,
  index: number,
  payload: TooltipPayloadItem[]
) => React.ReactNode

/**
 * Type pour les fonctions de formatage des labels
 */
type LabelFormatterFunction = (
  value: React.ReactNode,
  payload: TooltipPayloadItem[]
) => React.ReactNode

/**
 * Composant de contenu personnalisé pour le tooltip des graphiques
 * Fournit un affichage professionnel et configurable des données
 */
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
      labelClassName?: string
      formatter?: FormatterFunction
      labelFormatter?: LabelFormatterFunction
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName = "",
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    // Cast sécurisé du payload
    const safePayload = Array.isArray(payload) ? (payload as TooltipPayloadItem[]) : []

    // Mémorisation du label du tooltip pour optimiser les performances
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !safePayload.length) {
        return null
      }

      const [item] = safePayload
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`
      const itemConfig = item ? getPayloadConfigFromPayload(config, item, key) : undefined
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, safePayload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{String(value)}</div>
    }, [
      label,
      labelFormatter,
      safePayload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    // Mémorisation des classes CSS du conteneur
    const containerClasses = React.useMemo(
      () => cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      ),
      [className]
    )

    if (!active || !safePayload.length) {
      return null
    }

    const nestLabel = safePayload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={containerClasses}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {safePayload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor =
              (typeof color === 'string' && color) ||
              (typeof (item.payload as any)?.fill === 'string' && (item.payload as any).fill) ||
              (typeof item.color === 'string' && item.color) ||
              "#000"

            return (
              <TooltipItem
                key={item.dataKey}
                index={index}
                itemConfig={itemConfig}
                item={item}
                indicator={indicator}
                hideIndicator={hideIndicator}
                indicatorColor={String(indicatorColor)}
                formatter={formatter || undefined}
                nestLabel={nestLabel}
                tooltipLabel={tooltipLabel}
              />
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

/**
 * Composant pour un élément individuel du tooltip
 * Séparé pour améliorer la lisibilité et les performances
 */
const TooltipItem = React.memo (({
  item,
  index,
  itemConfig,
  indicatorColor,
  indicator,
  hideIndicator,
  formatter,
  nestLabel,
  tooltipLabel
}: {
  item: TooltipPayloadItem
  index: number
  itemConfig: ItemConfig | undefined
  indicatorColor: string
  indicator: "line" | "dot" | "dashed"
  hideIndicator: boolean
  formatter?: FormatterFunction
  nestLabel: boolean
  tooltipLabel: React.ReactNode
}) => {
  // Mémorisation des classes CSS de l'élément
  const itemClasses = React.useMemo(
    () => cn(
      "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
      indicator === "dot" && "items-center"
    ),
    [indicator]
  )

  // Mémorisation des classes CSS de l'indicateur
  const indicatorClasses = React.useMemo(
    () => cn(
      "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
      {
        "h-2.5 w-2.5": indicator === "dot",
        "w-1": indicator === "line",
        "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
        "my-0.5": nestLabel && indicator === "dashed",
      }
    ),
    [indicator, nestLabel]
  )

  // Mémorisation des styles CSS de l'indicateur
  const indicatorStyles = React.useMemo(
    () => ({
      "--color-bg": indicatorColor,
      "--color-border": indicatorColor,
    } as React.CSSProperties),
    [indicatorColor]
  )

  const IconComponent = itemConfig?.icon

  return (
    <div className={itemClasses}>
      {formatter && item.value !== undefined && item.name ? (
        formatter(item.value, item.name, item, index, [item])
      ) : (
        <>
          {IconComponent ? (
            <IconComponent />
          ) : (
            !hideIndicator && (
              <div
                className={indicatorClasses}
                style={indicatorStyles}
              />
            )
          )}
          <div
            className={cn(
              "flex flex-1 justify-between leading-none",
              nestLabel ? "items-end" : "items-center"
            )}
          >
            <div className="grid gap-1.5">
              {nestLabel ? tooltipLabel : null}
              <span className="text-muted-foreground">
                {itemConfig?.label || item.name}
              </span>
            </div>
            {item.value !== undefined && (
              <span className="font-mono font-medium tabular-nums text-foreground">
                {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
})
TooltipItem.displayName = "TooltipItem"

/**
 * Composant Legend réexporté de Recharts
 */
const ChartLegend = RechartsPrimitive.Legend

/**
 * Composant de contenu personnalisé pour la légende des graphiques
 */
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    // Cast sécurisé du payload de la légende
    const safePayload = (payload as LegendPayloadItem[]) || []

    // Mémorisation des classes CSS de la légende
    const legendClasses = React.useMemo(
      () => cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      ),
      [verticalAlign, className]
    )

    if (!safePayload.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={legendClasses}
      >
        {safePayload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <LegendItem
              key={item.value}
              item={item}
              itemConfig={itemConfig}
              hideIcon={hideIcon}
            />
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

/**
 * Composant pour un élément individuel de la légende
 */
const LegendItem = React.memo (({
  item,
  itemConfig,
  hideIcon
}: {
  item: LegendPayloadItem
  itemConfig: ItemConfig | undefined
  hideIcon: boolean
}) => {
  const IconComponent = itemConfig?.icon

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
      )}
    >
      {IconComponent && !hideIcon ? (
        <IconComponent />
      ) : (
        <div
          className="h-2 w-2 shrink-0 rounded-[2px]"
          style={{
            backgroundColor: item.color,
          }}
        />
      )}
      {itemConfig?.label}
    </div>
  )
})
LegendItem.displayName = "LegendItem"

/**
 * Fonction utilitaire pour extraire la configuration d'un payload
 * @param {ChartConfig} config - Configuration du graphique
 * @param {PayloadData} payload - Données du payload
 * @param {string} key - Clé de recherche
 * @returns {ItemConfig | undefined} Configuration trouvée ou undefined
 */
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: PayloadData,
  key: string
): ItemConfig | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined
  }

  const payloadData = payload.payload as Record<string, unknown> | undefined

  let configLabelKey: string = key

  if (key in payload && typeof payload[key as keyof PayloadData] === "string") {
    configLabelKey = payload[key as keyof PayloadData] as string
  } else if (
    payloadData &&
    key in payloadData &&
    typeof payloadData[key] === "string"
  ) {
    configLabelKey = payloadData[key] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}