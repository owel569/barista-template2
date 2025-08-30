import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode | {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  variant?: 'default' | 'destructive';
}

class ToastManager {
  private defaultDuration = 4000;

  toast(props: ToastProps) {
    const { title, description, variant = 'default', duration = this.defaultDuration, action } = props;

    const message = title || description || '';
    const options = {
      description: title && description ? description : undefined,
      duration,
      action: action ? {
        label: typeof action === 'object' ? action.label : 'Action',
        onClick: typeof action === 'object' ? action.onClick : undefined
      } : undefined
    };

    switch (variant) {
      case 'success':
        return sonnerToast.success(message, options);
      case 'destructive':
        return sonnerToast.error(message, options);
      case 'warning':
        return sonnerToast.warning(message, options);
      case 'info':
        return sonnerToast.info(message, options);
      default:
        return sonnerToast(message, options);
    }
  }

  success(title: string, description?: string, duration?: number) {
    return this.toast({ title, description, variant: 'success', duration });
  }

  error(title: string, description?: string, duration?: number) {
    return this.toast({ title, description, variant: 'destructive', duration });
  }

  warning(title: string, description?: string, duration?: number) {
    return this.toast({ title, description, variant: 'warning', duration });
  }

  info(title: string, description?: string, duration?: number) {
    return this.toast({ title, description, variant: 'info', duration });
  }

  dismiss(toastId?: string | number) {
    if (toastId) {
      sonnerToast.dismiss(toastId);
    } else {
      sonnerToast.dismiss();
    }
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return sonnerToast.promise(promise, messages);
  }

  confirm(
    title: string,
    description?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) {
    return this.toast({
      title,
      description,
      variant: 'warning',
      action: {
        label: 'Confirmer',
        onClick: () => {
          onConfirm?.();
          this.dismiss();
        }
      }
    });
  }

  loading(title: string, description?: string) {
    return this.toast({
      title,
      description,
      variant: 'info',
      duration: 0 // Persistant jusqu'à dismiss
    });
  }

  operation<T>(
    operation: () => Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> {
    const loadingToast = this.loading(messages.loading);

    return operation()
      .then((result) => {
        this.dismiss(loadingToast);
        this.success(messages.success);
        return result;
      })
      .catch((error) => {
        this.dismiss(loadingToast);
        this.error(messages.error, error.message);
        throw error;
      });
  }

  batch(toasts: ToastProps[]) {
    return toasts.map(toast => this.toast(toast));
  }
}

const toastManager = new ToastManager();

export const useToast = () => {
  return {
    toast: toastManager.toast.bind(toastManager),
    success: toastManager.success.bind(toastManager),
    error: toastManager.error.bind(toastManager),
    warning: toastManager.warning.bind(toastManager),
    info: toastManager.info.bind(toastManager),
    dismiss: toastManager.dismiss.bind(toastManager),
    promise: toastManager.promise.bind(toastManager),
    confirm: toastManager.confirm.bind(toastManager),
    loading: toastManager.loading.bind(toastManager),
    operation: toastManager.operation.bind(toastManager),
    batch: toastManager.batch.bind(toastManager)
  };
};

export { toastManager as toast };
export { toastManager };

// Export du toastManager pour compatibilité
export const toastManagerCompat = {
  success: (message: string) => toast({ title: "Succès", description: message }),
  error: (message: string) => toast({ title: "Erreur", description: message, variant: "destructive" }),
  info: (message: string) => toast({ title: "Information", description: message }),
  warning: (message: string) => toast({ title: "Attention", description: message, variant: "destructive" })
}