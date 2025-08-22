
<old_str>
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
</old_str>
<new_str>
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
        default: "border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        destructive: "border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground",
        outline: "border-input data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground",
        secondary: "border-secondary data-[state=checked]:bg-secondary data-[state=checked]:text-secondary-foreground",
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
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, size, indeterminate, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ variant, size }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
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
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Groupe de Checkboxes
export interface CheckboxGroupProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
  spacing?: "sm" | "md" | "lg";
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  ({ children, orientation = "vertical", className, spacing = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
          spacing === "sm" && (orientation === "vertical" ? "space-y-1" : "gap-2"),
          spacing === "md" && (orientation === "vertical" ? "space-y-2" : "gap-3"),
          spacing === "lg" && (orientation === "vertical" ? "space-y-3" : "gap-4"),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CheckboxGroup.displayName = "CheckboxGroup";

// Checkbox avec label
export interface CheckboxWithLabelProps extends CheckboxProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
}

const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ label, description, required, error, className, id, ...props }, ref) => {
  const checkboxId = id || React.useId();

  return (
    <div className="space-y-1">
      <div className="flex items-start space-x-2">
        <Checkbox
          ref={ref}
          id={checkboxId}
          className={cn(error && "border-destructive", className)}
          {...props}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
});
CheckboxWithLabel.displayName = "CheckboxWithLabel";

export { Checkbox, CheckboxGroup, CheckboxWithLabel, checkboxVariants }
</new_str>
