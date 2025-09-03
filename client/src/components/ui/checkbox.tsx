"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        destructive: "border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:text-destructive-foreground",
        outline: "border-input data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[state=indeterminate]:bg-accent data-[state=indeterminate]:text-accent-foreground",
        secondary: "border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground data-[state=indeterminate]:bg-secondary data-[state=indeterminate]:text-secondary-foreground",
        success: "border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white data-[state=indeterminate]:bg-green-600 data-[state=indeterminate]:text-white",
      },
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  label?: string
  description?: string | undefined
  error?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, size, label, description, error, indeterminate, ...props }, ref) => {
  const checkboxId = props.id || React.useId()
  
  const checkbox = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      className={cn(checkboxVariants({ variant, size }), className)}
      {...props}
      checked={indeterminate ? "indeterminate" : (props.checked ?? false)}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        {indeterminate ? (
          <Minus className={cn(
            size === "sm" && "h-2 w-2",
            size === "default" && "h-3 w-3",
            size === "lg" && "h-4 w-4"
          )} />
        ) : (
          <Check className={cn(
            size === "sm" && "h-2 w-2",
            size === "default" && "h-3 w-3",
            size === "lg" && "h-4 w-4"
          )} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )

  if (label || description) {
    return (
      <div className="flex items-start space-x-2">
        {checkbox}
        <div className="grid gap-1.5 leading-none">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                error && "text-destructive"
              )}
            >
              {label}
            </label>
          )}
          {typeof description === 'string' ? (
            <p className={cn(
              "text-xs text-muted-foreground",
              error && "text-destructive"
            )}>
              {description}
            </p>
          ) : null}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return checkbox
})

Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Composant Checkbox Group pour gérer plusieurs checkboxes
export interface CheckboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface CheckboxGroupProps {
  options: CheckboxOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  variant?: VariantProps<typeof checkboxVariants>['variant']
  size?: VariantProps<typeof checkboxVariants>['size']
  className?: string
  orientation?: 'horizontal' | 'vertical'
  error?: string
}

const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(({ 
  options, 
  value = [], 
  onValueChange, 
  variant, 
  size, 
  className, 
  orientation = 'vertical',
  error,
  ...props 
}, ref) => {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onValueChange?.([...value, optionValue])
    } else {
      onValueChange?.(value.filter(v => v !== optionValue))
    }
  }

  return (
    <div 
      ref={ref}
      className={cn(
        "space-y-2",
        orientation === 'horizontal' && "flex flex-wrap gap-4 space-y-0",
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <Checkbox
          key={option.value}
          variant={variant}
          size={size}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          checked={value.includes(option.value)}
          onCheckedChange={(checked) => 
            handleCheckboxChange(option.value, checked as boolean)
          }
        />
      ))}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
})

CheckboxGroup.displayName = "CheckboxGroup"

export { Checkbox, CheckboxGroup, checkboxVariants }
