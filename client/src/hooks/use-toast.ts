
import { toast as sonnerToast } from 'sonner';

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "error";

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: ToastVariant;
  duration?: number;
}

export interface UseToastReturn {
  toast: (props: Omit<ToastProps, 'id'> | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (toastId?: string) => void;
}

/**
 * Hook optimisé pour les notifications toast utilisant sonner
 * Compatible avec tous les variants et entièrement typé
 */
export const useToast = (): UseToastReturn => {
  const toast = (props: Omit<ToastProps, 'id'> | string) => {
    if (typeof props === 'string') {
      sonnerToast(props);
      return;
    }

    const { title, description, variant = 'default', duration, action } = props;
    const message = title && description ? `${title}: ${description}` : title || description || '';

    const toastOptions = {
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    };

    switch (variant) {
      case 'success':
        sonnerToast.success(message, toastOptions);
        break;
      case 'error':
      case 'destructive':
        sonnerToast.error(message, toastOptions);
        break;
      case 'warning':
        sonnerToast.warning(message, toastOptions);
        break;
      case 'info':
        sonnerToast.info(message, toastOptions);
        break;
      default:
        sonnerToast(message, toastOptions);
    }
  };

  const success = (message: string) => toast({ title: message, variant: 'success' });
  const error = (message: string) => toast({ title: message, variant: 'error' });
  const warning = (message: string) => toast({ title: message, variant: 'warning' });
  const info = (message: string) => toast({ title: message, variant: 'info' });
  const dismiss = (toastId?: string) => sonnerToast.dismiss(toastId);

  return {
    toast,
    success,
    error,
    warning,
    info,
    dismiss
  };
};

// Export par défaut pour compatibilité
export default useToast;
