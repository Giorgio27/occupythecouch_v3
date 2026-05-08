import { useState, useCallback } from "react";

type ExpandableListProps<T> = {
  /** The array of items to render */
  items: T[];
  /**
   * Render function called for each item.
   * The wrapper owns open/close state and passes `isExpanded` + `onToggle` to the caller.
   */
  renderItem: (
    item: T,
    index: number,
    isExpanded: boolean,
    onToggle: () => void,
  ) => React.ReactNode;
  /**
   * When true, multiple items can be expanded simultaneously.
   * When false (default), opening one item closes the previously open one (accordion).
   */
  multiOpen?: boolean;
  className?: string;
};

/**
 * Generic render-prop list that manages expand/collapse state.
 * Supports both accordion (single-open) and multi-open modes.
 *
 * @example
 * ```tsx
 * <ExpandableList
 *   items={directors}
 *   renderItem={(director, index, isExpanded, onToggle) => (
 *     <ExpandableListItem
 *       key={director.id}
 *       position={index + 1}
 *       title={director.name}
 *       metric={director.average_rating.toFixed(2)}
 *       metricClassName="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
 *       isExpanded={isExpanded}
 *       onToggle={onToggle}
 *       animationDelay={index * 30}
 *     >
 *       <DirectorMoviesTable movies={director.movies} />
 *     </ExpandableListItem>
 *   )}
 * />
 * ```
 */
export default function ExpandableList<T>({
  items,
  renderItem,
  multiOpen = false,
  className = "",
}: ExpandableListProps<T>) {
  // Accordion mode: single index or null
  const [singleOpen, setSingleOpen] = useState<number | null>(null);
  // Multi-open mode: set of open indices
  const [multiOpenSet, setMultiOpenSet] = useState<Set<number>>(new Set());

  const handleToggle = useCallback(
    (index: number) => {
      if (multiOpen) {
        setMultiOpenSet((prev) => {
          const next = new Set(prev);
          if (next.has(index)) {
            next.delete(index);
          } else {
            next.add(index);
          }
          return next;
        });
      } else {
        setSingleOpen((prev) => (prev === index ? null : index));
      }
    },
    [multiOpen],
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => {
        const isExpanded = multiOpen
          ? multiOpenSet.has(index)
          : singleOpen === index;
        return renderItem(item, index, isExpanded, () => handleToggle(index));
      })}
    </div>
  );
}
