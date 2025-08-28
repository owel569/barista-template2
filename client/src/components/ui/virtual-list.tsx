import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface VirtualListItem {
  id: string | number;
  data?: any;
}

export interface VirtualListProps<T extends VirtualListItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  estimateItemHeight?: (index: number) => number;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T extends VirtualListItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
  estimateItemHeight,
  getItemKey,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calcul de la plage visible
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, totalHeight: 0, offsetY: 0 };
    }

    let calculatedItemHeight = itemHeight;

    if (estimateItemHeight) {
      // Pour les hauteurs variables, on utilise une moyenne estimée
      calculatedItemHeight = items.reduce((acc, _, index) => {
        return acc + estimateItemHeight(index);
      }, 0) / items.length;
    }

    const start = Math.floor(scrollTop / calculatedItemHeight);
    const visibleCount = Math.ceil(containerHeight / calculatedItemHeight);
    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(items.length - 1, start + visibleCount + overscan);

    const totalHeight = items.length * calculatedItemHeight;
    const offsetY = overscanStart * calculatedItemHeight;

    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      totalHeight,
      offsetY,
    };
  }, [items.length, itemHeight, containerHeight, scrollTop, overscan, estimateItemHeight]);

  // Éléments visibles
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      originalIndex: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  // Gestion du scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Fonction pour faire défiler vers un élément
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!scrollElementRef.current) return;

    const targetScrollTop = (() => {
      switch (align) {
        case 'start':
          return index * itemHeight;
        case 'center':
          return index * itemHeight - containerHeight / 2 + itemHeight / 2;
        case 'end':
          return index * itemHeight - containerHeight + itemHeight;
        default:
          return index * itemHeight;
      }
    })();

    scrollElementRef.current.scrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight));
  }, [itemHeight, containerHeight, totalHeight]);

  // Hook pour exposer les méthodes publiques
  useEffect(() => {
    const element = scrollElementRef.current;
    if (element) {
      (element as any).scrollToItem = scrollToItem;
    }
  }, [scrollToItem]);

  if (loading && loadingComponent) {
    return (
      <div 
        className={cn("relative overflow-hidden", className)}
        style={{ height: containerHeight }}
      >
        {loadingComponent}
      </div>
    );
  }

  if (items.length === 0 && emptyComponent) {
    return (
      <div 
        className={cn("relative overflow-hidden flex items-center justify-center", className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn("relative overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const key = getItemKey ? getItemKey(item, item.originalIndex) : item.id;
            return (
              <div
                key={key}
                style={{
                  height: estimateItemHeight ? estimateItemHeight(item.originalIndex) : itemHeight,
                }}
              >
                {renderItem(item, item.originalIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook pour utiliser la liste virtuelle
export function useVirtualList<T extends VirtualListItem>(
  items: T[],
  {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5,
  }: {
    itemHeight?: number;
    containerHeight?: number;
    overscan?: number;
  } = {}
) {
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const element = listRef.current as any;
    if (element?.scrollToItem) {
      element.scrollToItem(index, align);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);

  return {
    listRef,
    scrollTop,
    scrollToItem,
    scrollToTop,
    scrollToBottom,
    setScrollTop,
  };
}

// Composant d'élément de liste optimisé
export const VirtualListItem = React.memo(function VirtualListItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

VirtualListItem.displayName = "VirtualListItem";

export { VirtualList as default };