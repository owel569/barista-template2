
import { useState, useEffect, useCallback, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const cancelRef = useRef<boolean>(false);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    cancelRef.current = false;

    try {
      const data = await asyncFunction();
      
      if (!cancelRef.current) {
        setState({ data, loading: false, error: null });
        if (onSuccess) onSuccess(data);
      }
    } catch (error) {
      if (!cancelRef.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err });
        if (onError) onError(err);
      }
    }
  }, deps);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      cancelRef.current = true;
    };
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
    cancel
  };
}

export function useAsyncCallback<T extends any[], R>(
  callback: (...args: T) => Promise<R>,
  deps: React.DependencyList = []
) {
  const [state, setState] = useState<AsyncState<R>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(
    async (...args: T) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const data = await callback(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    deps
  );

  return { ...state, execute };
}
