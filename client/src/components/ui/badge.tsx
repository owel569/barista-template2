import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-600 text-white hover:bg-green-700",
        warning:
          "border-transparent bg-yellow-600 text-white hover:bg-yellow-700",
        info:
          "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        purple:
          "border-transparent bg-purple-600 text-white hover:bg-purple-700",
        pink:
          "border-transparent bg-pink-600 text-white hover:bg-pink-700",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({ className, variant, size, dot, removable, onRemove, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
      {removable && (
        <button
          type="button"
          className="ml-1 -mr-1 h-4 w-4 rounded-full hover:bg-black/10 flex items-center justify-center"
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }