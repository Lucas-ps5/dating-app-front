/**
 * Conversation utilities: normalization, date formatting, color generation, and participant helpers
 */

/** Normalize string for tolerant search: lowercase + remove accents. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Extract sortable timestamp from conversation (ms since epoch). */
export function getConversationDate(conversation: {
  lastMessageSentAt?: string;
  updatedAt?: string;
  createdAt?: string;
}): number {
  return (
    new Date(
      conversation.lastMessageSentAt ||
        conversation.updatedAt ||
        conversation.createdAt,
    ).getTime() || 0
  );
}

/**
 * Format timestamp for messaging UI:
 * - today → time (HH:mm)
 * - yesterday → "yesterday"
 * - < 7 days → weekday name
 * - same year → "DD MMM"
 * - otherwise → "DD MMM YYYY"
 */
export function formatTimestamp(
  iso: string | undefined,
  locale: string,
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (dayDiff <= 0) {
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (dayDiff === 1) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -1,
      "day",
    );
  }
  if (dayDiff < 7) {
    return date.toLocaleDateString(locale, { weekday: "long" });
  }
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

/** Generate stable hue (0-360) from string for avatar fallback color. */
export function hueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
}

/** Defensive: returns the other participant's ID regardless of position. */
export function getOtherUserId(
  conversation: { user1Id: string; user2Id: string },
  currentUserId: string | undefined,
): string | null {
  if (!currentUserId) return null;
  return conversation.user1Id === currentUserId
    ? conversation.user2Id
    : conversation.user1Id;
}
