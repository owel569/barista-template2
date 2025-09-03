"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cva, type VariantProps } from "class-variance-authority"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const radioGroupVariants = cva(
  "grid gap-2",
  {
    variants: {
      orientation: {
        vertical: "grid-cols-1",
        horizontal: "grid-flow-col auto-cols-max gap-4",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

const radioGroupItemVariants = cva(
  "aspect-square rounded-full border text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary",
        destructive: "border-destructive text-destructive",
        outline: "border-input",
        secondary: "border-secondary text-secondary",
      },
      size: {
        sm: "h-3 w-3",
        default: "h-4 w-4", 
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface RadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>, 'orientation'>,
    VariantProps<typeof radioGroupVariants> {
  error?: string
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation, error, ...props }, ref) => {
  return (
    <div className="space-y-1">
      <RadioGroupPrimitive.Root
        className={cn(radioGroupVariants({ orientation }), className)}
        {...props}
        ref={ref}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {
  label?: string
  description?: string
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, size, label, description, children, ...props }, ref) => {
  const itemId = props.id || React.useId()
  
  if (label || description) {
    return (
      <div className="flex items-start space-x-2">
        <RadioGroupPrimitive.Item
          ref={ref}
          id={itemId}
          className={cn(radioGroupItemVariants({ variant, size }), "mt-0.5", className)}
          {...props}
        >
          <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={itemId}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {label}
            </label>
          )}
          {typeof description === 'string' ? (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    )
  }

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioGroupItemVariants({ variant, size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
      {children}
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Composant Radio Group avec options prédéfinies
export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupWithOptionsProps extends Omit<RadioGroupProps, 'children'> {
  options: RadioOption[]
  value?: string
  onValueChange?: (value: string) => void
  variant?: VariantProps<typeof radioGroupItemVariants>['variant']
  size?: VariantProps<typeof radioGroupItemVariants>['size']
}

const RadioGroupWithOptions = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupWithOptionsProps
>(({ options, variant, size, ...props }, ref) => {
  return (
    <RadioGroup {...props} ref={ref}>
      {options.map((option) => (
        <RadioGroupItem
          key={option.value}
          value={option.value}
          variant={variant}
          size={size}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
        />
      ))}
    </RadioGroup>
  )
})

RadioGroupWithOptions.displayName = "RadioGroupWithOptions"

export { RadioGroup, RadioGroupItem, RadioGroupWithOptions, radioGroupVariants }
