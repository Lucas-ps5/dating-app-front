import React, { useMemo } from "react";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetMyConversations } from "@/composables/useGetMyConversations";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { Image } from "@/components/ui/Image";
import { DiscoverEmptyState } from "@/components/discover/DiscoverEmptyState";
import { DiscoverErrorState } from "@/components/discover/DiscoverErrorState";
import type { UserSummary } from "@/types/user";

interface ConversationWithUser {
  conversation: {
    user1Id: string;
    user2Id: string;
    lastMessagePreview: string;
    lastMessageSentAt: string;
    createdAt: string;
    updatedAt: string;
  };
  user: UserSummary;
}

export const ConversationsPage: React.FC = () => {
  const { t } = useTranslation("conversations");

  const { data: conversations, isLoading: isLoadingConversations, isError: isErrorConversations, error: conversationsError, refetch: refetchConversations } =
    useGetMyConversations();

  const otherUserIds = useMemo(() => {
    if (!conversations) return [];
    return conversations.map((conv) => conv.user2Id).filter(Boolean) as string[];
  }, [conversations]);

  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers, error: usersError } =
    useFetchUsersByIds(otherUserIds);

  const usersMap = useMemo(() => {
    const map = new Map<string, UserSummary>();
    if (usersData) {
      usersData.forEach((user) => map.set(user.id, user));
    }
    return map;
  }, [usersData]);

  const conversationsWithUsers = useMemo(() => {
    if (!conversations) return [];
    return conversations
      .map((conv) => {
        const otherUserId = conv.user2Id;
        const user = otherUserId ? usersMap.get(otherUserId) : undefined;
        if (!user) return null;
        return {
          conversation: conv,
          user,
        };
      })
      .filter(Boolean) as ConversationWithUser[];
  }, [conversations, usersMap]);

  const isLoading = isLoadingConversations || (otherUserIds.length > 0 && isLoadingUsers);
  const isError = isErrorConversations || isErrorUsers;
  const error = conversationsError || usersError;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-zinc-300 border border-border/60 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span>{t("header.badge")}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span>{t("header.title")}</span>
          </h1>

          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {t("header.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground shadow-sm">
            {t("header.totalConversations", { count: conversationsWithUsers.length })}
          </div>
        </div>
      </header>

      <section aria-label="Conversations list" className="min-h-[400px]">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border/80 rounded-xl animate-pulse">
                <div className="w-14 h-14 rounded-xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-secondary rounded" />
                  <div className="h-3 w-1/2 bg-secondary rounded" />
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <DiscoverErrorState error={error} onRetry={() => refetchConversations()} />
        ) : conversationsWithUsers.length === 0 ? (
          <DiscoverEmptyState
            onResetFilters={() => {}}
            isFiltered={false}
          />
        ) : (
          <div className="space-y-3">
            {conversationsWithUsers.map(({ conversation, user }) => (
              <ConversationItem
                key={user.id}
                conversation={conversation}
                user={user}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface ConversationItemProps {
  conversation: {
    user1Id: string;
    user2Id: string;
    lastMessagePreview: string;
    lastMessageSentAt: string;
    createdAt: string;
    updatedAt: string;
  };
  user: UserSummary;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  user,
}) => {
  const { t } = useTranslation("conversations");

  const primaryPhoto = user.photos && user.photos.length > 0 ? user.photos[0] : null;
  const lastMessageTime = conversation.lastMessageSentAt
    ? new Date(conversation.lastMessageSentAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <a
      href={`/chat?userId=${user.id}`}
      className="flex items-center gap-4 p-4 bg-card border border-border/80 rounded-xl hover:border-zinc-500/40 hover:bg-zinc-900/60 transition-all duration-200"
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
        {primaryPhoto ? (
          <Image
            isLocal={false}
            url={primaryPhoto}
            alt={`${user.username}'s profile photo`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              {user.username?.slice(0, 2) || "—"}
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-base text-foreground truncate">
              {user.username || t("item.member")}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {conversation.lastMessagePreview || t("item.noMessages")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {lastMessageTime && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {lastMessageTime}
              </span>
            )}
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </a>
  );
};

export default ConversationsPage;