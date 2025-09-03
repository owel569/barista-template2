
import { toast } from 'sonner';
import { useCallback } from 'react';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TypedToastReturn {
  success: (options: ToastOptions) => void;
  error: (options: ToastOptions) => void;
  warning: (options: ToastOptions) => void;
  info: (options: ToastOptions) => void;
  loading: (options: ToastOptions) => void;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => Promise<T>;
}

export function useTypedToast(): TypedToastReturn {
  const showSuccess = useCallback((options: ToastOptions) => {
    toast.success(options.title, {
      description: options.description,
      duration: options.duration,
      action: options.action
    });
  }, []);

  const showError = useCallback((options: ToastOptions) => {
    toast.error(options.title, {
      description: options.description,
      duration: options.duration,
      action: options.action
    });
  }, []);

  const showWarning = useCallback((options: ToastOptions) => {
    toast.warning(options.title, {
      description: options.description,
      duration: options.duration,
      action: options.action
    });
  }, []);

  const showInfo = useCallback((options: ToastOptions) => {
    toast.info(options.title, {
      description: options.description,
      duration: options.duration,
      action: options.action
    });
  }, []);

  const showLoading = useCallback((options: ToastOptions) => {
    toast.loading(options.title, {
      description: options.description,
      duration: options.duration
    });
  }, []);

  const promiseToast = useCallback(<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    return toast.promise(promise, options);
  }, []);

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    promise: promiseToast
  };
}

export default useTypedToast;
