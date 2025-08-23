"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { sanitizeString } from "@/lib/security"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const alertDialogOverlayVariants = cva(
  "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  {
    variants: {
      variant: {
        default: "bg-black/80",
        light: "bg-black/60",
        dark: "bg-black/90",
        blur: "bg-black/40 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> &
    VariantProps<typeof alertDialogOverlayVariants>
>(({ className, variant, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(alertDialogOverlayVariants({ variant }), className)}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const alertDialogContentVariants = cva(
  "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  {
    variants: {
      size: {
        sm: "max-w-md p-4",
        default: "max-w-lg p-6",
        lg: "max-w-2xl p-8",
        xl: "max-w-4xl p-10",
        full: "max-w-[95vw] max-h-[95vh] p-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> &
    VariantProps<typeof alertDialogContentVariants> & {
      overlayVariant?: VariantProps<typeof alertDialogOverlayVariants>['variant']
    }
>(({ className, size, overlayVariant, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay variant={overlayVariant} />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(alertDialogContentVariants({ size }), className)}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, children, ...props }, ref) => {
  // Sanitisation du titre pour la sécurité
  const sanitizedChildren = typeof children === 'string' 
    ? sanitizeString(children, { maxLength: 200 }) 
    : children

  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    >
      {sanitizedChildren}
    </AlertDialogPrimitive.Title>
  )
})
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, children, ...props }, ref) => {
  // Sanitisation de la description pour la sécurité
  const sanitizedChildren = typeof children === 'string' 
    ? sanitizeString(children, { maxLength: 1000 }) 
    : children

  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {sanitizedChildren}
    </AlertDialogPrimitive.Description>
  )
})
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> &
    VariantProps<typeof buttonVariants> & {
      isLoading?: boolean
    }
>(({ className, variant = "default", size, isLoading, children, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant, size }), className)}
    disabled={isLoading || props.disabled}
    {...props}
  >
    {isLoading ? (
      <>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        {typeof children === 'string' ? 'Chargement...' : children}
      </>
    ) : (
      children
    )}
  </AlertDialogPrimitive.Action>
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> &
    VariantProps<typeof buttonVariants>
>(({ className, variant = "outline", size, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant, size }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

// Composant AlertDialog avec configuration prédéfinie
export interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  size?: VariantProps<typeof alertDialogContentVariants>['size']
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  children?: React.ReactNode
}

const AlertDialogComponent: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = 'default',
  size,
  onConfirm,
  onCancel,
  isLoading = false,
  children,
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleConfirm = React.useCallback(async () => {
    if (isConfirming || isLoading) return
    
    setIsConfirming(true)
    try {
      await onConfirm?.()
      onOpenChange?.(false)
    } catch (error) {
      console.error('Error in alert dialog confirm:', error)
    } finally {
      setIsConfirming(false)
    }
  }, [onConfirm, onOpenChange, isConfirming, isLoading])

  const handleCancel = React.useCallback(() => {
    if (isConfirming || isLoading) return
    onCancel?.()
    onOpenChange?.(false)
  }, [onCancel, onOpenChange, isConfirming, isLoading])

  const actionVariant = variant === 'destructive' ? 'destructive' : 
                       variant === 'warning' ? 'warning' : 'default'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        
        {children}
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isConfirming || isLoading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            variant={actionVariant}
            onClick={handleConfirm}
            isLoading={isConfirming || isLoading}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogComponent,
  alertDialogContentVariants,
  alertDialogOverlayVariants,
}
