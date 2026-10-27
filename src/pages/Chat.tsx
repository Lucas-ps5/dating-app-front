import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Send,
  ChevronDown,
  MoreVertical,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useGetConversationByUserId } from "@/composables/useGetConversationByUserId";
import { useSendMessage } from "@/composables/useSendMessage";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { Image } from "@/components/ui/Image";
import {
  formatTimestamp,
  getOtherUserId,
  hueFromString,
} from "@/utils/methods";
import type { UserSummary } from "@/types/user";
import type { Conversation, Message, MessageType } from "@/api/chat";

const ChatPage: React.FC = () => {
  const { t, i18n } = useTranslation("chat");
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { keycloak, userInfo } = useAuth();
  const currentUserId = (keycloak.tokenParsed?.sub ?? userInfo?.sub) as
    string | undefined;

  const [messageText, setMessageText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { conversation, isLoading: isLoadingConversation } =
    useGetConversationByUserId(userId, currentUserId);
  const isErrorConversation = false;

  const sendMessageMutation = useSendMessage();
  // TODO: Need conversationId (matchId) to mark messages as read
  // const markAsReadMutation = useMarkMessagesAsRead(conversationId);

  const otherUserIds = conversation
    ? ([getOtherUserId(conversation, currentUserId)].filter(
        Boolean,
      ) as string[])
    : [];
  const { data: usersData } = useFetchUsersByIds(otherUserIds);
  const otherUser = usersData?.[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageText.trim() || !userId || sendMessageMutation.isPending)
        return;

      try {
        await sendMessageMutation.mutateAsync({
          receiverId: userId,
          content: messageText.trim(),
          type: MessageType.TEXT,
        });
        setMessageText("");
        textareaRef.current?.focus();
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [messageText, userId, sendMessageMutation],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t("error.noUserId")}</p>
      </div>
    );
  }

  if (isLoadingConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="space-y-4">
          <X className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {t("error.title")}
          </h2>
          <p className="text-muted-foreground">
            {t("error.conversationNotFound")}
          </p>
          <button
            onClick={() => navigate("/chat")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t("error.backToChat")}
          </button>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <p className="text-muted-foreground">{t("error.userNotFound")}</p>
      </div>
    );
  }

  const isUser1 = conversation.user1Id === currentUserId;
  const unreadCount = isUser1
    ? conversation.unreadCountUser1
    : conversation.unreadCountUser2;
  const messages = conversation.messages ?? [];
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.sentAt!).getTime() - new Date(b.sentAt!).getTime(),
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary">
            {otherUser.photos && otherUser.photos.length > 0 ? (
              <Image
                isLocal={false}
                url={otherUser.photos[0]}
                alt={otherUser.username || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/90"
                style={{
                  backgroundColor: `hsl(${hueFromString(otherUser.id)} 35% 32%)`,
                }}
              >
                {(otherUser.username?.[0] ?? "?").toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-foreground">
              {otherUser.username || t("header.member")}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {t("header.online")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {showMenu && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}

      <div
        className="fixed right-0 top-14 z-30 w-56 md:static md:w-auto md:z-auto md:top-auto"
        role="menu"
      >
        <div
          className={`${showMenu ? "block" : "hidden"} md:block bg-card border border-border rounded-lg shadow-lg overflow-hidden`}
          role="menu"
        >
          <button
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            {t("menu.media")}
          </button>
          <button
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary flex items-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            {t("menu.files")}
          </button>
          <hr className="border-border my-1" />
          <button
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-secondary flex items-center gap-2"
          >
            {t("menu.block")}
          </button>
          <button
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-secondary flex items-center gap-2"
          >
            {t("menu.report")}
          </button>
        </div>
      </div>

      <main
        className="flex-1 overflow-y-auto p-4 space-y-4"
        aria-label={t("messages.label")}
      >
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>{t("messages.empty")}</p>
          </div>
        ) : (
          sortedMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              username={otherUser.username}
              currentUserId={currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-border bg-card"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("input.placeholder")}
            rows={1}
            maxRows={5}
            className="flex-1 min-h-[44px] max-h-[120px] px-4 py-2.5 text-sm bg-secondary border border-border rounded-xl resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            aria-label={t("input.label")}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            aria-label={t("input.send")}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  username: string | undefined;
  currentUserId: string | undefined;
}

const MessageItem = memo<MessageItemProps>(
  ({ message, isOwn, username, currentUserId }) => {
    const { t, i18n } = useTranslation("chat");
    const timestamp = formatTimestamp(message.sentAt, i18n.language);
    const isRead = message.status === "READ";

    return (
      <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
        {!isOwn && <div className="h-8 w-8 shrink-0" aria-hidden="true" />}
        <div
          className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
        >
          {!isOwn && (
            <span className="text-xs text-muted-foreground ml-1 mb-0.5">
              {username || t("message.member")}
            </span>
          )}
          <div
            className={`relative rounded-2xl px-4 py-2 text-sm ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-secondary text-foreground rounded-tl-none"
            }`}
          >
            {message.type === MessageType.IMAGE ? (
              <Image
                isLocal={false}
                url={message.content}
                alt={t("message.imageAlt")}
                className="rounded-lg max-w-xs"
              />
            ) : (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
          <div
            className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? "justify-end pr-1" : "justify-start pl-1"}`}
          >
            <time dateTime={message.sentAt!}>{timestamp}</time>
            {isOwn && (
              <span
                className={isRead ? "text-primary" : "text-muted-foreground"}
              >
                {isRead ? t("message.read") : t("message.sent")}
              </span>
            )}
          </div>
        </div>
        {isOwn && <div className="h-8 w-8 shrink-0" aria-hidden="true" />}
      </div>
    );
  },
);

MessageItem.displayName = "MessageItem";

export default ChatPage;
