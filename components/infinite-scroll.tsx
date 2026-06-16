"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Spinner } from "@phosphor-icons/react";

interface InfiniteScrollProps<T> {
  items: T[];
  pageSize?: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  gridCols?: string;
  hibernationPages?: number;
  className?: string;
  loadingClass?: string;
  emptyState?: ReactNode;
}

export function InfiniteScroll<T>({
  items,
  pageSize = 10,
  renderItem,
  keyExtractor,
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  hibernationPages = 2,
  className,
  loadingClass,
  emptyState,
}: InfiniteScrollProps<T>) {
  const totalPages = Math.ceil(items.length / pageSize);
  const [loadedPages, setLoadedPages] = useState(1);
  const [inViewPage, setInViewPage] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageElements = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageHeights = useRef<Map<number, number>>(new Map());
  const initialMeasure = useRef(false);

  const hasMore = loadedPages < totalPages;

  // Load more when sentinel enters viewport
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadedPages((p) => Math.min(p + 1, totalPages));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, totalPages]);

  // Measure page heights after first render
  useEffect(() => {
    if (initialMeasure.current) return;
    for (let i = 0; i < loadedPages; i++) {
      const el = pageElements.current.get(i);
      if (el && !pageHeights.current.has(i)) {
        pageHeights.current.set(i, el.offsetHeight);
      }
    }
    initialMeasure.current = true;
  });

  // Re-measure when loaded pages change
  useEffect(() => {
    for (let i = 0; i < loadedPages; i++) {
      const el = pageElements.current.get(i);
      if (el && !pageHeights.current.has(i)) {
        requestAnimationFrame(() => {
          pageHeights.current.set(i, el.offsetHeight);
        });
      }
    }
  }, [loadedPages]);

  // Track which page is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).getAttribute("data-page-idx"));
            if (!isNaN(idx)) {
              setInViewPage(idx);
            }
          }
        }
      },
      { rootMargin: "-100px 0px -100px 0px" }
    );

    const observed: Element[] = [];
    for (let i = 0; i < loadedPages; i++) {
      const el = pageElements.current.get(i);
      if (el) {
        observer.observe(el);
        observed.push(el);
      }
    }

    return () => {
      for (const el of observed) observer.unobserve(el);
    };
  }, [loadedPages]);

  const minVisiblePage = Math.max(0, inViewPage - hibernationPages);
  const maxVisiblePage = Math.min(loadedPages - 1, inViewPage + hibernationPages);

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      {Array.from({ length: loadedPages }, (_, pageIdx) => {
        const pageItems = items.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);
        const isVisible = pageIdx >= minVisiblePage && pageIdx <= maxVisiblePage;
        const h = pageHeights.current.get(pageIdx);

        return (
          <div
            key={pageIdx}
            ref={(el) => {
              if (el) pageElements.current.set(pageIdx, el);
              else pageElements.current.delete(pageIdx);
            }}
            data-page-idx={pageIdx}
          >
            {isVisible ? (
              <div className={`grid ${gridCols} gap-5`}>
                {pageItems.map((item, i) => (
                  <div key={keyExtractor(item)}>
                    {renderItem(item, pageIdx * pageSize + i)}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{ height: h ?? 320 }}
                aria-hidden="true"
                className="opacity-0 pointer-events-none"
              />
            )}
          </div>
        );
      })}

      {hasMore && (
        <div
          ref={sentinelRef}
          className={`flex items-center justify-center gap-2 py-10 ${loadingClass ?? ""}`}
        >
          <Spinner size={14} className="text-green animate-spin" />
          <span className="text-xs text-white-dim">Loading more...</span>
        </div>
      )}
    </div>
  );
}
