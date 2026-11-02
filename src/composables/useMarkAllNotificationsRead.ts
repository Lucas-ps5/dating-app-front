import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Notifications } from "@/api/notifications";
import type {
  MarkAllReadResponse,
  NotificationList,
} from "@/api/notifications";
import { notificationKeys } from "@/composables/notificationKeys";

/**
 * Mark all the notifications of the current user as read.
 *
 * On success every cached notification is flagged as read for instant
 * feedback, then the lists and the unread count are invalidated so the cache
 * is reconciled with the server timestamps.
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<MarkAllReadResponse> => {
      const { data, error } = await Notifications.markAllNotificationsRead();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      const readAt = new Date().toISOString();

      // Flag every cached notification as read for instant feedback.
      queryClient.setQueriesData<NotificationList>(
        { queryKey: notificationKeys.lists() },
        (old) =>
          old?.map((notification) =>
            notification.readAt ? notification : { ...notification, readAt },
          ) ?? old,
      );

      // Reconcile with the server state (authoritative readAt timestamps).
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
};
