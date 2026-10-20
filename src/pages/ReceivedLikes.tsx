import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useListReceivedLikes } from "@/composables/useListReceivedLikes";
import { useFetchUsersByIds } from "@/composables/useFetchUsersByIds";
import { UserCard } from "@/components/discover/UserCard";
import { DiscoverPagination } from "@/components/discover/DiscoverPagination";
import { DiscoverSkeleton } from "@/components/discover/DiscoverSkeleton";
import { DiscoverEmptyState } from "@/components/discover/DiscoverEmptyState";
import { DiscoverErrorState } from "@/components/discover/DiscoverErrorState";

interface UserSummary {
  id: string;
  username: string;
  photos: string[];
}

export const ReceivedLikesPage: React.FC = () => {
  const { t } = useTranslation("receivedLikes");
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    const urlPage = searchParams.get("page");
    const urlLimit = searchParams.get("limit");

    if (urlPage) {
      const p = parseInt(urlPage, 10);
      if (!isNaN(p) && p > 0) setPage(p);
    }
    if (urlLimit) {
      const l = parseInt(urlLimit, 10);
      if (!isNaN(l) && l > 0 && l <= 100) setLimit(l);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (limit !== 12) params.set("limit", limit.toString());

    setSearchParams(params, { replace: true });
  }, [page, limit, setSearchParams]);

  const { data: likesData, isLoading: isLoadingLikes, isError: isErrorLikes, error: likesError, refetch: refetchLikes } =
    useListReceivedLikes(page, limit);

  const senderIds = useMemo(() => {
    return likesData?.data?.map((like) => like.senderId) ?? [];
  }, [likesData]);

  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers, error: usersError } =
    useFetchUsersByIds(senderIds);

  const users: UserSummary[] = usersData ?? [];
  const total = likesData?.total ?? 0;
  const totalPages = likesData?.totalPages ?? 1;

  const isLoading = isLoadingLikes || (senderIds.length > 0 && isLoadingUsers);
  const isError = isErrorLikes || isErrorUsers;
  const error = likesError || usersError;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-zinc-300 border border-border/60 mb-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
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
            {t("header.totalReceived", { count: total })}
          </div>
        </div>
      </header>

      <section aria-label="Received likes results" className="min-h-[400px]">
        {isLoading ? (
          <DiscoverSkeleton count={limit > 12 ? 12 : limit} variant="grid" />
        ) : isError ? (
          <DiscoverErrorState error={error} onRetry={() => refetchLikes()} />
        ) : users.length === 0 ? (
          <DiscoverEmptyState
            onResetFilters={() => {}}
            isFiltered={false}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user as any}
                variant="grid"
              />
            ))}
          </div>
        )}
      </section>

      {!isLoading && !isError && total > 0 && (
        <section aria-label="Results pagination">
          <DiscoverPagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </section>
      )}
    </div>
  );
};

export default ReceivedLikesPage;