/**
 * Pagination utilities: URL query parsing and shared limits.
 */

/** Default page size for paginated lists. */
export const DEFAULT_PAGE_LIMIT = 12;

/** Maximum page size allowed for paginated lists. */
export const MAX_PAGE_LIMIT = 100;

/**
 * Parse a positive integer from a query-string value.
 * Falls back to `fallback` when the value is missing or invalid,
 * and is capped to `max` when provided.
 */
export const parsePositiveInt = (
  value: string | null,
  fallback: number,
  max?: number,
): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};
