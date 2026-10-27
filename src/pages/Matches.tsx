import React, { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Users, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useListMatchesForUser } from "@/composables/useListMatchesForUser";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { UserCard } from "@/components/discover/UserCard";
import { DiscoverPagination } from "@/components/discover/DiscoverPagination";
import { DiscoverSkeleton } from "@/components/discover/DiscoverSkeleton";
import { DiscoverErrorState } from "@/components/discover/DiscoverErrorState";
import { getOtherUserId } from "@/utils/methods";
import type { UserSummary } from "@/types/user";
import type { Match } from "@/api/matches";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

const parsePositiveInt = (
  value: string | null,
  fallback: number,
  max?: number,
) => {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return max ? Math.min(n, max) : n;
};

export const MatchesPage: React.FC = () => {
  const { t } = useTranslation("matches");
  const [searchParams, setSearchParams] = useSearchParams();
  const { keycloak, userInfo } = useAuth();
  const currentUserId = (keycloak.tokenParsed?.sub ?? userInfo?.sub) as
    string | undefined;

  // L'URL est la seule source de vérité : plus de double état ni de re-render au montage.
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(
    searchParams.get("limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  const updateParams = (
    next: { page?: number; limit?: number },
    replace = false,
  ) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev); // conserve les autres paramètres éventuels
        const nextPage = next.page ?? page;
        const nextLimit = next.limit ?? limit;

        if (nextPage > 1) params.set("page", String(nextPage));
        else params.delete("page");

        if (nextLimit !== DEFAULT_LIMIT) params.set("limit", String(nextLimit));
        else params.delete("limit");

        return params;
      },
      { replace },
    );
  };

  const {
    data: matchesData,
    isLoading: isLoadingMatches,
    isError: isErrorMatches,
    error: matchesError,
    refetch: refetchMatches,
  } = useListMatchesForUser(page, limit);

  // Pour chaque match, on doit récupérer l'utilisateur "autre" (pas l'utilisateur actuel)
  const otherUserIds = useMemo(() => {
    if (!matchesData?.data || !currentUserId) return [];
    return matchesData.data
      .map((match: Match) => getOtherUserId(match, currentUserId))
      .filter((id): id is string => Boolean(id));
  }, [matchesData, currentUserId]);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useFetchUsersByIds(otherUserIds);

  // On respecte l'ordre des matches (le plus récent d'abord) et on ignore les comptes introuvables.
  const users = useMemo<UserSummary[]>(() => {
    const byId = new Map((usersData ?? []).map((u: UserSummary) => [u.id, u]));
    return otherUserIds
      .map((id) => byId.get(id))
      .filter((u): u is UserSummary => Boolean(u));
  }, [usersData, otherUserIds]);

  const total = matchesData?.total ?? 0;
  const totalPages = matchesData?.totalPages ?? 1;

  const isLoading =
    isLoadingMatches || (otherUserIds.length > 0 && isLoadingUsers);
  const isError = isErrorMatches || isErrorUsers;
  const error = matchesError || usersError;

  // Si l'URL pointe au-delà de la dernière page (?page=99), on revient sur la dernière.
  useEffect(() => {
    if (matchesData && totalPages >= 1 && page > totalPages) {
      updateParams({ page: totalPages }, true);
    }
  }, [matchesData, totalPages, page]);

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const handleLimitChange = (newLimit: number) => {
    updateParams({ limit: newLimit, page: 1 });
  };

  const handleRetry = () => {
    refetchMatches();
    if (isErrorUsers) refetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-border/40">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className="shrink-0 grid place-items-center size-12 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/25"
          >
            <Users className="size-6 fill-current" />
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

        {!isLoadingMatches && !isErrorMatches && (
          <div
            role="status"
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/80 text-sm font-medium text-foreground shadow-sm tabular-nums"
          >
            <span
              className="size-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            {t("header.totalMatches", { count: total })}
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
            return (
              <DiscoverSkeleton
                count={Math.min(limit, DEFAULT_LIMIT)}
                variant="grid"
              />
            );
          }
          if (isError) {
            return <DiscoverErrorState error={error} onRetry={handleRetry} />;
          }
          if (users.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center text-center gap-5 py-20 px-6 rounded-3xl border border-dashed border-border/70 bg-card/40">
                <div
                  aria-hidden="true"
                  className="grid place-items-center size-16 rounded-full bg-secondary text-muted-foreground"
                >
                  <Users className="size-7" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("empty.noMatchesTitle")}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("empty.noMatchesDesc")}
                  </p>
                </div>
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-colors"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {t("empty.resetAll")}
                </Link>
              </div>
            );
          }
          return (
            <ul
              // key = page : la grille se ré-affiche proprement à chaque changement de page
              key={`${page}-${limit}`}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 motion-safe:animate-in motion-safe:fade-in duration-300"
            >
              {users.map((user) => (
                <li key={user.id} className="list-none">
                  <UserCard user={user as any} variant="grid" />
                </li>
              ))}
            </ul>
          );
        })()}
      </section>

      {!isLoading && !isError && total > 0 && (
        <nav
          aria-label={t("pagination.ariaNav", { defaultValue: "Pagination" })}
        >
          <DiscoverPagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </nav>
      )}
    </div>
  );
};

export default MatchesPage;
