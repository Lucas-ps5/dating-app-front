/**
 * Numeric utilities: type guards and lenient parsing.
 */

/** True when the value is a finite number. */
export const hasNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Parse an unknown value into a number.
 * Returns undefined for null, "" or NaN.
 */
export const toOptionalNumber = (value: unknown): number | undefined => {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};
