import { useQuery } from "@tanstack/react-query";
import { Notifications } from "@/api/notifications";
import type { NotificationList } from "@/api/notifications";
import {
  notificationKeys,
  sanitizeNotificationLimit,
} from "@/composables/notificationKeys";

interface UseListNotificationsOptions {
  /** Disables the query (e.g. while the user is not authenticated). */
  enabled?: boolean;
  /** Polling interval in ms. Disabled by default. */
  refetchInterval?: number;
}

/**
 * List the current user's notifications, newest first.
 *
 * @param limit Maximum number of notifications to return (1-100, defaults to 50).
 */
export const useListNotifications = (
  limit?: number,
  options: UseListNotificationsOptions = {},
) => {
  const sanitizedLimit = sanitizeNotificationLimit(limit);

  return useQuery({
    queryKey: notificationKeys.list(sanitizedLimit),
    queryFn: async ({ signal }): Promise<NotificationList> => {
      const { data, error } = await Notifications.listNotifications({
        query: { limit: sanitizedLimit },
        signal,
      });

      if (error) throw error;

      return data;
    },
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
  });
};
