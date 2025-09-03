import React, { 
  memo, 
  lazy, 
  Suspense, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  forwardRef
} from 'react';
import { cn } from '@/lib/utils';

// ===== COMPOSANT LAZY LOADING =====
export interface LazyComponentProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const LazyComponent = memo(function LazyComponent({
  fallback = <div className="animate-pulse bg-muted h-20 rounded" />,
  children,
  delay = 0,
  className,
}: LazyComponentProps) {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
    return;
  }, [delay]);

  if (!shouldRender) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <Suspense fallback={fallback}>
      <div className={className}>{children}</div>
    </Suspense>
  );
});

// ===== INTERSECTION OBSERVER POUR LAZY LOADING =====
export interface InViewProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  onInView?: () => void;
}

export const InView = memo(function InView({
  children,
  fallback = <div className="animate-pulse bg-muted h-20 rounded" />,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className,
  onInView,
}: InViewProps) {
  const [inView, setInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = !!entry?.isIntersecting;

        if (isIntersecting && (!triggerOnce || !hasTriggered)) {
          setInView(true);
          setHasTriggered(true);
          onInView?.();
        } else if (!triggerOnce) {
          setInView(isIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin, triggerOnce, hasTriggered, onInView]);

  return (
    <div ref={ref} className={className}>
      {inView ? children : fallback}
    </div>
  );
});

// ===== MÉMOISATION INTELLIGENTE =====
export function createMemoComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, propsAreEqual);
}

// ===== HOOK DE DEBOUNCE OPTIMISÉ =====
export function useOptimizedDebounce<T>(
  value: T,
  delay: number,
  maxWait?: number
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTime = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up debounce timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = undefined as unknown as NodeJS.Timeout | undefined;
      }
    }, delay);

    // Set up max wait timeout
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }, maxWait);
    }

    lastCallTime.current = now;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, maxWait]);

  return debouncedValue;
}

// ===== HOOK DE THROTTLE =====
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
}

// ===== VIRTUALIZATION SIMPLE =====
export interface VirtualScrollProps<T = unknown> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export const VirtualScroll = memo(function VirtualScroll<T = unknown>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );

    return items.slice(Math.max(0, start - overscan), end).map((item, index) => ({
      item,
      index: Math.max(0, start - overscan) + index,
    }));
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan) * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ===== COMPOSANT DE PRÉCHARGEMENT D'IMAGES =====
export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  loadingClassName?: string;
  errorClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

export const OptimizedImage = memo(forwardRef<HTMLImageElement, OptimizedImageProps>(
  function OptimizedImage({
    src,
    alt,
    fallback,
    loadingClassName = "animate-pulse bg-muted",
    errorClassName = "bg-muted flex items-center justify-center text-muted-foreground",
    onLoad,
    onError,
    lazy = true,
    className,
    ...props
  }, ref) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [inView, setInView] = useState(!lazy);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
      if (!lazy) return;

      const element = imgRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            setInView(true);
            observer.unobserve(element);
          }
        },
        { threshold: 0.1, rootMargin: '50px' }
      );

      observer.observe(element);
      return () => observer.unobserve(element);
    }, [lazy]);

    const handleLoad = useCallback(() => {
      setLoading(false);
      setError(false);
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      setLoading(false);
      setError(true);
      onError?.();
    }, [onError]);

    if (error) {
      return (
        <div ref={imgRef} className={cn(errorClassName, className)} {...props}>
          {fallback || 'Image non disponible'}
        </div>
      );
    }

    if (!inView) {
      return (
        <div ref={imgRef} className={cn(loadingClassName, className)} {...props} />
      );
    }

    return (
      <>
        {loading && (
          <div className={cn(loadingClassName, className)} {...props} />
        )}
        <img
          ref={ref || imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            className,
            loading && "opacity-0 absolute"
          )}
          {...props}
        />
      </>
    );
  }
));

// ===== HOOK DE CACHE INTELLIGENT =====
export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number; // Time to live en ms
    maxAge?: number; // Age maximum avant refetch
    retryOnError?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef(new Map());

  const fetchData = useCallback(async () => {
    const cache = cacheRef.current;
    const cached = cache.get(key);
    const now = Date.now();

    // Vérifier si les données en cache sont encore valides
    if (cached && (!options?.ttl || (now - cached.timestamp) < options.ttl)) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.set(key, { data: result, timestamp: now });
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);

      // Utiliser les données en cache en cas d'erreur si disponibles
      if (options?.retryOnError && cached) {
        setData(cached.data);
        return cached.data;
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(key);
  }, [key]);

  const refresh = useCallback(() => {
    invalidateCache();
    return fetchData();
  }, [invalidateCache, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache,
  };
}

// ===== UTILITAIRES D'OPTIMISATION =====
export const performanceUtils = {
  // Créer un composant mémorisé avec comparaison shallow
  createShallowMemo: <P extends object>(component: React.ComponentType<P>) =>
    memo(component, (prevProps, nextProps) => {
      const keys = Object.keys(prevProps) as (keyof P)[];
      return keys.every(key => prevProps[key] === nextProps[key]);
    }),

  // Créer un composant mémorisé avec comparaison deep
  createDeepMemo: <P extends object>(component: React.ComponentType<P>) =>
    memo(component, (prevProps, nextProps) => {
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    }),

  // Précharger un composant
  preloadComponent: (importFn: () => Promise<any>) => {
    const componentPromise = importFn();
    return () => componentPromise;
  },

  // Mesurer les performances d'un composant
  measurePerformance: (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
  },
};

export default {
  LazyComponent,
  InView,
  VirtualScroll,
  OptimizedImage,
  useOptimizedDebounce,
  useThrottle,
  useSmartCache,
  createMemoComponent,
  performanceUtils,
};