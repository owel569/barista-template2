
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-muted",
  {
    variants: {
      variant: {
        default: "bg-muted",
        lighter: "bg-muted/60",
        darker: "bg-muted-foreground/20",
        shimmer: "bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
  circle?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, circle, style, ...props }, ref) => {
    const inlineStyles = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    }

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ variant }),
          circle && "rounded-full",
          className
        )}
        style={inlineStyles}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

// Composants de skeleton prédéfinis
const SkeletonText = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, 'height'> & { lines?: number; lineHeight?: string }
>(({ lines = 1, lineHeight = "1rem", className, ...props }, ref) => {
  if (lines === 1) {
    return (
      <Skeleton
        ref={ref}
        height={lineHeight}
        className={cn("w-full", className)}
        {...props}
      />
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          className={cn(
            "w-full",
            i === lines - 1 && "w-3/4", // Dernière ligne plus courte
            className
          )}
          {...props}
        />
      ))}
    </div>
  )
})
SkeletonText.displayName = "SkeletonText"

const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  SkeletonProps & { 
    showImage?: boolean
    imageHeight?: string | number
    showHeader?: boolean
    showFooter?: boolean
    contentLines?: number
  }
>(({ 
  showImage = true, 
  imageHeight = "12rem", 
  showHeader = true, 
  showFooter = false,
  contentLines = 3,
  className,
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={cn("space-y-4 p-4 border rounded-lg", className)}>
      {showImage && (
        <Skeleton height={imageHeight} className="w-full" {...props} />
      )}
      
      {showHeader && (
        <div className="space-y-2">
          <Skeleton height="1.5rem" className="w-3/4" {...props} />
          <Skeleton height="1rem" className="w-1/2" {...props} />
        </div>
      )}
      
      <SkeletonText lines={contentLines} {...props} />
      
      {showFooter && (
        <div className="flex justify-between items-center">
          <Skeleton height="2rem" width="5rem" {...props} />
          <Skeleton height="2rem" width="3rem" {...props} />
        </div>
      )}
    </div>
  )
})
SkeletonCard.displayName = "SkeletonCard"

const SkeletonTable = React.forwardRef<
  HTMLDivElement,
  SkeletonProps & { rows?: number; cols?: number }
>(({ rows = 5, cols = 4, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("space-y-4", className)}>
      {/* En-tête */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} height="2rem" {...props} />
        ))}
      </div>
      
      {/* Lignes */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              height="1.5rem" 
              variant="lighter"
              {...props} 
            />
          ))}
        </div>
      ))}
    </div>
  )
})
SkeletonTable.displayName = "SkeletonTable"

const SkeletonAvatar = React.forwardRef<
  HTMLDivElement,
  SkeletonProps & { size?: "sm" | "default" | "lg" | "xl" }
>(({ size = "default", className, ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }

  return (
    <Skeleton
      ref={ref}
      circle
      className={cn(sizeClasses[size], className)}
      {...props}
    />
  )
})
SkeletonAvatar.displayName = "SkeletonAvatar"

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonAvatar,
  skeletonVariants 
}
