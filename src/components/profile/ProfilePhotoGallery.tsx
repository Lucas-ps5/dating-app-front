import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/Image";

interface ProfilePhotoGalleryProps {
  photos: string[];
  username?: string;
}

/**
 * Photo carousel for the profile page.
 * Falls back to a friendly placeholder when the user has no usable photo.
 */
export const ProfilePhotoGallery: React.FC<ProfilePhotoGalleryProps> = ({
  photos,
  username,
}) => {
  const { t } = useTranslation("profile");
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const total = photos.length;

  // Jump back to the first photo whenever the collection size changes.
  useEffect(() => {
    setIndex(0);
    setImageFailed(false);
  }, [total]);

  const safeIndex = total > 0 ? Math.min(index, total - 1) : 0;
  const currentPhoto = total > 0 ? photos[safeIndex] : null;
  const showImage = Boolean(currentPhoto) && !imageFailed;

  const goTo = (nextIndex: number) => {
    setImageFailed(false);
    setIndex(nextIndex);
  };

  const goToPrev = () => goTo(safeIndex > 0 ? safeIndex - 1 : total - 1);
  const goToNext = () => goTo(safeIndex < total - 1 ? safeIndex + 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-border/80 shadow-2xl">
        {showImage ? (
          <Image
            isLocal={false}
            url={currentPhoto ?? ""}
            alt={
              username
                ? t("photo.alt", { username })
                : t("photo.altFallback")
            }
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-zinc-500">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-zinc-500" />
            </div>
            <span className="text-sm font-semibold text-zinc-300">
              {t("photo.noPhoto")}
            </span>
            <span className="text-xs text-zinc-500 max-w-64">
              {t("photo.noPhotoHint")}
            </span>
          </div>
        )}

        {total > 1 && showImage && (
          <>
            <button
              type="button"
              aria-label={t("photo.prev")}
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={t("photo.next")}
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10">
              {t("photo.counter", { current: safeIndex + 1, total })}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div
          role="list"
          aria-label={t("sections.photos")}
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          {photos.map((photo, idx) => (
            <button
              key={`${photo}-${idx}`}
              type="button"
              role="listitem"
              aria-label={t("photo.thumbnailAlt", { index: idx + 1 })}
              aria-current={idx === safeIndex}
              onClick={() => goTo(idx)}
              className={cn(
                "relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                idx === safeIndex
                  ? "border-primary scale-105 shadow-md"
                  : "border-transparent opacity-60 hover:opacity-100",
              )}
            >
              <Image
                isLocal={false}
                url={photo}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoGallery;
