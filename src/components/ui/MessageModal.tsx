import * as React from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Send, MessageCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface MessageModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (content: string) => Promise<void>;
  isPending?: boolean;
  recipientName: string;
  placeholder?: string;
  maxLength?: number;
}

/** Jauge circulaire indiquant le taux de remplissage du message. */
const CharacterRing: React.FC<{ current: number; max: number }> = ({
  current,
  max,
}) => {
  const size = 28;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(current / max, 1);
  const offset = circumference * (1 - ratio);
  const remaining = max - current;

  const colorClass =
    ratio >= 1
      ? "text-destructive"
      : ratio >= 0.9
        ? "text-orange-500"
        : "text-primary";

  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "stroke-current transition-all duration-200",
            colorClass,
          )}
        />
      </svg>
      <span
        className={cn(
          "text-xs tabular-nums transition-colors",
          ratio >= 0.9 ? colorClass : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {ratio >= 0.9 ? remaining : `${current}/${max}`}
      </span>
    </div>
  );
};

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onOpenChange,
  onSend,
  isPending = false,
  recipientName,
  placeholder,
  maxLength = 2000,
}) => {
  const { t } = useTranslation("common");
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const trimmed = content.trim();
  const canSend = !isPending && trimmed.length > 0;
  const initial = recipientName?.trim().charAt(0).toUpperCase() || "?";

  // Reset à la fermeture (bouton, Échap ou clic extérieur)
  React.useEffect(() => {
    if (!isOpen) {
      setContent("");
      setError(null);
    }
  }, [isOpen]);

  // Auto-focus à l'ouverture
  React.useEffect(() => {
    if (isOpen) {
      const id = window.setTimeout(() => textareaRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [isOpen]);

  // Auto-resize du textarea (entre 120px et 260px)
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 120), 260)}px`;
  }, [content]);

  const handleOpenChange = (open: boolean) => {
    // On empêche la fermeture pendant l'envoi
    if (isPending && !open) return;
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!canSend) return;
    setError(null);
    try {
      await onSend(trimmed);
      setContent("");
      onOpenChange(false);
    } catch {
      // On conserve le texte pour permettre un nouvel essai
      setError(
        t("messageSendError", "Impossible d'envoyer le message. Réessayez."),
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 animate-slide-up">
        {/* En-tête */}
        <DialogHeader className="space-y-0 border-b bg-muted/30 px-6 py-5 text-left">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary ring-2 ring-background">
                {initial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                <MessageCircle className="h-3 w-3" aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold leading-tight">
                {t("sendMessage")}
              </DialogTitle>
              <DialogDescription className="mt-0.5 truncate">
                {t("messageTo", { username: recipientName })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Corps */}
        <div className="space-y-3 px-6 py-5">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t("messagePlaceholder")}
            className={cn(
              "min-h-[120px] resize-none text-sm leading-relaxed transition-colors",
              error && "border-destructive focus-visible:ring-destructive",
            )}
            maxLength={maxLength}
            disabled={isPending}
            aria-label={t("messageTo", { username: recipientName })}
            aria-invalid={!!error}
          />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
          <CharacterRing current={content.length} max={maxLength} />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              className="min-w-[110px] gap-2"
              title="Ctrl/⌘ + Entrée"
            >
              {isPending ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  {t("loading")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {t("send")}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
