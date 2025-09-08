
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
    const payload: Record<string, unknown> = {};
    if (options.description !== undefined) payload.description = options.description;
    if (options.duration !== undefined) payload.duration = options.duration;
    if (options.action !== undefined) payload.action = options.action;
    toast.success(options.title, payload);
  }, []);

  const showError = useCallback((options: ToastOptions) => {
    const payload: Record<string, unknown> = {};
    if (options.description !== undefined) payload.description = options.description;
    if (options.duration !== undefined) payload.duration = options.duration;
    if (options.action !== undefined) payload.action = options.action;
    toast.error(options.title, payload);
  }, []);

  const showWarning = useCallback((options: ToastOptions) => {
    const payload: Record<string, unknown> = {};
    if (options.description !== undefined) payload.description = options.description;
    if (options.duration !== undefined) payload.duration = options.duration;
    if (options.action !== undefined) payload.action = options.action;
    toast.warning(options.title, payload);
  }, []);

  const showInfo = useCallback((options: ToastOptions) => {
    const payload: Record<string, unknown> = {};
    if (options.description !== undefined) payload.description = options.description;
    if (options.duration !== undefined) payload.duration = options.duration;
    if (options.action !== undefined) payload.action = options.action;
    toast.info(options.title, payload);
  }, []);

  const showLoading = useCallback((options: ToastOptions) => {
    const payload: Record<string, unknown> = {};
    if (options.description !== undefined) payload.description = options.description;
    if (options.duration !== undefined) payload.duration = options.duration;
    toast.loading(options.title, payload);
  }, []);

  const promiseToast = useCallback(<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    toast.promise(promise, options);
    return promise;
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
