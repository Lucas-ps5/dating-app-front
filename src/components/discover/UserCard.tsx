import React, { memo, useEffect, useState } from "react";
import { Link } from "react-router";
import { MapPin, Briefcase, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Image } from "@/components/ui/Image";
import type { UserWithDistance } from "@/api/users";
import { calculateAge, formatLocation, formatDistance } from "@/utils/discover";

interface UserCardProps {
  user: UserWithDistance;
  variant?: "grid" | "list";
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Teinte stable dérivée du pseudo : chaque profil sans photo a sa propre couleur. */
const hueFromString = (value: string): number => {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
};

const getInitials = (name: string): string =>
  name.trim().slice(0, 2).toUpperCase() || "?";

interface PhotoFallbackProps {
  name: string;
  size: "sm" | "lg";
}

const PhotoFallback: React.FC<PhotoFallbackProps> = ({ name, size }) => {
  const hue = hueFromString(name);
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center"
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 22% 22%), hsl(${hue} 18% 10%))`,
      }}
    >
      <span
        className={
          size === "lg"
            ? "grid h-20 w-20 place-items-center rounded-full bg-white/5 text-2xl font-semibold text-zinc-100 ring-1 ring-white/15"
            : "grid h-10 w-10 place-items-center rounded-full bg-white/5 text-sm font-semibold text-zinc-100 ring-1 ring-white/15"
        }
      >
        {getInitials(name)}
      </span>
    </div>
  );
};

const Chip: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  children,
  className = "",
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-zinc-100 ring-1 ring-white/10 backdrop-blur-md ${className}`}
  >
    {children}
  </span>
);

/* -------------------------------------------------------------------------- */
/* Composant                                                                   */
/* -------------------------------------------------------------------------- */

const UserCardBase: React.FC<UserCardProps> = ({
  user,
  variant = "grid",
}) => {
  const { t } = useTranslation("discover");
  const [imageError, setImageError] = useState(false);

  const primaryPhoto = user.photos?.[0] ?? null;

  // Si la photo change (ex. liste réutilisée / pagination), on retente l'image.
  useEffect(() => setImageError(false), [primaryPhoto]);

  const displayName = user.username || t("card.member");
  const age = calculateAge(user.birthdate);
  const location = formatLocation(user.city, user.country);
  const distance = formatDistance(user.distance, t);
  const photoUrl = primaryPhoto && !imageError ? primaryPhoto : null;

  const profileHref = user.id ? `/users/${user.id}` : undefined;

  // Lien étiré : toute la carte est cliquable, sans imbriquer de bouton dans un
  // role="button". Middle-click / "ouvrir dans un nouvel onglet" fonctionnent.
  const stretchedLink = profileHref ? (
    <Link
      to={profileHref}
      aria-label={t("card.viewProfile", {
        name: displayName,
        defaultValue: "Voir le profil de {{name}}",
      })}
      className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
    />
  ) : null;

  /* ------------------------------ LIST VARIANT ----------------------------- */
  if (variant === "list") {
    return (
      <article className="group relative flex items-center gap-4 rounded-xl border border-border/70 bg-card p-3 transition-colors duration-200 hover:border-zinc-500/40 hover:bg-zinc-900/60 sm:p-4">
        {stretchedLink}

        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-secondary sm:h-20 sm:w-20">
          {photoUrl ? (
            <Image
              isLocal={false}
              url={photoUrl}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
            />
          ) : (
            <PhotoFallback name={displayName} size="sm" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {displayName}
            {age !== null && (
              <span className="ml-2 font-normal text-muted-foreground">
                {age} {t("filters.yrs")}
              </span>
            )}
          </h3>

          {user.title && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">{user.title}</span>
            </p>
          )}

          {(location || distance) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              {location && <span className="min-w-0 truncate">{location}</span>}
              {distance && (
                <span className="shrink-0 whitespace-nowrap text-zinc-500">
                  {location ? `· ${distance}` : distance}
                </span>
              )}
            </p>
          )}
        </div>

        <ChevronRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300"
        />
      </article>
    );
  }

  /* ------------------------------ GRID VARIANT ----------------------------- */
  return (
    <article className="group relative isolate overflow-hidden rounded-2xl border border-border/70 bg-card transition-[border-color,box-shadow] duration-300 hover:border-zinc-500/50 hover:shadow-2xl">
      {stretchedLink}

      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        {photoUrl ? (
          <Image
            isLocal={false}
            url={photoUrl}
            alt=""
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
          />
        ) : (
          <PhotoFallback name={displayName} size="lg" />
        )}

        {/* Voile : renforce la lisibilité du texte, surtout en bas */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {/* Badges du haut */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {distance ? (
            <Chip className="min-w-0 max-w-[60%]">
              <MapPin className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{distance}</span>
            </Chip>
          ) : (
            <span />
          )}
          {user.gender && (
            <Chip className="shrink-0 capitalize">{user.gender}</Chip>
          )}
        </div>

        {/* Infos du bas */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="min-w-0 text-white">
            <h3 className="truncate text-lg font-semibold leading-tight tracking-tight">
              {displayName}
              {age !== null && (
                <span className="ml-1.5 font-normal text-zinc-300">{age}</span>
              )}
            </h3>

            {user.title && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-200">
                <Briefcase className="h-3 w-3 shrink-0 text-zinc-400" />
                <span className="truncate">{user.title}</span>
              </p>
            )}

            {location && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-300">
                <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                <span className="truncate">{location}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export const UserCard = memo(UserCardBase);