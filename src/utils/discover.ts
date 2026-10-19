/**
 * Discover utilities: Age calculation, validation, formatting, and pagination helpers
 */

/**
 * Calculates a person's age from their birthdate string (YYYY-MM-DD or ISO).
 * Returns null if birthdate is null, undefined, invalid, or future-dated.
 */
export function calculateAge(
  birthdate: string | null | undefined,
): number | null {
  if (!birthdate || typeof birthdate !== "string") {
    return null;
  }

  // Handle format YYYY-MM-DD or ISO string
  const cleanDateStr = birthdate.trim();
  if (!cleanDateStr) return null;

  const parts = cleanDateStr.split("T")[0].split("-");
  if (parts.length < 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed in JS Date
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const birth = new Date(year, month, day);
  // Verify date didn't overflow (e.g. Feb 31)
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month ||
    birth.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 && age <= 130 ? age : null;
}

/**
 * Validates the age range filter values.
 */
export function validateAgeRange(
  ageMin?: number,
  ageMax?: number,
  t?: (key: string, options?: any) => string,
): { isValid: boolean; error?: string } {
  if (ageMin !== undefined) {
    if (!Number.isFinite(ageMin) || ageMin < 18) {
      return {
        isValid: false,
        error: t
          ? t("validation.minAge18")
          : "Minimum age must be at least 18.",
      };
    }
    if (ageMin > 100) {
      return {
        isValid: false,
        error: t ? t("validation.minAge100") : "Minimum age cannot exceed 100.",
      };
    }
  }

  if (ageMax !== undefined) {
    if (!Number.isFinite(ageMax) || ageMax > 100) {
      return {
        isValid: false,
        error: t ? t("validation.maxAge100") : "Maximum age cannot exceed 100.",
      };
    }
    if (ageMax < 18) {
      return {
        isValid: false,
        error: t
          ? t("validation.maxAge18")
          : "Maximum age must be at least 18.",
      };
    }
  }

  if (ageMin !== undefined && ageMax !== undefined && ageMin > ageMax) {
    return {
      isValid: false,
      error: t
        ? t("validation.minGreater", { min: ageMin, max: ageMax })
        : `Minimum age (${ageMin}) cannot be greater than maximum age (${ageMax}).`,
    };
  }

  return { isValid: true };
}

/**
 * Formats city and country into a readable location string.
 */
export function formatLocation(
  city: string | null | undefined,
  country: string | null | undefined,
): string | null {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(", ");
}

/**
 * Formats distance in kilometers.
 * Only returns a string when distance is a valid finite number.
 */
export function formatDistance(
  distance: number | null | undefined,
  t?: (key: string, options?: any) => string,
): string | null {
  if (
    distance === null ||
    distance === undefined ||
    !Number.isFinite(distance) ||
    distance < 0
  ) {
    return null;
  }

  if (distance < 1) {
    return t ? t("distance.lessThan1km") : "< 1 km away";
  }

  const rounded =
    distance < 10 ? distance.toFixed(1) : Math.round(distance).toString();
  return t ? t("distance.kmAway", { distance: rounded }) : `${rounded} km away`;
}

/**
 * Generates an array of page numbers and ellipsis tokens for pagination.
 */
export function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (totalPages <= 1) return [1];

  // Total pages to show: siblings + first + last + current + 2*ellipsis
  const totalNumbers = siblingCount * 2 + 3;
  const totalBlocks = totalNumbers + 2;

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-end", totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    );
    return [1, "ellipsis-start", ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [1, "ellipsis-start", ...middleRange, "ellipsis-end", totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}
