import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "border-2 border-current border-t-transparent rounded-full",
        dots: "flex space-x-1",
        pulse: "bg-current rounded-full animate-pulse",
        bars: "flex space-x-1",
        ring: "border-2 border-primary/20 border-t-primary rounded-full",
        gradient: "bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse",
      },
      size: {
        xs: "h-3 w-3",
        sm: "h-4 w-4", 
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
        "2xl": "h-16 w-16",
      },
      speed: {
        slow: "animate-spin-slow",
        default: "animate-spin",
        fast: "animate-spin-fast",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      speed: "default",
    },
  }
)

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  showLabel?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, variant, size, speed, label = "Chargement...", showLabel = false, ...props }, ref) => {
    const renderSpinner = () => {
      switch (variant) {
        case "dots":
          return (
            <div className={cn("flex space-x-1", className)}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-current rounded-full animate-bounce",
                    size === "xs" && "h-1 w-1",
                    size === "sm" && "h-1.5 w-1.5",
                    size === "default" && "h-2 w-2",
                    size === "lg" && "h-3 w-3",
                    size === "xl" && "h-4 w-4",
                    size === "2xl" && "h-6 w-6"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )

        case "bars":
          return (
            <div className={cn("flex space-x-1", className)}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-current animate-pulse",
                    size === "xs" && "h-3 w-0.5",
                    size === "sm" && "h-4 w-0.5",
                    size === "default" && "h-6 w-1",
                    size === "lg" && "h-8 w-1",
                    size === "xl" && "h-12 w-1.5",
                    size === "2xl" && "h-16 w-2"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          )

        case "pulse":
          return (
            <div
              className={cn(
                spinnerVariants({ variant: "pulse", size }),
                className
              )}
            />
          )

        case "gradient":
          return (
            <div
              className={cn(
                spinnerVariants({ variant: "gradient", size }),
                className
              )}
            />
          )

        default:
          return (
            <div
              className={cn(
                spinnerVariants({ variant, size, speed }),
                className
              )}
              role="status"
              aria-label={label}
            />
          )
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          showLabel && "flex-col space-y-2"
        )}
        {...props}
      >
        {renderSpinner()}
        {showLabel && (
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {label}
          </span>
        )}
      </div>
    )
  }
)
LoadingSpinner.displayName = "LoadingSpinner"

// Composant de page de chargement complet
export interface LoadingPageProps {
  title?: string
  description?: string
  variant?: VariantProps<typeof spinnerVariants>['variant']
  size?: VariantProps<typeof spinnerVariants>['size']
  className?: string
}

const LoadingPage: React.FC<LoadingPageProps> = ({
  title = "Chargement...",
  description,
  variant = "default",
  size = "xl",
  className,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] p-8 text-center",
      className
    )}>
      <LoadingSpinner variant={variant} size={size} />
      <div className="mt-6 space-y-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

// Hook pour gérer les états de chargement
export function useLoading(initialState: boolean = false) {
  const [isLoading, setIsLoading] = React.useState(initialState)
  const [error, setError] = React.useState<string | null>(null)

  const startLoading = React.useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setIsLoading(false)
    setError(errorMessage)
  }, [])

  const withLoading = React.useCallback(async <T,>(
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    startLoading()
    try {
      const result = await asyncFunction()
      stopLoading()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setLoadingError(errorMessage)
      return null
    }
  }, [startLoading, stopLoading, setLoadingError])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    withLoading,
  }
}

// Composant Skeleton amélioré pour les états de chargement
export interface SkeletonLoaderProps {
  lines?: number
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  animate?: boolean
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  lines = 3,
  className,
  variant = 'text',
  width,
  height,
  animate = true,
}) => {
  const baseClasses = cn(
    "bg-muted rounded",
    animate && "animate-pulse",
    className
  )

  const getSize = () => {
    const style: React.CSSProperties = {}
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height
    return style
  }

  switch (variant) {
    case 'circular':
      return (
        <div
          className={cn(baseClasses, "rounded-full w-12 h-12")}
          style={getSize()}
        />
      )

    case 'rectangular':
      return (
        <div
          className={cn(baseClasses, "w-full h-32")}
          style={getSize()}
        />
      )

    case 'card':
      return (
        <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
          <div className={cn(baseClasses, "h-4 w-3/4")} />
          <div className={cn(baseClasses, "h-4 w-1/2")} />
          <div className={cn(baseClasses, "h-20 w-full")} />
          <div className="flex justify-between">
            <div className={cn(baseClasses, "h-8 w-20")} />
            <div className={cn(baseClasses, "h-8 w-16")} />
          </div>
        </div>
      )

    default: // text
      return (
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                baseClasses,
                "h-4",
                i === lines - 1 ? "w-3/4" : "w-full"
              )}
              style={i === 0 ? getSize() : undefined}
            />
          ))}
        </div>
      )
  }
}

export {
  LoadingSpinner,
  LoadingPage,
  SkeletonLoader,
  spinnerVariants,
}