/**
 * Chat utilities: conversation helpers, message grouping and presence display.
 */

import type { Conversation, Message } from "@/api/chat";
import {
  DAY_MS,
  daysSince,
  formatDayLabel,
  formatLastSeen,
  formatTime,
  isSameDay,
  toTime,
} from "@/utils/date";

/** Messages du même expéditeur à moins de 5 min => même groupe visuel */
export const GROUP_WINDOW_MS = 5 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* Conversation helpers                                                        */
/* -------------------------------------------------------------------------- */

/** Extract sortable timestamp from conversation (ms since epoch). */
export function getConversationDate(conversation: {
  lastMessageSentAt?: string;
  updatedAt?: string;
  createdAt?: string;
}): number {
  const raw =
    conversation.lastMessageSentAt ||
    conversation.updatedAt ||
    conversation.createdAt;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Defensive: returns the other participant's ID regardless of position. */
export function getOtherUserId(
  conversation: { user1Id?: string; user2Id?: string },
  currentUserId: string | undefined,
): string | null {
  if (!currentUserId) return null;
  return conversation.user1Id === currentUserId
    ? (conversation.user2Id ?? null)
    : (conversation.user1Id ?? null);
}

/** Number of unread messages for the given participant of a conversation. */
export const getUnreadCount = (
  conversation: Conversation,
  currentUserId: string | undefined,
): number =>
  conversation.user1Id === currentUserId
    ? (conversation.unreadCountUser1 ?? 0)
    : (conversation.unreadCountUser2 ?? 0);

/**
 * Detects whether a message preview content represents an image URL
 * (e.g. from the media service or an image file URL).
 */
export function isImagePreview(preview?: string | null): boolean {
  if (!preview) return false;
  const trimmed = preview.trim();
  return (
    /\/media\/images(?:\/|$)/i.test(trimmed) ||
    /^(https?:\/\/|\/)[^\s]+\.(?:jpe?g|png|webp|gif)(\?.*)?$/i.test(trimmed) ||
    /\/hmeet-media\//i.test(trimmed)
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
  const dayDiff = daysSince(date);

  if (dayDiff <= 0) return formatTime(iso, locale);
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

/* -------------------------------------------------------------------------- */
/* Message grouping                                                            */
/* -------------------------------------------------------------------------- */

export type ChatListItem =
  | { kind: "day"; key: string; label: string }
  | {
      kind: "message";
      key: string;
      message: Message;
      isOwn: boolean;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    };

/** True when both messages belong to the same visual group. */
export const isSameGroup = (a: Message, b: Message): boolean =>
  a.senderId === b.senderId &&
  isSameDay(a.sentAt, b.sentAt) &&
  Math.abs(toTime(b.sentAt) - toTime(a.sentAt)) < GROUP_WINDOW_MS;

/**
 * Flatten a list of messages into displayable items:
 * day separators interleaved with messages flagged as first/last of their group.
 */
export function buildChatItems(
  messages: Message[],
  currentUserId: string | undefined,
  locale: string,
  labels: { today: string; yesterday: string },
): ChatListItem[] {
  const items: ChatListItem[] = [];

  messages.forEach((message, index) => {
    const prev = messages[index - 1];
    const next = messages[index + 1];

    if (message.sentAt && (!prev || !isSameDay(prev.sentAt, message.sentAt))) {
      items.push({
        kind: "day",
        key: `day-${message.sentAt}`,
        label: formatDayLabel(message.sentAt, locale, labels),
      });
    }

    items.push({
      kind: "message",
      key: message.id ?? `msg-${index}`,
      message,
      isOwn: message.senderId === currentUserId,
      isFirstInGroup: !prev || !isSameGroup(prev, message),
      isLastInGroup: !next || !isSameGroup(message, next),
    });
  });

  return items;
}

/* -------------------------------------------------------------------------- */
/* Presence                                                                    */
/* -------------------------------------------------------------------------- */

export interface PresenceState {
  isOnline: boolean;
  /** Label describing the presence, ready to be displayed. */
  label: string;
}

export interface PresenceLabels {
  online: string;
  offline: string;
  justNow: string;
  lastSeen: (time: string) => string;
  lastSeenOn: (date: string) => string;
}

/**
 * Build the presence state of a user.
 * Online → "En ligne", otherwise the last known activity.
 */
export function buildPresence(
  user: { isOnline?: boolean; lastOnlineAt?: string | null } | undefined,
  locale: string,
  labels: PresenceLabels,
): PresenceState {
  if (!user) return { isOnline: false, label: labels.offline };

  if (user.isOnline === true) {
    return { isOnline: true, label: labels.online };
  }

  const lastOnlineAt = user.lastOnlineAt;
  if (!lastOnlineAt) {
    return { isOnline: false, label: labels.offline };
  }

  const seen = formatLastSeen(lastOnlineAt, locale);
  if (!seen) {
    return { isOnline: false, label: labels.justNow };
  }

  // Au-delà d'une semaine, on affiche la date plutôt qu'un relatif.
  const isOlderThanAWeek =
    Date.now() - new Date(lastOnlineAt).getTime() >= 7 * DAY_MS;

  return {
    isOnline: false,
    label: isOlderThanAWeek ? labels.lastSeenOn(seen) : labels.lastSeen(seen),
  };
}
