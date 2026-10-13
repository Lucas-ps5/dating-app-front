import React from "react";
import { Users, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DiscoverEmptyStateProps {
  onResetFilters: () => void;
  isFiltered?: boolean;
}

export const DiscoverEmptyState: React.FC<DiscoverEmptyStateProps> = ({
  onResetFilters,
  isFiltered = false,
}) => {
  const { t } = useTranslation("discover");

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card/60 border border-border/80 my-8 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mb-4 text-zinc-400 shadow-inner">
        <Users className="w-8 h-8 text-zinc-400" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
        {isFiltered ? t("empty.noMatchingTitle") : t("empty.noActiveTitle")}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {isFiltered ? t("empty.noMatchingDesc") : t("empty.noActiveDesc")}
      </p>

      {isFiltered && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all hover:shadow-glow"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t("empty.resetAll")}</span>
        </button>
      )}
    </div>
  );
};
