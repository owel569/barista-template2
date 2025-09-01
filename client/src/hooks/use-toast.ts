import { toast as sonnerToast } from 'sonner';
import React from 'react';

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } | React.ReactElement;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export interface ToastManager {
  (props: ToastProps): string | number;
  toast: (props: ToastProps) => string | number;
  success: (title: string, description?: string) => string | number;
  error: (title: string, description?: string) => string | number;
  warning: (title: string, description?: string) => string | number;
  info: (title: string, description?: string) => string | number;
  loading: (title: string, description?: string) => string | number;
  dismiss: (toastId?: string | number) => void;
  promise: <T>(promise: Promise<T>, messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }) => Promise<T>;
  operation: <T>(operation: () => Promise<T>, messages: {
    loading: string;
    success: string;
    error: string;
  }) => Promise<T>;
}

// Mock useToastFunction and dismiss for demonstration purposes if they are not provided elsewhere
// In a real scenario, these would be imported from your UI library or context.
const useToastFunction = () => sonnerToast;
const dismiss = (toastId?: string | number) => {
  if (toastId) {
    sonnerToast.dismiss(toastId);
  } else {
    sonnerToast.dismiss();
  }
};


export const useToast = (): ToastManager => {
  const toast = useToastFunction();

  const showToast = (props: ToastProps): string | number => {
    return toast(props);
  };

  const toastManager: ToastManager = {
    toast: showToast,
    success: (title: string, description?: string) => {
      return toast({
        title,
        description,
        variant: 'default'
      });
    },
    error: (title: string, description?: string) => {
      return toast({
        title,
        description,
        variant: 'destructive'
      });
    },
    warning: (title: string, description?: string) => {
      return toast({
        title,
        description,
        variant: 'warning'
      });
    },
    info: (title: string, description?: string) => {
      return toast({
        title,
        description,
        variant: 'default'
      });
    },
    loading: (title: string, description?: string) => {
      return toast({
        title,
        description,
        variant: 'default',
        duration: 0
      });
    },
    promise: async <T>(
      promise: Promise<T>,
      options: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      const loadingId = toastManager.loading(options.loading);

      try {
        const result = await promise;
        dismiss(loadingId.toString());
        const successMessage = typeof options.success === 'function'
          ? options.success(result)
          : options.success;
        toastManager.success(successMessage);
        return result;
      } catch (error) {
        dismiss(loadingId.toString());
        const errorMessage = typeof options.error === 'function'
          ? options.error(error as Error)
          : options.error;
        toastManager.error(errorMessage);
        throw error;
      }
    },
    operation: async <T>(
      operation: () => Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      }
    ): Promise<T> => {
      return toastManager.promise(operation(), messages);
    },
    dismiss
  };

  return toastManager;
};

// Export the toastManager directly for convenience if needed elsewhere
export const toast = useToast();

// Compatibility export for older usage patterns
export interface SimpleToastManager {
  success: (message: string) => string | number;
  error: (message: string) => string | number;
  info: (message: string) => string | number;
  warning: (message: string) => string | number;
}

const SIMPLE_TOAST_MANAGER: SimpleToastManager = {
  success: (message: string) => useToastFunction()({ title: "Succès", description: message }),
  error: (message: string) => useToastFunction()({ title: "Erreur", description: message, variant: "destructive" }),
  info: (message: string) => useToastFunction()({ title: "Information", description: message }),
  warning: (message: string) => useToastFunction()({ title: "Attention", description: message, variant: "destructive" })
};

export { SIMPLE_TOAST_MANAGER as toastManagerCompat };