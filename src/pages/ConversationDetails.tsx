import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  FileText,
  Flag,
  Image as ImageIcon,
  MessageCircle,
  MoreVertical,
  SendHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useGetConversationById } from "@/composables/useGetConversationById";
import { useSendMessage } from "@/composables/useSendMessage";
import { useMarkMessagesAsRead } from "@/composables/useMarkMessagesAsRead";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { Image } from "@/components/ui/Image";
import { getOtherUserId, hueFromString } from "@/utils/methods";
import { MessageType } from "@/api/chat";
import type { Message } from "@/api/chat";

/* -------------------------------------------------------------------------- */
/*  Types & helpers                                                           */
/* -------------------------------------------------------------------------- */

type ChatUser = NonNullable<
  ReturnType<typeof useFetchUsersByIds>["data"]
>[number];

type ListItem =
  | { kind: "day"; key: string; label: string }
  | {
      kind: "message";
      key: string;
      message: Message;
      isOwn: boolean;
      isFirstInGroup: boolean;
      isLastInGroup: boolean;
    };

/** Messages du même expéditeur à moins de 5 min => même groupe visuel */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
const DAY_MS = 86_400_000;
const NEAR_BOTTOM_PX = 120;

const toTime = (value?: string | null) =>
  value ? new Date(value).getTime() : 0;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const isSameDay = (a?: string | null, b?: string | null) =>
  !!a && !!b && new Date(a).toDateString() === new Date(b).toDateString();

const isSameGroup = (a: Message, b: Message) =>
  a.senderId === b.senderId &&
  isSameDay(a.sentAt, b.sentAt) &&
  Math.abs(toTime(b.sentAt) - toTime(a.sentAt)) < GROUP_WINDOW_MS;

function formatDayLabel(
  iso: string,
  locale: string,
  labels: { today: string; yesterday: string },
) {
  const date = new Date(iso);
  const now = new Date();
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (diff === 0) return labels.today;
  if (diff === 1) return labels.yesterday;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

function formatTime(iso: string | null | undefined, locale: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Ancienneté de la dernière présence, en relatif.
 * Retourne "" si la date est absente, invalide ou de moins d'une minute
 * (le libellé « à l'instant » est géré à part).
 */
function formatLastSeen(iso: string | null | undefined, locale: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (abs < 60_000) return "";
  if (abs < 3_600_000)
    return rtf.format(-Math.round(diffMs / 60_000), "minute");
  if (abs < 86_400_000)
    return rtf.format(-Math.round(diffMs / 3_600_000), "hour");
  if (abs < 7 * 86_400_000)
    return rtf.format(-Math.round(diffMs / 86_400_000), "day");

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
}

function buildItems(
  messages: Message[],
  currentUserId: string | undefined,
  locale: string,
  labels: { today: string; yesterday: string },
): ListItem[] {
  const items: ListItem[] = [];

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
/*  Petits composants                                                         */
/* -------------------------------------------------------------------------- */

const Avatar = memo(
  ({
    user,
    className = "h-10 w-10",
    showPresence = false,
  }: {
    user: ChatUser;
    className?: string;
    showPresence?: boolean;
  }) => {
    const photo = user.photos?.[0];
    const isOnline = user.isOnline === true;
    return (
      <div className={`relative shrink-0 ${className}`}>
        <div className="h-full w-full overflow-hidden rounded-full bg-secondary">
          {photo ? (
            <Image
              isLocal={false}
              url={photo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/90"
              style={{
                backgroundColor: `hsl(${hueFromString(user.id)} 35% 32%)`,
              }}
              aria-hidden="true"
            >
              {(user.username?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>

        {showPresence && isOnline && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success shadow-sm"
          />
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

const StateMessage: React.FC<{
  icon: React.ReactNode;
  title?: string;
  description: string;
  action?: { label: string; onClick: () => void };
}> = ({ icon, title, description, action }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
      {icon}
    </div>
    {title && (
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    )}
    <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-1 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {action.label}
      </button>
    )}
  </div>
);

const ConversationSkeleton: React.FC = () => (
  <div className="flex h-full flex-col" aria-busy="true">
    <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
      <div className="h-10 w-10 animate-pulse rounded-full bg-secondary" />
      <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
    </div>
    <div className="flex flex-1 flex-col justify-end gap-3 p-4">
      <div className="h-10 w-2/5 animate-pulse rounded-2xl bg-secondary" />
      <div className="ml-auto h-10 w-1/3 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-14 w-1/2 animate-pulse rounded-2xl bg-secondary" />
      <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-secondary" />
    </div>
  </div>
);

/** Menu d'actions : s'ouvre au clic, se ferme au clic extérieur ou Échap */
const ChatMenu: React.FC = () => {
  const { t } = useTranslation("chat");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // TODO : brancher les actions (médias, fichiers, bloquer, signaler)
  const items = [
    { key: "media", icon: ImageIcon, label: t("menu.media"), danger: false },
    { key: "files", icon: FileText, label: t("menu.files"), danger: false },
    { key: "block", icon: Ban, label: t("menu.block"), danger: true },
    { key: "report", icon: Flag, label: t("menu.report"), danger: true },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={t("menu.open")}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
        >
          {items.map(({ key, icon: Icon, label, danger }, i) => (
            <React.Fragment key={key}>
              {danger && items[i - 1] && !items[i - 1].danger && (
                <hr className="my-1 border-border" />
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none ${
                  danger ? "text-destructive" : "text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Message                                                                   */
/* -------------------------------------------------------------------------- */

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  otherUser: ChatUser;
}

const MessageBubble = memo<MessageBubbleProps>(
  ({ message, isOwn, isFirstInGroup, isLastInGroup, otherUser }) => {
    const { t, i18n } = useTranslation("chat");
    const isImage = message.type === MessageType.IMAGE;
    const isRead = message.status === "READ";

    // Coins : le bas côté expéditeur est toujours "collé", le haut l'est dans un groupe
    const corners = isOwn
      ? `rounded-br-md ${isFirstInGroup ? "" : "rounded-tr-md"}`
      : `rounded-bl-md ${isFirstInGroup ? "" : "rounded-tl-md"}`;

    return (
      <div
        className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
          isFirstInGroup ? "mt-3" : "mt-0.5"
        }`}
      >
        {/* {!isOwn &&
          (isLastInGroup ? (
            <Avatar user={otherUser} className="h-7 w-7" />
          ) : (
            <div className="h-7 w-7 shrink-0" aria-hidden="true" />
          ))} */}

        <div
          className={`flex max-w-[78%] flex-col md:max-w-[62%] ${
            isOwn ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`rounded-2xl text-sm leading-relaxed ${corners} ${
              isImage ? "p-1" : "px-3.5 py-2"
            } ${
              isOwn
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-foreground"
            }`}
          >
            {isImage ? (
              <Image
                isLocal={false}
                url={message.content || ""}
                alt={t("message.imageAlt")}
                className="max-h-72 w-auto max-w-full rounded-xl object-cover"
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {message.content || ""}
              </p>
            )}
          </div>

          {isLastInGroup && (
            <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
              {message.sentAt && (
                <time dateTime={message.sentAt}>
                  {formatTime(message.sentAt, i18n.language)}
                </time>
              )}
              {isOwn && (
                <span
                  className={isRead ? "text-primary" : ""}
                  title={isRead ? t("message.read") : t("message.sent")}
                >
                  {isRead ? (
                    <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {isRead ? t("message.read") : t("message.sent")}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
MessageBubble.displayName = "MessageBubble";

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const ConversationDetailsPage: React.FC = () => {
  const { t, i18n } = useTranslation("chat");
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { keycloak, userInfo } = useAuth();
  const currentUserId = (keycloak.tokenParsed?.sub ?? userInfo?.sub) as
    string | undefined;

  const [messageText, setMessageText] = useState("");
  const [sendError, setSendError] = useState(false);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const hasInitialScrolled = useRef(false);
  // Dernier nombre de non-lus pour lequel on a déjà lancé le marquage "lu"
  const markedUnreadRef = useRef<number | null>(null);

  const {
    data: conversation,
    isLoading: isLoadingConversation,
    isError: isErrorConversation,
    error: conversationError,
    refetch
  } = useGetConversationById(conversationId || "");

  const { mutateAsync: sendMessage, isPending: isSending } = useSendMessage();
  // `mutate` est stable, contrairement à l'objet complet retourné par useMutation
  const { mutate: markMessagesAsRead } = useMarkMessagesAsRead(
    conversationId || "",
  );

  const otherUserIds = useMemo(
    () =>
      conversation
        ? ([
            getOtherUserId(
              conversation as { user1Id: string; user2Id: string },
              currentUserId,
            ),
          ].filter(Boolean) as string[])
        : [],
    [conversation, currentUserId],
  );
  const { data: usersData, isLoading: isLoadingUsers } = useFetchUsersByIds(
    otherUserIds,
    { refetchInterval: 60_000 },
  );
  const otherUser = usersData?.[0];

  /* ----- Données dérivées ------------------------------------------------- */

  const sortedMessages = useMemo(
    () =>
      [...(conversation?.messages ?? [])].sort(
        (a, b) => toTime(a.sentAt) - toTime(b.sentAt),
      ),
    [conversation?.messages],
  );

  const items = useMemo(
    () =>
      buildItems(sortedMessages, currentUserId, i18n.language, {
        today: t("date.today"),
        yesterday: t("date.yesterday"),
      }),
    [sortedMessages, currentUserId, i18n.language, t],
  );

  const isReady = Boolean(conversation && otherUser);
  const lastMessage = sortedMessages[sortedMessages.length - 1];

  // Présence : en ligne, sinon dernière activité connue.
  const presence = useMemo(() => {
    if (!otherUser) return { isOnline: false, label: "" };

    if (otherUser.isOnline === true) {
      return { isOnline: true, label: t("header.online") };
    }

    const lastOnlineAt = otherUser.lastOnlineAt;
    if (!lastOnlineAt) {
      return { isOnline: false, label: t("header.offline") };
    }

    const seen = formatLastSeen(lastOnlineAt, i18n.language);
    if (!seen) {
      return { isOnline: false, label: t("header.justNow") };
    }

    // Au-delà d'une semaine, on affiche la date plutôt qu'un relatif.
    const isOlderThanAWeek =
      Date.now() - new Date(lastOnlineAt).getTime() >= 7 * 86_400_000;

    return {
      isOnline: false,
      label: isOlderThanAWeek
        ? t("header.lastSeenOn", { date: seen })
        : t("header.lastSeen", { time: seen }),
    };
  }, [otherUser, i18n.language, t]);

  // Nombre de messages non lus pour l'utilisateur courant (valeur primitive :
  // l'effet ne dépend plus de l'identité de l'objet `conversation`)
  const unreadCount = conversation
    ? conversation.user1Id === currentUserId
      ? (conversation.unreadCountUser1 ?? 0)
      : (conversation.unreadCountUser2 ?? 0)
    : 0;

  // Marque les messages comme lus, une seule fois par valeur de compteur.
  // Si un nouveau message arrive, le compteur change et le marquage est relancé.
  useEffect(() => {
    if (!isReady || unreadCount === 0) {
      markedUnreadRef.current = null;
      return;
    }
    if (markedUnreadRef.current === unreadCount) return;

    markedUnreadRef.current = unreadCount;
    markMessagesAsRead(undefined, {
      onError: () => {
        // autorise une nouvelle tentative
        markedUnreadRef.current = null;
      },
    });
  }, [isReady, unreadCount, markMessagesAsRead]);

  /* ----- Scroll ----------------------------------------------------------- */

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return false;
    el.scrollTo({ top: el.scrollHeight, behavior });
    return true;
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    isNearBottomRef.current = nearBottom;
    setShowJump(!nearBottom);
  }, []);

  // Premier affichage : on saute en bas sans animation.
  // Ensuite : on suit les nouveaux messages seulement si l'utilisateur est déjà
  // en bas (ou s'il vient d'envoyer), pour ne pas l'arracher à sa lecture.
  useLayoutEffect(() => {
    if (!isReady || !lastMessage) return;

    if (!hasInitialScrolled.current) {
      hasInitialScrolled.current = scrollToBottom("auto");
      return;
    }

    if (isNearBottomRef.current || lastMessage.senderId === currentUserId) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      scrollToBottom(reduceMotion ? "auto" : "smooth");
    }
  }, [
    isReady,
    lastMessage?.id,
    lastMessage?.senderId,
    currentUserId,
    scrollToBottom,
  ]);

  /* ----- Saisie ----------------------------------------------------------- */

  // Hauteur auto du textarea (max 120px)
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [messageText]);

  const handleSend = useCallback(async () => {
    const content = messageText.trim();
    if (!content || !otherUser || isSending) return;

    setSendError(false);
    setMessageText(""); // le champ se vide tout de suite, on le restaure en cas d'échec
    try {
      await sendMessage({
        receiverId: otherUser.id,
        content,
        type: MessageType.TEXT,
      });
    } catch (_error) {
      setMessageText(content);
      setSendError(true);
    } finally {
      textareaRef.current?.focus();
      refetch()
    }
  }, [messageText, otherUser, isSending, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing : évite d'envoyer en validant une saisie IME (clavier mobile/asiatique)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleSend();
    }
  };

  /* ----- États intermédiaires -------------------------------------------- */

  if (!conversationId) {
    return (
      <StateMessage
        icon={<AlertCircle className="h-7 w-7" />}
        description={t("error.noUserId")}
      />
    );
  }

  if (isLoadingConversation || (conversation && isLoadingUsers)) {
    return <ConversationSkeleton />;
  }

  if (isErrorConversation || !conversation) {
    return (
      <StateMessage
        icon={<AlertCircle className="h-7 w-7" />}
        title={t("error.title")}
        description={
          conversationError?.message || t("error.conversationNotFound")
        }
        action={{
          label: t("error.backToChat"),
          onClick: () => navigate("/chat"),
        }}
      />
    );
  }

  if (!otherUser) {
    return (
      <StateMessage
        icon={<AlertCircle className="h-7 w-7" />}
        description={t("error.userNotFound")}
        action={{
          label: t("error.backToChat"),
          onClick: () => navigate("/chat"),
        }}
      />
    );
  }

  /* ----- Rendu ------------------------------------------------------------ */

  const canSend = messageText.trim().length > 0 && !isSending;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* En-tête */}
      <header className="z-10 flex shrink-0 items-center gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
          aria-label={t("header.back")}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <Avatar user={otherUser} showPresence />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-foreground">
            {otherUser.username || t("header.member")}
          </h1>
          <p
            className={`mt-0.5 flex items-center gap-1.5 truncate text-xs ${
              presence.isOnline ? "text-success" : "text-muted-foreground"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                presence.isOnline ? "bg-success" : "bg-muted-foreground/70"
              }`}
            />
            <span className="truncate">{presence.label}</span>
          </p>
        </div>

        <ChatMenu />
      </header>

      {/* Messages */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          aria-label={t("messages.label")}
          className="h-full overflow-y-auto overscroll-contain px-4 py-4"
        >
          {items.length === 0 ? (
            <StateMessage
              icon={<MessageCircle className="h-7 w-7" />}
              description={t("messages.empty")}
            />
          ) : (
            items.map((item) =>
              item.kind === "day" ? (
                <div
                  key={item.key}
                  className="my-4 flex justify-center first:mt-0"
                >
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs capitalize text-muted-foreground">
                    {item.label}
                  </span>
                </div>
              ) : (
                <MessageBubble
                  key={item.key}
                  message={item.message}
                  isOwn={item.isOwn}
                  isFirstInGroup={item.isFirstInGroup}
                  isLastInGroup={item.isLastInGroup}
                  otherUser={otherUser}
                />
              ),
            )
          )}
        </div>

        {showJump && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-3 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={t("messages.jumpToLatest")}
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Saisie */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border bg-card px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {sendError && (
          <p
            role="alert"
            className="mb-2 flex items-center gap-1.5 px-2 text-xs text-destructive"
          >
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {t("input.error")}
          </p>
        )}

        <div className="flex items-end gap-2 rounded-3xl border border-border bg-secondary py-1.5 pl-4 pr-1.5 transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("input.placeholder")}
            rows={1}
            enterKeyHint="send"
            className="max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label={t("input.label")}
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("input.send")}
          >
            <SendHorizontal className="h-[18px] w-[18px]" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConversationDetailsPage;