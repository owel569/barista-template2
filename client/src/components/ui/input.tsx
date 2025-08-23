import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Search, X } from "lucide-react"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3",
        ghost: "border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      inputState: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-green-500 focus-visible:ring-green-500",
        warning: "border-yellow-500 focus-visible:ring-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
      inputState: "default",
    },
  }
)

// Types sécurisés pour les inputs autorisés
const ALLOWED_INPUT_TYPES = [
  "text", "password", "email", "number", "tel", "url", 
  "search", "date", "datetime-local", "time"
] as const

type AllowedInputType = typeof ALLOWED_INPUT_TYPES[number]

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  variant?: VariantProps<typeof inputVariants>['variant']
  inputState?: VariantProps<typeof inputVariants>['inputState']
  type?: AllowedInputType
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  error?: string
  helperText?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  maxLength?: number
  minLength?: number
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant,
    inputState,
    type = "text", 
    leftIcon,
    rightIcon,
    clearable = false,
    onClear,
    error,
    helperText,
    value,
    onChange,
    maxLength,
    minLength,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    
    // Validation du type d'input pour la sécurité
    const safeType = ALLOWED_INPUT_TYPES.includes(type as AllowedInputType) ? type : "text"
    const isPassword = safeType === "password"
    const isSearch = safeType === "search"
    const hasError = Boolean(error) || inputState === "error"
    
    const inputType = isPassword ? (showPassword ? "text" : "password") : safeType

    // Handler sécurisé pour le changement de valeur
    const handleChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      // Validation de base pour éviter les injections
      const inputValue = event.target.value
      
      // Validation de longueur
      if (maxLength && inputValue.length > maxLength) {
        return // Empêche la saisie au-delà de la limite
      }
      
      // Appel du handler externe
      onChange?.(event)
    }, [onChange, maxLength])

    // Handler sécurisé pour le clear
    const handleClear = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onClear?.()
    }, [onClear])

    // Handler sécurisé pour toggle password
    const handleTogglePassword = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setShowPassword(prev => !prev)
    }, [])

    const inputId = props.id || React.useId()
    const errorId = error ? `${inputId}-error` : undefined
    const helperTextId = helperText ? `${inputId}-helper` : undefined

    return (
      <div className="space-y-1">
        <div className="relative">
          {leftIcon && (
            <div 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              inputVariants({ variant, inputState: hasError ? "error" : inputState }),
              leftIcon && "pl-10",
              (rightIcon || isPassword || (clearable && value) || isSearch) && "pr-10",
              className
            )}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            maxLength={maxLength}
            minLength={minLength}
            aria-invalid={hasError}
            aria-describedby={cn(
              errorId,
              helperTextId
            }
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clearable && value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-accent"
                aria-label="Effacer"
                tabIndex={-1}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {isPassword && (
              <button
                type="button"
                onClick={handleTogglePassword}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-sm hover:bg-accent"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
            
            {isSearch && !clearable && (
              <Search className="h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            }
            
            {rightIcon && !isPassword && !clearable && !isSearch && (
              <div className="pointer-events-none" aria-hidden="true">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        
        {(error || helperText) && (
          <div className="space-y-1">
            {error && (
              <p 
                id={errorId}
                className="text-xs text-destructive"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            {helperText && !error && (
              <p 
                id={helperTextId}
                className="text-xs text-muted-foreground"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    });Input.displayName = "Input"

export { Input, inputVariants, ALLOWED_INPUT_TYPES }
export type { AllowedInputType }