import React, { useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, Heart, Check, User, Sparkles } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { NotificationType } from "@/api/notifications";
import type { Notification } from "@/api/notifications";
import { Image } from "@/components/ui/Image";
import { formatLastSeen } from "@/utils/date";
import { hueFromString } from "@/utils/chat";
import type { UserSummary } from "@/types/user";

/**
 * Per-type presentation: icon, colors and the action proposed to the user.
 * Every displayed string is translated in the `notifications` namespace.
 */
const TYPE_CONFIG = {
  [NotificationType.PROFILE_VISITED]: {
    icon: Eye,
    iconWrap: "bg-primary/10 text-primary ring-primary/25",
    labelClass: "text-primary",
    action: {
      to: (actorId: string) => `/users/${actorId}`,
      labelKey: "item.viewProfile",
      icon: User,
    },
  },
  [NotificationType.NEW_MATCH]: {
    icon: Heart,
    iconWrap: "bg-destructive/10 text-destructive ring-destructive/25",
    labelClass: "text-destructive",
    action: {
      to: () => "/matches",
      labelKey: "item.viewMatch",
      icon: Sparkles,
    },
  },
} as const;

interface NotificationItemProps {
  notification: Notification;
  /** The user who triggered the notification, when it could be resolved. */
  actor?: UserSummary;
  /** True while this notification is being marked as read. */
  isMarking: boolean;
  onMarkRead: (notificationId: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  actor,
  isMarking,
  onMarkRead,
}) => {
  const { t, i18n } = useTranslation("notifications");
  const navigate = useNavigate();

  const config =
    TYPE_CONFIG[notification.type] ??
    TYPE_CONFIG[NotificationType.PROFILE_VISITED];
  const TypeIcon = config.icon;
  const ActionIcon = config.action.icon;

  const isRead = Boolean(notification.readAt);
  const username = actor?.username;
  const primaryPhoto = actor?.photos?.length ? actor.photos[0] : null;
  const timestamp =
    formatLastSeen(notification.createdAt, i18n.language) || t("item.justNow");

  const typeLabel = t(`types.${notification.type}.label`);
  const actionLabel = t(config.action.labelKey);
  const plainText = username
    ? t(`types.${notification.type}.textPlain`, { username })
    : t(`types.${notification.type}.textUnknown`);

  const target = config.action.to(notification.actorId);

  /**
   * Clicking the notification redirects the user to the related page and
   * marks the notification as read (only if it is still unread).
   */
  const handleActivate = useCallback(() => {
    if (!isRead && !isMarking) {
      onMarkRead(notification.id);
    }
    navigate(target);
  }, [isRead, isMarking, onMarkRead, notification.id, navigate, target]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleActivate();
    },
    [handleActivate],
  );

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={t("item.ariaLabel", { type: typeLabel, text: plainText })}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-colors cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isRead
          ? "bg-card/60 border-border/60"
          : "bg-primary/[0.05] border-primary/25 shadow-sm"
      }`}
    >
      {/* Avatar + type icon */}
      <div className="relative shrink-0">
        <div
          className={`size-12 sm:size-14 overflow-hidden rounded-full ${
            isRead
              ? "border border-border/60"
              : "ring-2 ring-primary ring-offset-2 ring-offset-card"
          }`}
        >
          {primaryPhoto ? (
            <Image
              isLocal={false}
              url={primaryPhoto}
              alt={t("item.photoAlt", { username: username ?? "" })}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center text-lg font-semibold text-white/90"
              style={{
                backgroundColor: `hsl(${hueFromString(notification.actorId)} 35% 32%)`,
              }}
            >
              {(username?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>

        <span
          aria-hidden="true"
          className={`absolute -bottom-1 -right-1 grid place-items-center size-6 rounded-full ring-2 ring-card ${config.iconWrap}`}
        >
          <TypeIcon className="size-3.5" />
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${config.labelClass}`}
          >
            {typeLabel}
          </span>
          {timestamp && (
            <time
              dateTime={notification.createdAt}
              className="text-xs text-muted-foreground ml-auto"
            >
              {timestamp}
            </time>
          )}
        </div>

        <p className="text-sm sm:text-base text-foreground leading-relaxed">
          {username ? (
            <Trans
              i18nKey={`types.${notification.type}.text`}
              ns="notifications"
              values={{ username }}
              components={[
                <strong className="font-semibold text-foreground" />,
              ]}
            />
          ) : (
            t(`types.${notification.type}.textUnknown`)
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            to={target}
            onClick={(event) => {
              // The link navigates on its own, only the read state is handled here.
              event.stopPropagation();
              if (!isRead && !isMarking) {
                onMarkRead(notification.id);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground bg-secondary hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ActionIcon className="size-3.5" aria-hidden="true" />
            {actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default NotificationItem;
