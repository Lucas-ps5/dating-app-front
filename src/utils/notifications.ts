/**
 * Notification utilities: payload narrowing and read-state helpers.
 */

import { NotificationType } from "@/api/notifications";
import type {
  NewMatchData,
  Notification,
  ProfileVisitedData,
} from "@/api/notifications";

/** A notification whose payload is a profile visit. */
export type ProfileVisitedNotification = Notification & {
  type: typeof NotificationType.PROFILE_VISITED;
  data: ProfileVisitedData;
};

/** A notification whose payload is a new match. */
export type NewMatchNotification = Notification & {
  type: typeof NotificationType.NEW_MATCH;
  data: NewMatchData;
};

/**
 * Narrow a notification to its profile visit payload.
 *
 * The contract types `data` as a `oneOf` without an explicit discriminator,
 * but the notification type is what actually determines the payload shape.
 */
export function isProfileVisitedNotification(
  notification: Notification,
): notification is ProfileVisitedNotification {
  return notification.type === NotificationType.PROFILE_VISITED;
}

/** Narrow a notification to its new match payload. */
export function isNewMatchNotification(
  notification: Notification,
): notification is NewMatchNotification {
  return notification.type === NotificationType.NEW_MATCH;
}

/** True when the notification has already been marked as read. */
export const isNotificationRead = (notification: Notification): boolean =>
  notification.readAt !== null && notification.readAt !== undefined;

/** Number of unread notifications in a list. */
export const countUnreadNotifications = (
  notifications: Notification[] | undefined,
): number =>
  notifications?.filter((notification) => !isNotificationRead(notification))
    .length ?? 0;
