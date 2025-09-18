import { useState, useEffect, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  threshold?: number;
}

export function VirtualGrid<T>({ 
  items, 
  renderItem, 
  itemsPerPage = 20,
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  loadingComponent,
  threshold = 0.5
}: VirtualGridProps<T>) {
  const [displayedItems, setDisplayedItems] = useState(itemsPerPage);
  const { isIntersecting, elementRef } = useIntersectionObserver({ threshold });

  const visibleItems = useMemo(() => 
    items.slice(0, displayedItems), 
    [items, displayedItems]
  );

  const hasMore = displayedItems < items.length;

  useEffect(() => {
    if (isIntersecting && hasMore) {
      setDisplayedItems(prev => Math.min(prev + itemsPerPage, items.length));
    }
  }, [isIntersecting, hasMore, itemsPerPage, items.length]);

  return (
    <>
      <div className={className}>
        {visibleItems.map((item, index) => renderItem(item, index))}
      </div>
      
      {hasMore && (
        <div ref={elementRef as any} className="flex justify-center py-8">
          {loadingComponent || <div className="text-muted-foreground">Loading more...</div>}
        </div>
      )}
    </>
  );
}