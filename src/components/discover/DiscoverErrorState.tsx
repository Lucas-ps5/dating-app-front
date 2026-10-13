import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DiscoverErrorStateProps {
  error?: unknown;
  onRetry: () => void;
}

export const DiscoverErrorState: React.FC<DiscoverErrorStateProps> = ({
  error,
  onRetry,
}) => {
  const { t } = useTranslation("discover");

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : t("error.defaultMsg");

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-destructive/5 border border-destructive/20 my-8 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
        {t("error.title")}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {errorMessage}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-zinc-800 text-foreground border border-border transition-colors shadow-sm"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
        <span>{t("error.retry")}</span>
      </button>
    </div>
  );
};
