import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
      },
      variant: {
        default: "",
        bordered: "ring-2 ring-border ring-offset-2 ring-offset-background",
        subtle: "ring-1 ring-border/50",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  showFallbackIcon?: boolean;
  status?: "online" | "offline" | "away" | "busy";
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ 
  className, 
  size, 
  variant,
  src,
  alt,
  fallback,
  showFallbackIcon = true,
  status,
  children,
  ...props 
}, ref) => (
  <div className="relative inline-block">
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, variant }), className)}
      {...props}
    >
      {src && (
        <AvatarImage src={src} alt={alt} />
      )}
      <AvatarFallback showIcon={showFallbackIcon}>
        {fallback}
      </AvatarFallback>
      {children}
    </AvatarPrimitive.Root>
    {status && (
      <span
        className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
          size === "sm" && "h-2 w-2",
          size === "default" && "h-2.5 w-2.5",
          size === "lg" && "h-3 w-3",
          size === "xl" && "h-3.5 w-3.5",
          size === "2xl" && "h-4 w-4",
          status === "online" && "bg-green-500",
          status === "offline" && "bg-gray-400",
          status === "away" && "bg-yellow-500",
          status === "busy" && "bg-red-500"
        )}
      />
    )}
  </div>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

interface AvatarFallbackProps 
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  showIcon?: boolean;
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, children, showIcon = true, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  >
    {children || (showIcon && <User className="h-4 w-4" />)}
  </AvatarPrimitive.Fallback>
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Composant groupe d'avatars
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: "sm" | "default" | "lg" | "xl" | "2xl";
  className?: string;
}

const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  AvatarGroupProps
>(({ children, max = 3, size = "default", className, ...props }, ref) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <div 
      ref={ref}
      className={cn("flex -space-x-2", className)} 
      {...props}
    >
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <Avatar size={size} variant="bordered">
          <AvatarFallback showIcon={false}>
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});
AvatarGroup.displayName = "AvatarGroup";

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants }