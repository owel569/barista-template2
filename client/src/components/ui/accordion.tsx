
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { sanitizeString } from "@/lib/security"

const Accordion = AccordionPrimitive.Root

const accordionItemVariants = cva(
  "border-b transition-colors",
  {
    variants: {
      variant: {
        default: "border-border",
        bordered: "border border-border rounded-lg mb-2 last:mb-0",
        filled: "bg-muted/50 border border-border rounded-lg mb-2 last:mb-0 px-4",
        ghost: "border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> &
    VariantProps<typeof accordionItemVariants>
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const accordionTriggerVariants = cva(
  "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
  {
    variants: {
      size: {
        sm: "py-2 text-xs",
        default: "py-4 text-sm",
        lg: "py-6 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> &
    VariantProps<typeof accordionTriggerVariants> & {
      iconType?: 'chevron' | 'plus-minus'
      hideIcon?: boolean
    }
>(({ className, children, size, iconType = 'chevron', hideIcon = false, ...props }, ref) => {
  // Sanitisation du contenu pour la sécurité
  const sanitizedChildren = typeof children === 'string' 
    ? sanitizeString(children, { maxLength: 500 }) 
    : children

  return (
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(accordionTriggerVariants({ size }), className)}
      {...props}
    >
      {sanitizedChildren}
      {!hideIcon && (
        <div className="flex items-center relative">
          {iconType === 'plus-minus' ? (
            <>
              <Plus className="h-4 w-4 shrink-0 transition-all duration-200 data-[state=open]:rotate-45 data-[state=open]:opacity-0" />
              <Minus className="h-4 w-4 shrink-0 transition-all duration-200 absolute data-[state=closed]:rotate-45 data-[state=closed]:opacity-0" />
            </>
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          )}
        </div>
      )}
    </AccordionPrimitive.Trigger>
  )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const accordionContentVariants = cva(
  "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
  {
    variants: {
      padding: {
        none: "",
        sm: "pb-2",
        default: "pb-4 pt-0",
        lg: "pb-6 pt-0",
      },
    },
    defaultVariants: {
      padding: "default",
    },
  }
)

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> &
    VariantProps<typeof accordionContentVariants>
>(({ className, children, padding, ...props }, ref) => {
  // Sanitisation du contenu pour la sécurité
  const sanitizedChildren = typeof children === 'string' 
    ? sanitizeString(children, { maxLength: 5000 }) 
    : children

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(accordionContentVariants({ padding }), className)}
      {...props}
    >
      <div className={cn(padding !== 'none' && 'pb-4 pt-0')}>
        {sanitizedChildren}
      </div>
    </AccordionPrimitive.Content>
  )
})
AccordionContent.displayName = AccordionPrimitive.Content.displayName

// Types pour les données d'accordion
export interface AccordionItemData {
  id: string
  trigger: string
  content: React.ReactNode
  disabled?: boolean
  defaultOpen?: boolean
}

export interface AccordionWithDefaultsProps {
  items: AccordionItemData[]
  type?: 'single' | 'multiple'
  variant?: VariantProps<typeof accordionItemVariants>['variant']
  size?: VariantProps<typeof accordionTriggerVariants>['size']
  iconType?: 'chevron' | 'plus-minus'
  collapsible?: boolean
  className?: string
  onValueChange?: (value: string | string[]) => void
  defaultValue?: string | string[]
}

// Composant Accordion avec configuration par défaut
const AccordionWithDefaults: React.FC<AccordionWithDefaultsProps> = ({
  items,
  type = 'single',
  variant,
  size,
  iconType,
  collapsible = true,
  className,
  onValueChange,
  defaultValue,
}) => {
  return (
    <Accordion
      type={type}
      collapsible={type === 'single' ? collapsible : undefined}
      className={className}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          variant={variant}
          disabled={item.disabled}
        >
          <AccordionTrigger size={size} iconType={iconType}>
            {item.trigger}
          </AccordionTrigger>
          <AccordionContent>
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

// Types pour le groupe d'accordéons
export interface AccordionGroupProps {
  accordions: {
    title?: string
    items: AccordionItemData[]
    props?: Omit<AccordionWithDefaultsProps, 'items'>
  }[]
  className?: string
}

// Composant pour grouper plusieurs accordéons
const AccordionGroup: React.FC<AccordionGroupProps> = ({
  accordions,
  className,
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      {accordions.map((accordion, index) => (
        <div key={index} className="space-y-2">
          {accordion.title && (
            <h3 className="text-lg font-semibold">{accordion.title}</h3>
          )}
          <AccordionWithDefaults
            items={accordion.items}
            {...accordion.props}
          />
        </div>
      ))}
    </div>
  )
}

// Hook pour contrôler l'état de l'accordion
export function useAccordion(
  type: 'single' | 'multiple' = 'single',
  defaultValue?: string | string[]
) {
  const [value, setValue] = React.useState<string | string[]>(
    defaultValue ?? (type === 'single' ? '' : [])
  )

  const toggle = React.useCallback((itemValue: string) => {
    if (type === 'single') {
      setValue(current => current === itemValue ? '' : itemValue)
    } else {
      setValue(current => {
        const currentArray = Array.isArray(current) ? current : []
        return currentArray.includes(itemValue)
          ? currentArray.filter(v => v !== itemValue)
          : [...currentArray, itemValue]
      })
    }
  }, [type])

  const isOpen = React.useCallback((itemValue: string) => {
    if (type === 'single') {
      return value === itemValue
    } else {
      return Array.isArray(value) && value.includes(itemValue)
    }
  }, [value, type])

  const openAll = React.useCallback((itemValues: string[]) => {
    if (type === 'multiple') {
      setValue(itemValues)
    }
  }, [type])

  const closeAll = React.useCallback(() => {
    setValue(type === 'single' ? '' : [])
  }, [type])

  return {
    value,
    setValue,
    toggle,
    isOpen,
    openAll,
    closeAll,
  }
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionWithDefaults,
  AccordionGroup,
  accordionItemVariants,
  accordionTriggerVariants,
  accordionContentVariants,
}
