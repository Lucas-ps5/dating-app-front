import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileErrorStateProps {
  error?: unknown;
  onRetry: () => void;
}

const resolveErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error) {
    return error;
  }
  return fallback;
};

/**
 * Full-page error state for the profile screen, with a retry action.
 */
export const ProfileErrorState: React.FC<ProfileErrorStateProps> = ({
  error,
  onRetry,
}) => {
  const { t } = useTranslation("profile");

  const errorMessage = resolveErrorMessage(error, t("error.defaultMsg"));

  return (
    <div
      role="alert"
      className="max-w-lg mx-auto p-6 sm:p-12 text-center my-12 rounded-3xl bg-destructive/5 border border-destructive/20 shadow-sm"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4 text-destructive">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        {t("error.title")}
      </h2>

      <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-zinc-800 text-foreground border border-border transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
        <span>{t("error.retry")}</span>
      </button>
    </div>
  );
};

export default ProfileErrorState;
