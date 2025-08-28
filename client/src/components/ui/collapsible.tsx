"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

const collapsibleTriggerVariants = cva(
  "flex w-full items-center justify-between py-2 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
  {
    variants: {
      variant: {
        default: "",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "py-1 text-xs",
        default: "py-2 text-sm",
        lg: "py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CollapsibleTriggerButtonProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
    VariantProps<typeof collapsibleTriggerVariants> {
  hideIcon?: boolean
}

const CollapsibleTriggerButton = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  CollapsibleTriggerButtonProps
>(({ className, variant, size, children, hideIcon = false, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(collapsibleTriggerVariants({ variant, size }), className)}
    {...props}
  >
    {children}
    {!hideIcon && (
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    )}
  </CollapsiblePrimitive.CollapsibleTrigger>
))
CollapsibleTriggerButton.displayName = CollapsiblePrimitive.CollapsibleTrigger.displayName

const collapsibleContentVariants = cva(
  "overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
  {
    variants: {
      padding: {
        none: "",
        sm: "px-2 pb-2",
        default: "px-4 pb-4",
        lg: "px-6 pb-6",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
)

export interface CollapsibleContentWrapperProps
  extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>,
    VariantProps<typeof collapsibleContentVariants> {
  className?: string;
}

const CollapsibleContentWrapper = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  CollapsibleContentWrapperProps
>(({ className, padding, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(collapsibleContentVariants({ padding }), className)}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
))
CollapsibleContentWrapper.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

// Hook pour contrôler l'état du collapsible
export function useCollapsible(defaultOpen: boolean = false) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const toggle = React.useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const open = React.useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    setIsOpen,
    toggle,
    open,
    close,
  }
}

export { 
  Collapsible, 
  CollapsibleTrigger, 
  CollapsibleContent,
  CollapsibleTriggerButton,
  CollapsibleContentWrapper,
  collapsibleTriggerVariants,
  collapsibleContentVariants,
}