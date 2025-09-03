
import { useMemo } from 'react';

interface LoadingState {
  isLoading: boolean;
  hasData: boolean;
  isEmpty: boolean;
  error?: string;
}

interface UseOptimizedLoadingProps {
  loadingStates: boolean[];
  dataStates: unknown[];
  errorStates?: (string | undefined)[];
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
    const error = errorStates.find(error => error !== undefined);

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
    loadingStates: [menuLoading, ordersLoading || false],
    dataStates: [menu, orders].filter(Boolean)
  });
}

// Hook pour les toasts avec types précis
export function useTypedToast() {
  const { toast } = useToast();
  
  return {
    success: (message: string, description?: string) => 
      toast({
        title: message,
        description,
        variant: 'default' as const,
        className: 'bg-green-50 border-green-200 text-green-800'
      }),
    error: (message: string, description?: string) => 
      toast({
        title: message,
        description,
        variant: 'destructive' as const
      }),
    info: (message: string, description?: string) => 
      toast({
        title: message,
        description,
        variant: 'default' as const
      })
  };
}
