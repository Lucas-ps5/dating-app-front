import React, { memo, useMemo, useState } from "react";
import { MessageSquare, Search, SearchX, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyConversations } from "@/composables/useGetMyConversations";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { Image } from "@/components/ui/Image";
import { DiscoverErrorState } from "@/components/discover/DiscoverErrorState";
import type { UserSummary } from "@/types/user";
import {
  normalize,
  getConversationDate,
  formatTimestamp,
  hueFromString,
  getOtherUserId,
} from "@/utils/methods";
import type { Conversation } from "@/api/chat";
import { Link } from "react-router";

/* -------------------------------------------------------------------------- */
/* Types & helpers                                                            */
/* -------------------------------------------------------------------------- */

type Filter = "all" | "unread";

interface ConversationWithUser {
  conversation: Conversation;
  user: UserSummary;
  unreadCount: number;
}

const getUnreadCount = (
  conversation: Conversation,
  currentUserId: string | undefined,
): number =>
  conversation.user1Id === currentUserId
    ? (conversation.unreadCountUser1 ?? 0)
    : (conversation.unreadCountUser2 ?? 0);

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export const ConversationsPage: React.FC = () => {
  const { t } = useTranslation("conversations");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const { keycloak, userInfo } = useAuth();
  const currentUserId = (keycloak.tokenParsed?.sub ?? userInfo?.sub) as
    string | undefined;

  const {
    data: conversations,
    isLoading: isLoadingConversations,
    isError: isErrorConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useGetMyConversations();

  const otherUserIds = useMemo(() => {
    if (!conversations) return [];
    return conversations
      .map((conv) => getOtherUserId(conv, currentUserId))
      .filter((id): id is string => Boolean(id));
  }, [conversations, currentUserId]);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError,
  } = useFetchUsersByIds(otherUserIds);

  const usersMap = useMemo(() => {
    const map = new Map<string, UserSummary>();
    usersData?.forEach((user) => map.set(user.id, user));
    return map;
  }, [usersData]);

  // Jointure conversations + utilisateurs, triée de la plus récente à la plus ancienne.
  const conversationsWithUsers = useMemo<ConversationWithUser[]>(() => {
    if (!conversations) return [];
    return conversations
      .map((conv) => {
        const otherId = getOtherUserId(conv, currentUserId);
        const user = otherId ? usersMap.get(otherId) : undefined;
        return user
          ? {
              conversation: conv,
              user,
              unreadCount: getUnreadCount(conv, currentUserId),
            }
          : null;
      })
      .filter((item): item is ConversationWithUser => item !== null)
      .sort(
        (a, b) =>
          getConversationDate(b.conversation) -
          getConversationDate(a.conversation),
      );
  }, [conversations, usersMap, currentUserId]);

  const unreadTotal = useMemo(
    () => conversationsWithUsers.filter((c) => c.unreadCount > 0).length,
    [conversationsWithUsers],
  );

  const filteredConversations = useMemo(() => {
    const q = normalize(query.trim());
    return conversationsWithUsers.filter(({ user, unreadCount }) => {
      if (filter === "unread" && unreadCount === 0) return false;
      if (!q) return true;
      return normalize(user.username ?? "").includes(q);
    });
  }, [conversationsWithUsers, query, filter]);

  const isLoading =
    isLoadingConversations || (otherUserIds.length > 0 && isLoadingUsers);
  const isError = isErrorConversations || isErrorUsers;
  const error = conversationsError || usersError;

  const hasConversations = conversationsWithUsers.length > 0;
  const isSearching = query.trim().length > 0;

  const resetFilters = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("header.title")}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("header.subtitle")}
        </p>
      </header>

      {!isLoading && !isError && hasConversations && (
        <div className="space-y-3">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder", {
                defaultValue: "Rechercher une conversation",
              })}
              aria-label={t("search.label", {
                defaultValue: "Rechercher une conversation",
              })}
              className="h-12 w-full rounded-2xl border border-border/80 bg-card pl-11 pr-11 text-sm text-foreground shadow-sm placeholder:text-muted-foreground transition-colors focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("search.clear", {
                  defaultValue: "Effacer la recherche",
                })}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <FilterTabs
            filter={filter}
            onChange={setFilter}
            total={conversationsWithUsers.length}
            unread={unreadTotal}
          />
        </div>
      )}

      <section
        aria-label={t("list.label", {
          defaultValue: "Liste des conversations",
        })}
        aria-busy={isLoading}
        className="min-h-[400px]"
      >
        {isLoading ? (
          <ConversationsSkeleton />
        ) : isError ? (
          <DiscoverErrorState
            error={error}
            onRetry={() => refetchConversations()}
          />
        ) : !hasConversations ? (
          <EmptyConversations />
        ) : filteredConversations.length === 0 ? (
          <NoResults
            query={query.trim()}
            filter={filter}
            onReset={resetFilters}
          />
        ) : (
          <ul className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm">
            {filteredConversations.map(
              ({ conversation, user, unreadCount }) => (
                <li
                  key={user.id}
                  className="relative after:pointer-events-none after:absolute after:bottom-0 after:left-[5.25rem] after:right-0 after:h-px after:bg-border/60 last:after:hidden"
                >
                  <ConversationItem
                    conversation={conversation}
                    user={user}
                    unreadCount={unreadCount}
                    query={query.trim()}
                  />
                </li>
              ),
            )}
          </ul>
        )}

        {/* Annonce vocale du nombre de résultats pendant la recherche */}
        {isSearching && (
          <span className="sr-only" role="status" aria-live="polite">
            {t("search.count", {
              count: filteredConversations.length,
              defaultValue: `${filteredConversations.length} résultat(s)`,
            })}
          </span>
        )}
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Filter tabs                                                                */
/* -------------------------------------------------------------------------- */

interface FilterTabsProps {
  filter: Filter;
  onChange: (filter: Filter) => void;
  total: number;
  unread: number;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  filter,
  onChange,
  total,
  unread,
}) => {
  const { t } = useTranslation("conversations");

  const tabs: { id: Filter; label: string; count: number }[] = [
    {
      id: "all",
      label: t("filters.all", { defaultValue: "Toutes" }),
      count: total,
    },
    {
      id: "unread",
      label: t("filters.unread", { defaultValue: "Non lues" }),
      count: unread,
    },
  ];

  return (
    <div
      role="group"
      aria-label={t("filters.label", {
        defaultValue: "Filtrer les conversations",
      })}
      className="inline-flex rounded-full bg-secondary p-1"
    >
      {tabs.map((tab) => {
        const active = filter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-8 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs tabular-nums ${
                active && tab.id === "unread" && tab.count > 0
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

const ConversationsSkeleton: React.FC = () => (
  <ul
    aria-hidden="true"
    className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm"
  >
    {Array.from({ length: 6 }).map((_, i) => (
      <li
        key={i}
        className="relative flex items-center gap-4 px-4 py-4 sm:px-5 motion-safe:animate-pulse after:absolute after:bottom-0 after:left-[5.25rem] after:right-0 after:h-px after:bg-border/60 last:after:hidden"
      >
        <div className="h-14 w-14 shrink-0 rounded-full bg-secondary" />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between gap-6">
            <div className="h-4 w-32 rounded bg-secondary" />
            <div className="h-3 w-10 rounded bg-secondary" />
          </div>
          <div className="h-3.5 w-3/5 rounded bg-secondary/70" />
        </div>
      </li>
    ))}
  </ul>
);

/* -------------------------------------------------------------------------- */
/* Empty & no-result states                                                   */
/* -------------------------------------------------------------------------- */

const EmptyConversations: React.FC = () => {
  const { t } = useTranslation("conversations");

  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border/80 px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageSquare className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        {t("empty.title", {
          defaultValue: "Aucune conversation pour le moment",
        })}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t("empty.description", {
          defaultValue:
            "Quand vous échangerez avec un membre, la discussion apparaîtra ici.",
        })}
      </p>
      <a
        href="/discover"
        className="mt-7 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {t("empty.cta", { defaultValue: "Découvrir des profils" })}
      </a>
    </div>
  );
};

interface NoResultsProps {
  query: string;
  filter: Filter;
  onReset: () => void;
}

const NoResults: React.FC<NoResultsProps> = ({ query, filter, onReset }) => {
  const { t } = useTranslation("conversations");

  const message = query
    ? t("search.noResults", {
        query,
        defaultValue: `Aucun résultat pour « ${query} »`,
      })
    : t("filters.noUnread", {
        defaultValue: "Vous avez tout lu. Aucune conversation non lue.",
      });

  return (
    <div
      role="status"
      className="flex flex-col items-center rounded-3xl border border-dashed border-border/80 px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <SearchX className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {(query || filter !== "all") && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex h-9 items-center rounded-full bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          {t("search.reset", { defaultValue: "Voir toutes les conversations" })}
        </button>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Item                                                                       */
/* -------------------------------------------------------------------------- */

const Highlight: React.FC<{ text: string; query: string }> = ({
  text,
  query,
}) => {
  if (!query) return <>{text}</>;
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  // Sécurité : on ne surligne que si la normalisation conserve les indices.
  if (normalizedText.length !== text.length || !normalizedQuery) {
    return <>{text}</>;
  }
  const index = normalizedText.indexOf(normalizedQuery);
  if (index < 0) return <>{text}</>;
  const end = index + normalizedQuery.length;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">
        {text.slice(index, end)}
      </mark>
      {text.slice(end)}
    </>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  user: UserSummary;
  unreadCount: number;
  query: string;
}

const ConversationItem = memo<ConversationItemProps>(
  ({ conversation, user, unreadCount, query }) => {
    const { t, i18n } = useTranslation("conversations");

    const primaryPhoto =
      user.photos && user.photos.length > 0 ? user.photos[0] : null;
    const username = user.username || t("item.member");
    const timestamp = formatTimestamp(
      conversation.lastMessageSentAt,
      i18n.language,
    );
    const hasMessage = Boolean(conversation.lastMessagePreview);
    const hasUnread = unreadCount > 0;

    return (
      <Link
        to={`/chat/conversation/${conversation.id}`}
        className={`group relative flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/70 sm:px-5 ${
          hasUnread ? "bg-primary/[0.05]" : ""
        }`}
      >
        <div
          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-secondary ${
            hasUnread
              ? "ring-2 ring-primary ring-offset-2 ring-offset-card"
              : "border border-border/60"
          }`}
        >
          {primaryPhoto ? (
            <Image
              isLocal={false}
              url={primaryPhoto}
              alt={t("item.photoAlt", {
                username,
                defaultValue: `Photo de profil de ${username}`,
              })}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/90"
              style={{
                backgroundColor: `hsl(${hueFromString(user.id)} 35% 32%)`,
              }}
            >
              {(user.username?.[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-base text-foreground ${
              hasUnread ? "font-bold" : "font-semibold"
            }`}
          >
            <Highlight text={username} query={query} />
          </h3>
          <p
            className={`mt-0.5 truncate text-sm ${
              hasMessage
                ? hasUnread
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
                : "italic text-muted-foreground/70"
            }`}
          >
            {hasMessage
              ? conversation.lastMessagePreview
              : t("item.noMessages")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 self-stretch py-0.5">
          {timestamp && (
            <time
              dateTime={conversation.lastMessageSentAt}
              className={`text-xs tabular-nums ${
                hasUnread
                  ? "font-semibold text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {timestamp}
            </time>
          )}
          {hasUnread && (
            <span
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground"
              aria-label={t("item.unreadCount", { count: unreadCount })}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </Link>
    );
  },
);

ConversationItem.displayName = "ConversationItem";

export default ConversationsPage;
