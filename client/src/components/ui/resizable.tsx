"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const resizablePanelGroupVariants = cva(
  "flex h-full w-full",
  {
    variants: {
      direction: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
    },
    defaultVariants: {
      direction: "horizontal",
    },
  }
)

export interface ResizablePanelGroupProps
  extends React.ComponentProps<typeof ResizablePrimitive.PanelGroup>,
    VariantProps<typeof resizablePanelGroupVariants> {}

const ResizablePanelGroup = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelGroup>,
  ResizablePanelGroupProps
>(({ className, direction, ...props }, ref) => (
  <ResizablePrimitive.PanelGroup
    ref={ref}
    direction={direction}
    className={cn(
      resizablePanelGroupVariants({ direction }),
      "data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.Panel>,
  React.ComponentProps<typeof ResizablePrimitive.Panel>
>(({ className, ...props }, ref) => (
  <ResizablePrimitive.Panel
    ref={ref}
    className={cn("relative", className}
    {...props}
  />
);ResizablePanel.displayName = "ResizablePanel"

const resizableHandleVariants = cva(
  "relative flex items-center justify-center bg-border transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
  {
    variants: {
      direction: {
        horizontal: "w-px cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
        vertical: "h-px cursor-row-resize after:absolute after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2",
      },
      variant: {
        default: "",
        ghost: "bg-transparent hover:bg-accent/50",
        solid: "bg-border hover:bg-border/80",
      },
    },
    defaultVariants: {
      direction: "horizontal",
      variant: "default",
    },
  }
)

export interface ResizableHandleProps
  extends React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle>,
    VariantProps<typeof resizableHandleVariants> {
  withHandle?: boolean
  direction?: "horizontal" | "vertical"
}

const ResizableHandle = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.PanelResizeHandle>,
  ResizableHandleProps
>(({ withHandle, className, direction = "horizontal", variant, ...props }, ref) => (
  <ResizablePrimitive.PanelResizeHandle
    ref={ref}
    className={cn(
      resizableHandleVariants({ direction, variant }),
      "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border transition-colors hover:bg-accent">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    }
  </ResizablePrimitive.PanelResizeHandle>
);ResizableHandle.displayName = "ResizableHandle"

// Hook pour gérer les panneaux redimensionnables
export function useResizablePanels(
  initialSizes?: number[],
  minSizes?: number[],
  maxSizes?: number[]
) {
  const [sizes, setSizes] = React.useState<number[]>(initialSizes || [])
  
  const onLayout = React.useCallback((newSizes: number[]) => {
    setSizes(newSizes)
  }, [])

  const resetToDefault = React.useCallback(() => {
    if (initialSizes) {
      setSizes(initialSizes)
    }
  }, [initialSizes])

  const getTotalSize = React.useCallback(() => {
    return sizes.reduce((total, size) => total + size, 0)
  }, [sizes])

  const getPanelSize = React.useCallback((index: number) => {
    return sizes[index] || 0
  }, [sizes])

  return {
    sizes,
    setSizes,
    onLayout,
    resetToDefault,
    getTotalSize,
    getPanelSize,
    minSizes,
    maxSizes,
  }
}

// Composant de layout avec panneaux prédéfinis
export interface ResizableLayoutProps {
  children: React.ReactNode[]
  direction?: "horizontal" | "vertical"
  defaultSizes?: number[]
  minSizes?: number[]
  maxSizes?: number[]
  className?: string
  handleVariant?: VariantProps<typeof resizableHandleVariants>['variant']
  showHandles?: boolean
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  children,
  direction = "horizontal",
  defaultSizes,
  minSizes,
  maxSizes,
  className,
  handleVariant = "default",
  showHandles = true,
}) => {
  const { onLayout } = useResizablePanels(defaultSizes, minSizes, maxSizes)

  return (
    <ResizablePanelGroup
      direction={direction}
      onLayout={onLayout}
      className={className}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <ResizablePanel
            defaultSize={defaultSizes?.[index]}
            minSize={minSizes?.[index]}
            maxSize={maxSizes?.[index]}
          >
            {child}
          </ResizablePanel>
          {index < children.length - 1 && showHandles && (
            <ResizableHandle
              direction={direction}
              variant={handleVariant}
              withHandle
            />
          )}
        </React.Fragment>
      );}
    </ResizablePanelGroup>
  )
}

export { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle,
  resizablePanelGroupVariants,
  resizableHandleVariants,
}
