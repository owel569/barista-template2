import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface UseToastReturn {
  toast: (props: ToastProps | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (toastId?: string) => void;
}

/**
 * Hook optimisé pour les notifications toast utilisant sonner
 * Plus léger et plus performant que react-hot-toast
 */
export const useToast = (): UseToastReturn => {
  const toast = (props: ToastProps | string) => {
    if (typeof props === 'string') {
      sonnerToast(props);
      return;
    }

    const { title, description, variant = 'default', duration, action } = props;
    const message = title && description ? `${title}: ${description}` : title || description || '';

    switch (variant) {
      case 'success':
        sonnerToast.success(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick
          } : undefined
        });
        break;
      case 'error':
        sonnerToast.error(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick
          } : undefined
        });
        break;
      case 'warning':
        sonnerToast.warning(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick
          } : undefined
        });
        break;
      case 'info':
        sonnerToast.info(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick
          } : undefined
        });
        break;
      default:
        sonnerToast(message, {
          duration,
          action: action ? {
            label: action.label,
            onClick: action.onClick
          } : undefined
        });
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