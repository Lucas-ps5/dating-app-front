import { useQuery } from "@tanstack/react-query";
import { Notifications } from "@/api/notifications";
import type { UnreadCountResponse } from "@/api/notifications";
import { notificationKeys } from "@/composables/notificationKeys";

interface UseGetUnreadNotificationCountOptions {
  /** Disables the query (e.g. while the user is not authenticated). */
  enabled?: boolean;
  /** Polling interval in ms. Disabled by default. */
  refetchInterval?: number;
}

/**
 * Count the unread notifications of the current user.
 *
 * The response holds the raw `{ count }` payload, so consumers read
 * `data?.count` to display a badge.
 */
export const useGetUnreadNotificationCount = (
  options: UseGetUnreadNotificationCountOptions = {},
) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async ({ signal }): Promise<UnreadCountResponse> => {
      const { data, error } = await Notifications.getUnreadNotificationCount({
        signal,
      });

      if (error) throw error;

      return data;
    },
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval,
  });
};
