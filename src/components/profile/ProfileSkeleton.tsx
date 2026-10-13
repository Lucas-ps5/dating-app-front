import React from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder shown while the authenticated user's profile is loading.
 * Mirrors the layout of the profile page to avoid content jumps.
 */
export const ProfileSkeleton: React.FC = () => {
  const { t } = useTranslation("profile");

  return (
    <div
      className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"
      aria-busy="true"
    >
      <span className="sr-only">{t("loading.aria")}</span>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28 rounded-full bg-zinc-800" />
          <Skeleton className="h-8 w-48 rounded-md bg-zinc-800" />
          <Skeleton className="h-4 w-72 rounded bg-zinc-800/70" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl bg-zinc-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Photos */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-3">
          <Skeleton className="aspect-[3/4] w-full rounded-3xl bg-zinc-800" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-20 rounded-xl bg-zinc-800" />
            ))}
          </div>
        </div>

        {/* Information cards */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-6">
          <Skeleton className="h-40 w-full rounded-3xl bg-zinc-800" />
          <Skeleton className="h-28 w-full rounded-3xl bg-zinc-800" />
          <Skeleton className="h-32 w-full rounded-3xl bg-zinc-800" />
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
