import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Notifications } from "@/api/notifications";
import type { Notification, NotificationList } from "@/api/notifications";
import { notificationKeys } from "@/composables/notificationKeys";

/**
 * Mark a single notification as read.
 *
 * The notification id is passed as the mutation variable, so a single hook can
 * mark any notification of a list:
 *
 * ```ts
 * const markRead = useMarkNotificationRead();
 * markRead.mutate(notification.id);
 * ```
 *
 * Only notifications owned by the authenticated user can be marked read, the
 * API answers with a 404 otherwise.
 *
 * On success the cached lists are patched in place with the updated
 * notification, and the unread count is invalidated.
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<Notification> => {
      const { data, error } = await Notifications.markNotificationRead({
        path: { id: notificationId },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: (updated) => {
      // Replace the notification in every cached list (all limits).
      queryClient.setQueriesData<NotificationList>(
        { queryKey: notificationKeys.lists() },
        (old) =>
          old?.map((notification) =>
            notification.id === updated.id ? updated : notification,
          ) ?? old,
      );

      // The unread badge is now out of date.
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
};
