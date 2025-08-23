"use client"

import * as React from "react"
import { Button, type ButtonProps } from "./button"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  loadingIcon?: React.ReactNode
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    loading = false, 
    loadingText, 
    children, 
    disabled, 
    className,
    icon,
    loadingIcon,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          loading && "cursor-not-allowed",
          className
        }
        {...props}
      >
        {loading ? (
          <>
            {loadingIcon || <LoadingSpinner size="sm" />}
            <span className="ml-2">
              {loadingText || "Chargement..."}
            </span>
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </Button>
    });LoadingButton.displayName = "LoadingButton"

// Hook pour gérer l'état de chargement d'un bouton
export function useLoadingButton(asyncFunction?: () => Promise<void>) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const execute = React.useCallback(async () => {
    if (loading || !asyncFunction) return

    setLoading(true)
    setError(null)
    
    try {
      await asyncFunction()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      console.error('LoadingButton error:', err)
    } finally {
      setLoading(false)
    }
  }, [asyncFunction, loading])

  const reset = React.useCallback(() => {
    setLoading(false)
    setError(null)
  }, [])

  return {
    loading,
    error,
    execute,
    reset,
  }
}

// Composant LoadingButton avec gestion automatique des erreurs
export interface AsyncLoadingButtonProps extends Omit<LoadingButtonProps, 'loading' | 'onClick'> {
  onAsyncClick: () => Promise<void>
  onError?: (error: string) => void
  onSuccess?: () => void
  showErrorToast?: boolean
}

export const AsyncLoadingButton: React.FC<AsyncLoadingButtonProps> = ({
  onAsyncClick,
  onError,
  onSuccess,
  showErrorToast = true,
  ...props
}) => {
  const { loading, error, execute } = useLoadingButton(onAsyncClick)

  const handleClick = React.useCallback(async () => {
    await execute()
    
    if (error) {
      onError?.(error)
      if (showErrorToast) {
        // Ici vous pouvez ajouter un toast d'erreur
        console.error('AsyncLoadingButton error:', error)
      }
    } else {
      onSuccess?.()
    }
  }, [execute, error, onError, onSuccess, showErrorToast])

  return (
    <LoadingButton
      loading={loading}
      onClick={handleClick}
      {...props}
    />
  )
}

export { LoadingButton }