"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const aspectRatioVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        rounded: "rounded-lg",
        circle: "rounded-full",
        bordered: "border border-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface AspectRatioProps
  extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>,
    VariantProps<typeof aspectRatioVariants> {
  ratio?: number
  children?: React.ReactNode
}

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ className, variant, ratio = 16 / 9, children, ...props }, ref) => (
  <AspectRatioPrimitive.Root
    ref={ref}
    ratio={ratio}
    className={cn(aspectRatioVariants({ variant }), className)}
    {...props}
  >
    {children}
  </AspectRatioPrimitive.Root>
))
AspectRatio.displayName = AspectRatioPrimitive.Root.displayName

export { AspectRatio, aspectRatioVariants }
