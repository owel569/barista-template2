
import { useMemo } from 'react';

interface LoadingState {
  isLoading: boolean;
  hasData: boolean;
  isEmpty: boolean;
  error?: string | undefined;
}

interface UseOptimizedLoadingProps {
  loadingStates: boolean[];
  dataStates: unknown[];
  errorStates?: (string | undefined)[] | undefined;
}

export function useOptimizedLoading({
  loadingStates,
  dataStates,
  errorStates = []
}: UseOptimizedLoadingProps): LoadingState {
  return useMemo(() => {
    const isLoading = loadingStates.some(state => state === true);
    const hasData = dataStates.some(state => state !== null && state !== undefined);
    const isEmpty = dataStates.every(state => 
      state === null || 
      state === undefined || 
      (Array.isArray(state) && state.length === 0)
    );
    const error = errorStates.find(e => e !== undefined);

    return {
      isLoading,
      hasData,
      isEmpty,
      error
    };
  }, [loadingStates, dataStates, errorStates]);
}

// Hook spécialisé pour les composants avec menu
export function useMenuLoadingState(menuLoading: boolean, menu: unknown, ordersLoading?: boolean, orders?: unknown) {
  return useOptimizedLoading({
    loadingStates: [menuLoading, Boolean(ordersLoading)],
    dataStates: [menu, orders].filter((v) => v !== undefined && v !== null)
  });
}

// Hook pour les toasts avec types précis
// Deprecated duplicate: use hooks in useTypedToast.ts instead
