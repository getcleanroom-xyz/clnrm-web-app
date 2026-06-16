"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

interface PageData<T> {
  page: number;
  items: T[];
}

interface InfiniteScrollProps<T> {
  fetchPage: (page: number) => Promise<{ items: T[]; total_pages: number; total: number }>;
  pageSize?: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  gridCols?: string;
  hibernationPages?: number;
  className?: string;
  emptyState?: ReactNode;
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-green/7 p-6 clip-card animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 bg-green/8 rounded" />
          <div className="h-7 w-20 bg-green/8 rounded mt-2" />
          <div className="h-3 w-16 bg-green/5 rounded mt-1" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full bg-green/5 rounded" />
        <div className="h-3 w-3/4 bg-green/5 rounded" />
        <div className="h-3 w-1/2 bg-green/5 rounded" />
      </div>
      <div className="flex gap-1.5 mb-4">
        <div className="h-4 w-16 bg-green/6 rounded" />
        <div className="h-4 w-12 bg-green/6 rounded" />
        <div className="h-4 w-14 bg-green/6 rounded" />
      </div>
      <div className="h-9 w-full bg-green/6 rounded" />
    </div>
  );
}

export function InfiniteScroll<T>({
  fetchPage,
  pageSize = 12,
  renderItem,
  keyExtractor,
  gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  hibernationPages = 2,
  className,
  emptyState,
}: InfiniteScrollProps<T>) {
  const [pages, setPages] = useState<Map<number, PageData<T>>>(new Map());
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [inViewPage, setInViewPage] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageElements = useRef<Map<number, HTMLDivElement>>(new Map());
  const pageHeights = useRef<Map<number, number>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadedPages = pages.size;

  // ── Load initial page ──
  useEffect(() => {
    if (loadedPages > 0) return;
    setLoading(true);
    fetchPage(1)
      .then((res) => {
        setPages(new Map([[1, { page: 1, items: res.items }]]));
        setTotalPages(res.total_pages);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  }, [fetchPage, loadedPages]);

  // ── Load more via sentinel ──
  useEffect(() => {
    if (totalPages !== null && loadedPages >= totalPages) return;
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          const nextPage = loadedPages + 1;
          if (totalPages !== null && nextPage > totalPages) return;

          setLoading(true);
          fetchPage(nextPage)
            .then((res) => {
              setPages((prev) => {
                const next = new Map(prev);
                next.set(nextPage, { page: nextPage, items: res.items });
                return next;
              });
              setTotalPages(res.total_pages);
              setTotal(res.total);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadedPages, totalPages, loading, fetchPage]);

  // ── Track which page is in viewport ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number(
              (e.target as HTMLElement).getAttribute("data-page-idx"),
            );
            if (!isNaN(idx)) setInViewPage(idx);
          }
        }
      },
      { rootMargin: "-80px 0px -80px 0px" },
    );

    const observed: Element[] = [];
    for (let i = 1; i <= loadedPages; i++) {
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

  // ── Measure page heights ──
  useEffect(() => {
    for (let i = 1; i <= loadedPages; i++) {
      const el = pageElements.current.get(i);
      if (el && !pageHeights.current.has(i)) {
        pageHeights.current.set(i, el.offsetHeight);
      }
    }
  }, [loadedPages]);

  // ── Re-measure on resize ──
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        pageHeights.current.clear();
        for (let i = 1; i <= loadedPages; i++) {
          const el = pageElements.current.get(i);
          if (el) pageHeights.current.set(i, el.offsetHeight);
        }
      }, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, [loadedPages]);

  const minVisible = Math.max(1, inViewPage - hibernationPages);
  const maxVisible = Math.min(loadedPages, inViewPage + hibernationPages);

  // ── Initial loading state ──
  if (initialLoad) {
    return (
      <div className={className}>
        <div className={`grid ${gridCols} gap-5`}>
          {Array.from({ length: pageSize }, (_, i) => (
            <div key={i}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (total !== null && total === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={scrollContainerRef} className={className}>
      {Array.from({ length: loadedPages }, (_, raw) => {
        const pageIdx = raw + 1;
        const pageData = pages.get(pageIdx);
        if (!pageData) return null;

        const isVisible = pageIdx >= minVisible && pageIdx <= maxVisible;
        const h = pageHeights.current.get(pageIdx);

        return (
          <div
            key={pageIdx}
            ref={(el) => {
              if (el) pageElements.current.set(pageIdx, el);
              else pageElements.current.delete(pageIdx);
            }}
            data-page-idx={pageIdx}
            className="relative"
          >
            {isVisible ? (
              <div className={`grid ${gridCols} gap-5`}>
                {pageData.items.map((item, i) => (
                  <div
                    key={keyExtractor(item)}
                    className="animate-fade-in"
                    style={{
                      animationDelay: `${(i % pageSize) * 30}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    {renderItem(item, (pageIdx - 1) * pageSize + i)}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{ height: h ?? 340 }}
                aria-hidden="true"
                className="opacity-0 pointer-events-none"
              />
            )}
          </div>
        );
      })}

      {/* Loading more indicator */}
      {loading && (
        <div className="mt-5">
          <div className={`grid ${gridCols} gap-5`}>
            {Array.from({ length: Math.min(pageSize, 3) }, (_, i) => (
              <div key={`skel-${i}`}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {(totalPages === null || loadedPages < totalPages) && !loading && (
        <div ref={sentinelRef} className="h-px" />
      )}

      {/* End marker */}
      {totalPages !== null && loadedPages >= totalPages && total !== null && total > 0 && (
        <div className="flex items-center justify-center py-10 gap-2">
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-white-dim/10 to-transparent" />
          <span className="text-[9px] tracking-[0.2em] uppercase text-white-dim/20">
            {total} items
          </span>
          <div className="h-px flex-1 max-w-[120px] bg-gradient-to-r from-transparent via-white-dim/10 to-transparent" />
        </div>
      )}
    </div>
  );
}

export { SkeletonCard };
