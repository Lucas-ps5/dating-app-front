import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generatePaginationRange } from "@/utils/discover";

interface DiscoverPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

const PAGE_SIZE_OPTIONS = [12, 20, 36, 48, 100];

export const DiscoverPagination: React.FC<DiscoverPaginationProps> = ({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}) => {
  const { t } = useTranslation("discover");

  // If zero results, show minimal state
  if (total === 0) {
    return null;
  }

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, page), safeTotalPages);

  const startItem = (safeCurrentPage - 1) * limit + 1;
  const endItem = Math.min(safeCurrentPage * limit, total);

  const paginationRange = generatePaginationRange(safeCurrentPage, safeTotalPages);

  return (
    <nav
      aria-label={t("pagination.ariaNav")}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-border/60 text-xs text-muted-foreground"
    >
      {/* Left: Summary text */}
      <div className="flex items-center gap-2">
        <span>
          {t("pagination.showing", {
            start: startItem,
            end: endItem,
            total,
            defaultValue: `Showing ${startItem}–${endItem} of ${total} people`,
          })}
        </span>
      </div>

      {/* Center: Numbered Pages & Prev/Next */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label={t("pagination.ariaPrev")}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/80 hover:bg-secondary text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("pagination.prev")}</span>
        </button>

        {/* Page Buttons */}
        {safeTotalPages > 1 &&
          paginationRange.map((item, index) => {
            if (item === "ellipsis-start" || item === "ellipsis-end") {
              return (
                <span key={`ellipsis-${index}`} className="px-1.5 text-zinc-600 select-none">
                  …
                </span>
              );
            }

            const pageNumber = item as number;
            const isCurrent = pageNumber === safeCurrentPage;

            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                aria-current={isCurrent ? "page" : undefined}
                aria-label={t("pagination.ariaPage", { page: pageNumber })}
                className={`min-w-8 h-8 px-2 rounded-lg font-medium transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-secondary"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label={t("pagination.ariaNext")}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/80 hover:bg-secondary text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">{t("pagination.next")}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Page Size Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="discover-page-size" className="text-zinc-400">
          {t("pagination.perPage")}
        </label>
        <select
          id="discover-page-size"
          aria-label={t("pagination.selectLimit")}
          value={limit}
          onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
          className="h-8 px-2.5 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
};
