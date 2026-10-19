import React, { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useSearchParams } from "react-router";
import { Compass, FilterX, MapPin, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Gender, type UserWithDistance } from "@/api/users";
import { useDiscoverUsers } from "@/composables/useDiscoverUsers";
import {
  useDiscoverStore,
  DEFAULT_AGE_MIN,
  DEFAULT_AGE_MAX,
  DEFAULT_LIMIT,
} from "@/store/useDiscoverStore";
import { UserCard } from "@/components/discover/UserCard";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { MobileFilterDrawer } from "@/components/discover/MobileFilterDrawer";
import { DiscoverPagination } from "@/components/discover/DiscoverPagination";
import { DiscoverSkeleton } from "@/components/discover/DiscoverSkeleton";
import { DiscoverEmptyState } from "@/components/discover/DiscoverEmptyState";
import { DiscoverErrorState } from "@/components/discover/DiscoverErrorState";
import { getStoredCoordinates, refreshCoordinates } from "@/utils/geolocation";

export const DiscoverPage: React.FC = () => {
  const { t } = useTranslation("discover");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const {
    gender,
    ageMin,
    ageMax,
    page,
    limit,
    clientSearch,
    viewMode,
    setGender,
    setAgeRange,
    setPage,
    setLimit,
    resetFilters,
  } = useDiscoverStore();

  // Check if coordinates are available
  const hasCoordinates = getStoredCoordinates() !== null;

  // Sync initial URL search params into Zustand on mount
  useEffect(() => {
    const urlGender = searchParams.get("gender");
    const urlAgeMin = searchParams.get("ageMin");
    const urlAgeMax = searchParams.get("ageMax");
    const urlPage = searchParams.get("page");
    const urlLimit = searchParams.get("limit");

    if (urlGender === "male" || urlGender === "female") {
      setGender(urlGender as Gender);
    }
    const parsedMin = urlAgeMin ? parseInt(urlAgeMin, 10) : undefined;
    const parsedMax = urlAgeMax ? parseInt(urlAgeMax, 10) : undefined;
    if (parsedMin !== undefined || parsedMax !== undefined) {
      setAgeRange(parsedMin ?? DEFAULT_AGE_MIN, parsedMax ?? DEFAULT_AGE_MAX);
    }
    if (urlPage) {
      const p = parseInt(urlPage, 10);
      if (!isNaN(p) && p > 0) setPage(p);
    }
    if (urlLimit) {
      const l = parseInt(urlLimit, 10);
      if (!isNaN(l) && l > 0 && l <= 100) setLimit(l);
    }
  }, []);

  // Sync state back to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (gender) params.set("gender", gender);
    if (ageMin !== DEFAULT_AGE_MIN) params.set("ageMin", ageMin.toString());
    if (ageMax !== DEFAULT_AGE_MAX) params.set("ageMax", ageMax.toString());
    if (page > 1) params.set("page", page.toString());
    if (limit !== DEFAULT_LIMIT) params.set("limit", limit.toString());

    setSearchParams(params, { replace: true });
  }, [gender, ageMin, ageMax, page, limit, setSearchParams]);

  // Construct query filters to call GET /discover
  const queryFilters = useMemo(
    () => ({
      gender,
      ageMin: ageMin !== DEFAULT_AGE_MIN ? ageMin : undefined,
      ageMax: ageMax !== DEFAULT_AGE_MAX ? ageMax : undefined,
      page,
      limit,
    }),
    [gender, ageMin, ageMax, page, limit],
  );

  // TanStack Query via composable
  const { data, isLoading, isError, error, refetch, isFetching } =
    useDiscoverUsers(queryFilters);

  const users: UserWithDistance[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Client-side search filtering on currently loaded page results
  const deferredSearch = useDeferredValue(clientSearch.trim().toLowerCase());

  const filteredUsers = useMemo(() => {
    if (!deferredSearch) return users;

    return users.filter((u) => {
      const usernameMatch = u.username?.toLowerCase().includes(deferredSearch);
      const titleMatch = u.title?.toLowerCase().includes(deferredSearch);
      const cityMatch = u.city?.toLowerCase().includes(deferredSearch);
      const countryMatch = u.country?.toLowerCase().includes(deferredSearch);

      return usernameMatch || titleMatch || cityMatch || countryMatch;
    });
  }, [users, deferredSearch]);

  const isFiltered =
    gender !== undefined ||
    ageMin !== DEFAULT_AGE_MIN ||
    ageMax !== DEFAULT_AGE_MAX ||
    Boolean(clientSearch);

  const handleRefreshLocation = async () => {
    await refreshCoordinates();
    setShowLocationPrompt(false);
    refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* A. Main Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-zinc-300 border border-border/60 mb-2">
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>{t("header.badge")}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <span>{t("header.title")}</span>
            {isFetching && !isLoading && (
              <span
                className="w-2 h-2 rounded-full bg-primary animate-ping"
                title="Updating..."
              />
            )}
          </h1>

          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {t("header.subtitle")}
          </p>
        </div>

        {/* Total count badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground shadow-sm">
            {t("header.totalActive", { count: total })}
          </div>
        </div>
      </header>

      {/* B. Filters Bar & Panel */}
      <section aria-label="Profile filters">
        <DiscoverFilters
          totalResults={total}
          filteredCount={filteredUsers.length}
          onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
        />
      </section>

      {/* Mobile Drawer */}
      <MobileFilterDrawer
        open={isMobileDrawerOpen}
        onOpenChange={setIsMobileDrawerOpen}
      />

      {/* C. User Results & Status Views */}
      <section aria-label="User profiles results" className="min-h-[400px]">
        {!hasCoordinates ? (
          /* Location Required State */
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card/60 border border-border/80 my-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-zinc-400 shadow-inner">
              <MapPin className="w-8 h-8 text-zinc-400" />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
              {t("locationRequired.title", "Location Required")}
            </h3>

            <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
              {t(
                "locationRequired.desc",
                "To discover people near you, we need access to your location. Please enable location permissions in your browser and try again.",
              )}
            </p>

            <button
              type="button"
              onClick={handleRefreshLocation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:shadow-glow"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t("locationRequired.retry", "Try Again")}</span>
            </button>
          </div>
        ) : isLoading ? (
          <DiscoverSkeleton
            count={limit > 12 ? 12 : limit}
            variant={viewMode}
          />
        ) : isError ? (
          <DiscoverErrorState error={error} onRetry={() => refetch()} />
        ) : filteredUsers.length === 0 ? (
          users.length > 0 && clientSearch ? (
            /* Local search returned 0 from loaded results */
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card/60 border border-border/80 my-8">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
                <FilterX className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {t("empty.noLoadedMatchTitle", { query: clientSearch })}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                {t("empty.noLoadedMatchDesc")}
              </p>
              <button
                type="button"
                onClick={() => useDiscoverStore.getState().setClientSearch("")}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-zinc-800 text-foreground transition-colors"
              >
                {t("empty.clearLocalSearch")}
              </button>
            </div>
          ) : (
            <DiscoverEmptyState
              onResetFilters={resetFilters}
              isFiltered={isFiltered}
            />
          )
        ) : (
          /* Profile Cards List / Grid */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                : "flex flex-col gap-3.5"
            }
          >
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id || user.username}
                user={user}
                variant={viewMode}
              />
            ))}
          </div>
        )}
      </section>

      {/* D. Pagination Component */}
      {!isLoading && !isError && total > 0 && hasCoordinates && (
        <section aria-label="Results pagination">
          <DiscoverPagination
            page={page}
            limit={limit}
            total={total}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => setLimit(newLimit)}
          />
        </section>
      )}
    </div>
  );
};
export default DiscoverPage;
