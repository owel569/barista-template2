
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "./card"
import { Badge } from "./badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const statsCardVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        gradient: "bg-gradient-to-br from-primary/10 to-primary/5",
        highlighted: "ring-2 ring-primary/20",
      },
      trend: {
        up: "border-l-4 border-l-green-500",
        down: "border-l-4 border-l-red-500",
        neutral: "border-l-4 border-l-gray-500",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      trend: "none",
    },
  }
)

export interface StatsCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof statsCardVariants>, 'trend'> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPercentage?: boolean;
  };
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  loading?: boolean;
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({
    className,
    variant,
    trend: trendVariant,
    title,
    value,
    description,
    icon,
    trend,
    badge,
    loading = false,
    ...props
  }, ref) => {
    const getTrendIcon = () => {
      if (!trend) return null;
      if (trend.value > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
      if (trend.value < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
      return <Minus className="h-3 w-3 text-gray-500" />;
    };

    const getTrendColor = () => {
      if (!trend) return "";
      if (trend.value > 0) return "text-green-600";
      if (trend.value < 0) return "text-red-600";
      return "text-gray-500";
    };

    const determineTrendVariant = () => {
      if (!trend) return "none";
      if (trend.value > 0) return "up";
      if (trend.value < 0) return "down";
      return "neutral";
    };

    return (
      <Card
        ref={ref}
        className={cn(
          statsCardVariants({
            variant,
            trend: (trendVariant as any) || determineTrendVariant()
          }),
          className
        )}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-muted-foreground">
              {title}
            </h3>
          </div>
          {badge && (
            <Badge variant={badge.variant || "default"}>
              {badge.text}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-2">
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold">{value}</div>
              )}
              {trend && (
                <div className={cn("flex items-center space-x-1 text-xs", getTrendColor())}>
                  {getTrendIcon()}
                  <span>
                    {Math.abs(trend.value)}{trend.isPercentage ? "%" : ""}
                    {trend.label && ` ${trend.label}`}
                  </span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatsCard.displayName = "StatsCard";

export { StatsCard, statsCardVariants };
