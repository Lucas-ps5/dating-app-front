import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DiscoverSkeletonProps {
  count?: number;
  variant?: "grid" | "list";
}

export const DiscoverSkeleton: React.FC<DiscoverSkeletonProps> = ({
  count = 8,
  variant = "grid",
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-3">
        {items.map((i) => (
          <div
            key={`skeleton-list-${i}`}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card/60 border border-border/60 animate-pulse"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32 bg-zinc-800 rounded-md" />
                  <Skeleton className="h-4 w-12 bg-zinc-800 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-48 bg-zinc-800/80 rounded" />
                <Skeleton className="h-3 w-28 bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
              <Skeleton className="h-8 w-20 bg-zinc-800 rounded-lg" />
              <Skeleton className="h-8 w-24 bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {items.map((i) => (
        <div
          key={`skeleton-grid-${i}`}
          className="flex flex-col rounded-2xl overflow-hidden bg-card/60 border border-border/60 animate-pulse"
        >
          {/* Photo area */}
          <div className="relative aspect-[3/4] w-full bg-zinc-900 flex flex-col justify-between p-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20 rounded-full bg-zinc-800" />
              <Skeleton className="h-5 w-12 rounded-full bg-zinc-800" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 rounded bg-zinc-800" />
              <Skeleton className="h-3.5 w-1/2 rounded bg-zinc-800/80" />
              <Skeleton className="h-3 w-1/3 rounded bg-zinc-800/60" />
            </div>
          </div>
          {/* Footer bar */}
          <div className="p-3 bg-zinc-950/70 border-t border-border/40 flex items-center gap-2">
            <Skeleton className="h-8 flex-1 rounded-lg bg-zinc-800" />
            <Skeleton className="h-8 flex-1 rounded-lg bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
};
