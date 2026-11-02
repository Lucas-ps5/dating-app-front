import React, { useMemo } from "react";
import { Link } from "react-router";
import {
  Bell,
  Compass,
  CheckCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useListNotifications } from "@/composables/useListNotifications";
import { useGetUnreadNotificationCount } from "@/composables/useGetUnreadNotificationCount";
import { useMarkNotificationRead } from "@/composables/useMarkNotificationRead";
import { useMarkAllNotificationsRead } from "@/composables/useMarkAllNotificationsRead";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { DiscoverSkeleton } from "@/components/discover/DiscoverSkeleton";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { UserSummary } from "@/types/user";

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation("notifications");

  const {
    data: notifications,
    isLoading: isLoadingNotifications,
    isError: isErrorNotifications,
    error: notificationsError,
    refetch: refetchNotifications,
  } = useListNotifications();

  const { data: unreadCountData } = useGetUnreadNotificationCount();
  const unreadCount = unreadCountData?.count ?? 0;

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Les acteurs (utilisateurs à l'origine de la notification) sont résolus en lot.
  const actorIds = useMemo(
    () => Array.from(new Set((notifications ?? []).map((n) => n.actorId))),
    [notifications],
  );

  const { data: actorsData } = useFetchUsersByIds(actorIds);

  const actorsById = useMemo(() => {
    const byId = new Map((actorsData ?? []).map((u: UserSummary) => [u.id, u]));
    return byId;
  }, [actorsData]);

  const isLoading = isLoadingNotifications;
  const isError = isErrorNotifications;
  const error = notificationsError;

  const handleRetry = () => {
    refetchNotifications();
  };

  const resolveErrorMessage = (cause: unknown): string => {
    if (cause instanceof Error) return cause.message;
    if (typeof cause === "string") return cause;
    return t("error.defaultMsg");
  };

  const errorMessage = resolveErrorMessage(error);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-border/40">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="shrink-0 grid place-items-center size-12 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25"
          >
            <Bell className="size-6 fill-current" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
              {t("header.title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              {t("header.subtitle")}
            </p>
          </div>
        </div>

        {!isLoading && !isError && (
          <div className="self-start md:self-auto flex flex-wrap items-center gap-2">
            <div
              role="status"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/80 text-sm font-medium text-foreground shadow-sm tabular-nums"
            >
              <span
                className={`size-2 rounded-full ${
                  unreadCount > 0 ? "bg-primary" : "bg-muted-foreground/40"
                }`}
                aria-hidden="true"
              />
              {unreadCount > 0
                ? t("header.unreadCount", { count: unreadCount })
                : t("header.allRead")}
            </div>

            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unreadCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              {markAllRead.isPending
                ? t("header.markingAllRead")
                : t("header.markAllRead")}
            </button>
          </div>
        )}
      </header>

      <section
        aria-label={t("header.badge")}
        aria-busy={isLoading}
        className="min-h-[400px]"
      >
        {(() => {
          if (isLoading) {
            return <DiscoverSkeleton count={6} variant="list" />;
          }

          if (isError) {
            return (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-destructive/5 border border-destructive/20 my-8 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
                  {t("error.title")}
                </h3>

                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  {errorMessage}
                </p>

                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-zinc-800 text-foreground border border-border transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  <span>{t("error.retry")}</span>
                </button>
              </div>
            );
          }

          if ((notifications ?? []).length === 0) {
            return (
              <div className="flex flex-col items-center justify-center text-center gap-5 py-20 px-6 rounded-3xl border border-dashed border-border/70 bg-card/40">
                <div
                  aria-hidden="true"
                  className="grid place-items-center size-16 rounded-full bg-secondary text-muted-foreground"
                >
                  <Bell className="size-7" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("empty.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("empty.description")}
                  </p>
                </div>
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                >
                  <Compass className="size-4" aria-hidden="true" />
                  {t("empty.cta")}
                </Link>
              </div>
            );
          }

          return (
            <ul className="flex flex-col gap-3 motion-safe:animate-in motion-safe:fade-in duration-300">
              {(notifications ?? []).map((notification) => (
                <li key={notification.id} className="list-none">
                  <NotificationItem
                    notification={notification}
                    actor={actorsById.get(notification.actorId)}
                    isMarking={
                      markRead.isPending &&
                      markRead.variables === notification.id
                    }
                    onMarkRead={(notificationId) =>
                      markRead.mutate(notificationId)
                    }
                  />
                </li>
              ))}
            </ul>
          );
        })()}
      </section>
    </div>
  );
};

export default NotificationsPage;
