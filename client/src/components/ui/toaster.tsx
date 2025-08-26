import { Toaster as SonnerToaster } from 'sonner';
import React from 'react';
import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport } from './toast';
import { useToast } from './use-toast';

export function Toaster(): JSX.Element {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts && Array.isArray(toasts) && toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}