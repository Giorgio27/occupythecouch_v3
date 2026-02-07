import { useEffect, useRef, useCallback } from "react";

interface InfiniteScrollProps<T> {
  items: T[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  threshold?: number;
  className?: string;
}

export function InfiniteScroll<T>({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  renderItem,
  loader,
  endMessage,
  threshold = 200,
  className = "",
}: InfiniteScrollProps<T>) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [handleObserver, threshold]);

  return (
    <div className={className}>
      {items.map((item, index) => renderItem(item, index))}

      {/* Observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* Loading state */}
      {isLoading && (
        <div className="py-4">
          {loader || (
            <div className="text-center text-sm text-muted-foreground">
              Loading...
            </div>
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && !isLoading && items.length > 0 && (
        <div className="py-4">
          {endMessage || (
            <div className="text-center text-sm text-muted-foreground">
              No more items to load
            </div>
          )}
        </div>
      )}
    </div>
  );
}
