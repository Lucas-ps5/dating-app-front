/**
 * Shared query keys for the notifications feature.
 *
 * The keys are grouped under a single "notifications" root so that a mutation
 * can invalidate the whole feature at once, while still allowing targeted
 * updates on the list queries only (the unread count holds an object, not an
 * array).
 */

/** Default limit used by the API when no `limit` query parameter is given. */
export const NOTIFICATION_LIST_DEFAULT_LIMIT = 50;

/** Minimum accepted value for the `limit` query parameter. */
export const NOTIFICATION_LIST_MIN_LIMIT = 1;

/** Maximum accepted value for the `limit` query parameter. */
export const NOTIFICATION_LIST_MAX_LIMIT = 100;

/**
 * Clamp a user supplied limit to the range accepted by the API (1-100).
 * Invalid or missing values fall back to the API default.
 */
export const sanitizeNotificationLimit = (limit?: number): number => {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return NOTIFICATION_LIST_DEFAULT_LIMIT;
  }

  const floored = Math.floor(limit);

  return Math.min(
    Math.max(floored, NOTIFICATION_LIST_MIN_LIMIT),
    NOTIFICATION_LIST_MAX_LIMIT,
  );
};

export const notificationKeys = {
  /** Root of every notification query. */
  all: ["notifications"] as const,
  /** Prefix matching every notification list query, whatever the limit. */
  lists: () => [...notificationKeys.all, "list"] as const,
  /** A single notification list query. */
  list: (limit: number = NOTIFICATION_LIST_DEFAULT_LIMIT) =>
    [...notificationKeys.lists(), limit] as const,
  /** Unread notification count. */
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};
