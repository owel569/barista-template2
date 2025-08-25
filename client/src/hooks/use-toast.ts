
import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
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
        label: action.label,
        onClick: action.onClick
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
    promise: toastManager.promise.bind(toastManager)
  };
};

export { toastManager as toast };
