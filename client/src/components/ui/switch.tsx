"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
        outline: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-transparent border-input",
        secondary: "data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-input",
        warning: "data-[state=checked]:bg-yellow-600 data-[state=unchecked]:bg-input",
      },
      size: {
        sm: "h-4 w-7",
        default: "h-6 w-11",
        lg: "h-7 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
  {
    variants: {
      size: {
        sm: "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        lg: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  label?: string
  description?: string
  error?: string
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant, size, label, description, error, ...props }, ref) => (
  <div className="flex items-center space-x-2">
    <SwitchPrimitives.Root
      className={cn(switchVariants({ variant, size }), className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(switchThumbVariants({ size });}
      />
    </SwitchPrimitives.Root>
    {(label || description) && (
      <div className="grid gap-1.5 leading-none">
        {label && (
          <label
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            }
          >
            {label}
          </label>
        )}
        {description && (
          <p className={cn(
            "text-xs text-muted-foreground",
            error && "text-destructive"
          }>
            {description}
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )}
  </div>
);Switch.displayName = SwitchPrimitives.Root.displayName

// Composant Switch avec état contrôlé
export interface ControlledSwitchProps extends Omit<SwitchProps, 'checked' | 'onCheckedChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  defaultChecked?: boolean
}

const ControlledSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  ControlledSwitchProps
>(({ checked, onCheckedChange, defaultChecked, ...props }, ref) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false)
  
  const isControlled = checked !== undefined
  const checkedValue = isControlled ? checked : internalChecked
  
  const handleCheckedChange = (newChecked: boolean) => {
    if (!isControlled) {
      setInternalChecked(newChecked)
    }
    onCheckedChange?.(newChecked)
  }
  
  return (
    <Switch
      {...props}
      ref={ref}
      checked={checkedValue}
      onCheckedChange={handleCheckedChange}
    />
  });ControlledSwitch.displayName = "ControlledSwitch"

export { Switch, ControlledSwitch, switchVariants }
