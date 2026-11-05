import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Image } from "@/components/ui/Image";

interface MessageImagePreviewProps {
  /** URL de l'image à afficher. */
  src: string;
  /** Texte alternatif (accessibilité). */
  alt?: string;
  /** Appelé quand l'utilisateur ferme l'aperçu. */
  onClose: () => void;
}

/**
 * Aperçu plein écran d'une image de message.
 *
 * - Mobile : l'image occupe tout l'écran (`object-contain`, on voit la totalité
 *   de l'image, pas de recadrage).
 * - Écrans plus larges : l'image est centrée dans une carte avec des marges et
 *   des dimensions plafonnées (85 % de la hauteur, 1200 px de large max).
 *
 * Fermeture : bouton "X", clic sur le fond, ou touche Échap.
 */
const MessageImagePreview: React.FC<MessageImagePreviewProps> = ({
  src,
  alt = "",
  onClose,
}) => {
  const { t } = useTranslation("chat");

  // Échap pour fermer + blocage du scroll de la page en dessous.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("messages.imagePreview.label")}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Image : le clic ne ferme pas l'aperçu */}
      <div
        className="flex h-full w-full items-center justify-center sm:h-auto sm:w-auto sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          isLocal={false}
          url={src}
          alt={alt}
          className="max-h-full max-w-full object-contain sm:max-h-[85vh] sm:max-w-[min(92vw,1200px)] sm:rounded-xl sm:shadow-2xl"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("messages.imagePreview.close")}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-5 sm:top-5"
      >
        <X className="h-5 w-5" />
      </button>
    </div>,
    document.body,
  );
};

export default MessageImagePreview;
