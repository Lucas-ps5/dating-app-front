/**
 * Text utilities: normalization, casing and simple list parsing.
 */

/** Normalize string for tolerant search: lowercase + remove accents. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Uppercase the first character, leave the rest untouched. */
export const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Parse a free-form list into an array of non-empty strings.
 * Accepts an array, or a string separated by spaces / commas / newlines.
 */
export const parseList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value !== "string") return [];
  return value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/** Split a multiline text into trimmed, non-empty lines. */
export const parseLines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/** First name of a full name (empty string when there is none). */
export const getFirstName = (fullName?: string | null): string =>
  fullName ? fullName.split(" ")[0] : "";
