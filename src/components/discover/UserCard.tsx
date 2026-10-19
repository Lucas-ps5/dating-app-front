import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  MapPin,
  Briefcase,
  User as UserIcon,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Image } from "@/components/ui/Image";
import type { UserWithDistance } from "@/api/users";
import { calculateAge, formatLocation, formatDistance } from "@/utils/discover";

interface UserCardProps {
  user: UserWithDistance;
  variant?: "grid" | "list";
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = "grid",
}) => {
  const { t } = useTranslation("discover");
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const age = calculateAge(user.birthdate);
  const location = formatLocation(user.city, user.country);
  const distanceStr = formatDistance(user.distance, t);
  const primaryPhoto =
    user.photos && user.photos.length > 0 ? user.photos[0] : null;
  const hasPhoto = Boolean(primaryPhoto && !imageError);

  const handleCardClick = () => {
    if (user.id) {
      navigate(`/users/${user.id}`);
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.id) {
      navigate(`/chat?userId=${user.id}`);
    }
  };

  // LIST VARIANT
  if (variant === "list") {
    return (
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 hover:border-zinc-500/40 hover:bg-zinc-900/60 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          {/* Avatar / Photo */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border/60">
            {hasPhoto ? (
              <Image
                isLocal={false}
                url={primaryPhoto!}
                alt={user.username || "User profile photo"}
                loading="lazy"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400">
                <UserIcon className="w-7 h-7 text-zinc-500" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mt-1">
                  {user.username?.slice(0, 2) || "—"}
                </span>
              </div>
            )}
            {distanceStr && (
              <span className="absolute bottom-1 right-1 sm:hidden px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/80 backdrop-blur-md text-zinc-200">
                {distanceStr}
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                {user.username || t("card.member")}
              </h3>
              {age !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/80 text-zinc-300 font-medium">
                  {age} {t("filters.yrs")}
                </span>
              )}
            </div>

            {user.title && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
                <Briefcase className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <span className="truncate">{user.title}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
              {distanceStr && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-800/80 text-[11px] text-zinc-300">
                  {distanceStr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <button
            type="button"
            onClick={handleMessageClick}
            aria-label={t("card.messageAria", {
              name: user.username || t("card.member"),
            })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-secondary hover:bg-zinc-800 text-zinc-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("card.message")}</span>
          </button>
        </div>
      </div>
    );
  }

  // GRID VARIANT
  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/80 hover:border-zinc-500/50 hover:shadow-2xl transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Photo Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        {hasPhoto ? (
          <Image
            isLocal={false}
            url={primaryPhoto!}
            alt={
              user.username
                ? `${user.username}'s profile photo`
                : "Member photo"
            }
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-850 to-zinc-950 p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-3 shadow-inner">
              <UserIcon className="w-10 h-10 text-zinc-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">
              {user.username || t("card.member")}
            </p>
            <span className="text-xs text-zinc-600 mt-1">
              {t("card.noPhoto")}
            </span>
          </div>
        )}

        {/* Ambient Gradient Overlays for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

        {/* Distance Badge (Top Left) */}
        {distanceStr && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md text-zinc-200 border border-white/10 shadow-sm">
              <MapPin className="w-3 h-3 text-primary" />
              {distanceStr}
            </span>
          </div>
        )}

        {/* Gender Badge (Top Right) */}
        {user.gender && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
              {user.gender}
            </span>
          </div>
        )}

        {/* In-Card Details (Bottom Overlay) */}
        <div className="absolute bottom-0 inset-x-0 p-4 z-10 flex flex-col gap-1 text-white">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-bold tracking-tight text-white truncate drop-shadow-sm group-hover:text-primary transition-colors">
              {user.username || t("card.anonymous")}
            </h3>
            {age !== null && (
              <span className="text-base font-normal text-zinc-300 drop-shadow-sm">
                {age}
              </span>
            )}
          </div>

          {user.title && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 truncate drop-shadow-sm">
              <Briefcase className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{user.title}</span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Bar */}
      <div className="p-3 bg-zinc-950/70 border-t border-border/40 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleMessageClick}
          aria-label={t("card.messageAria", {
            name: user.username || t("card.member"),
          })}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-secondary/80 hover:bg-secondary text-zinc-200 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t("card.message")}</span>
        </button>
      </div>
    </div>
  );
};
