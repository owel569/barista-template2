"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog"
import { LoadingSpinner } from "./loading-spinner"
import { sanitizeString } from "@/lib/security"

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  variant?: "default" | "destructive" | "warning"
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  loading = false,
  variant = "default",
  icon,
  children
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleConfirm = React.useCallback(async () => {
    if (isConfirming || loading) return
    
    setIsConfirming(true)
    try {
      await onConfirm?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error in confirmation dialog:', error)
    } finally {
      setIsConfirming(false)
    }
  }, [onConfirm, onOpenChange, isConfirming, loading])

  const handleCancel = React.useCallback(() => {
    if (isConfirming || loading) return
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange, isConfirming, loading])

  const actionVariant = variant === 'destructive' ? 'destructive' : 
                       variant === 'warning' ? 'warning' : 'default'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <AlertDialogTitle>
              {sanitizeString(title, { maxLength: 100 })}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {sanitizeString(description, { maxLength: 500 })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel} 
            disabled={isConfirming || loading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            onClick={handleConfirm}
            disabled={isConfirming || loading}
          >
            {(isConfirming || loading) ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Traitement...</span>
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook pour utiliser facilement les dialogues de confirmation
export function useConfirmationDialog() {
  const [dialog, setDialog] = React.useState<{
    open: boolean
    props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>
  }>({
    open: false,
    props: {
      title: '',
      description: '',
      onConfirm: () => {},
    }
  })

  const showDialog = React.useCallback((props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    setDialog({ open: true, props })
  }, [])

  const hideDialog = React.useCallback(() => {
    setDialog(prev => ({ ...prev, open: false }))
  }, [])

  const confirmDelete = React.useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>
  ) => {
    showDialog({
      title: "Supprimer l'élément",
      description: `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      variant: "destructive",
      onConfirm,
    })
  }, [showDialog])

  const confirmAction = React.useCallback((
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string
      variant?: "default" | "destructive" | "warning"
      icon?: React.ReactNode
    }
  ) => {
    showDialog({
      title,
      description,
      onConfirm,
      confirmText: options?.confirmText || "Confirmer",
      variant: options?.variant || "default",
      icon: options?.icon,
    })
  }, [showDialog])

  const DialogComponent = React.useMemo(() => (
    <ConfirmationDialog
      open={dialog.open}
      onOpenChange={hideDialog}
      {...dialog.props}
    />
  ), [dialog, hideDialog])

  return {
    showDialog,
    hideDialog,
    confirmDelete,
    confirmAction,
    DialogComponent,
  }
}