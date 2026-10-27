import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Baby,
  Briefcase,
  Cake,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  HeartPulse,
  Languages,
  MapPin,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Users,
  Ruler,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetUserById } from "@/composables/useGetUserById";
import { useHasLiked } from "@/composables/useHasLiked";
import { useCreateLike } from "@/composables/useCreateLike";
import { useSendMessage } from "@/composables/useSendMessage";
import { calculateAge, formatLocation, formatDistance } from "@/utils/discover";
import {
  formatBirthdate,
  formatDateTime,
  formatHasChildren,
  formatHeight,
  formatRelationshipTypes,
  formatWantsChildren,
} from "@/utils/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { Image } from "@/components/ui/Image";
import { MessageModal } from "@/components/ui/MessageModal";

/* -------------------------------------------------------------------------- */
/*  Petits composants réutilisables                                           */
/* -------------------------------------------------------------------------- */

type IconType = React.ComponentType<{ className?: string }>;

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-3">
    <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
    {children}
  </section>
);

const InfoTile: React.FC<{
  icon?: IconType;
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, label, children, className = "" }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-xl bg-secondary/60 border border-border/40 ${className}`}
  >
    {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{children}</dd>
    </div>
  </div>
);

const Chip: React.FC<{ icon?: IconType; children: React.ReactNode }> = ({
  icon: Icon,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/60 text-foreground border border-border/40">
    {Icon && <Icon className="w-3 h-3 text-primary" />}
    {children}
  </span>
);

const SWIPE_THRESHOLD = 50;

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export const UserProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation(["profile", "discover"]);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const { data: user, isLoading, error, refetch } = useGetUserById(id || "");

  const {
    data: hasLiked,
    isLoading: isCheckingLike,
    refetch: refetchHasLiked,
  } = useHasLiked(id || "");
  const { mutate: createLike, isPending: isLiking } = useCreateLike();
  const { mutate: sendMessage, isPending: isSendingMessage } = useSendMessage();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (user.id) {
      sendMessage({ receiverId: user.id, content });
    }
  };

  const handleLike = () => {
    if (!id || hasLiked?.liked || isLiking) return;
    createLike(
      { receiverId: id },
      {
        onSuccess: () => {
          refetchHasLiked();
        },
      },
    );
  };

  const photos: string[] = user?.photos ?? [];
  const photoCount = photos.length;

  const showPrev = useCallback(
    () =>
      setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photoCount - 1)),
    [photoCount],
  );
  const showNext = useCallback(
    () =>
      setSelectedPhotoIndex((prev) => (prev < photoCount - 1 ? prev + 1 : 0)),
    [photoCount],
  );

  // Revenir à la première photo quand on change de profil
  useEffect(() => {
    setSelectedPhotoIndex(0);
  }, [id]);

  // Navigation clavier dans la galerie (← / →)
  useEffect(() => {
    if (photoCount < 2) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photoCount, showPrev, showNext]);

  // Retour : historique si on vient de l'app, sinon /discover
  const goBack = () => {
    if (routerLocation.key !== "default") navigate(-1);
    else navigate("/discover");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || photoCount < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > SWIPE_THRESHOLD) showPrev();
    else if (delta < -SWIPE_THRESHOLD) showNext();
  };

  /* ------------------------------- Chargement ------------------------------ */
  // Même structure que la page finale pour éviter le layout shift
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-28 h-10 rounded-xl bg-muted" />
          <Skeleton className="w-24 h-4 rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-6 lg:col-span-5">
            <Skeleton className="aspect-3/4 w-full rounded-3xl bg-muted" />
          </div>
          <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-6">
            <Skeleton className="h-44 w-full rounded-3xl bg-muted" />
            <Skeleton className="h-32 w-full rounded-3xl bg-muted" />
            <Skeleton className="h-40 w-full rounded-3xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------- Erreur / introuvable ------------------------- */
  if (error || !user) {
    return (
      <div className="max-w-lg mx-auto p-6 sm:p-12 text-center my-12 rounded-3xl bg-card border border-border">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4 text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t("profilePage.notFoundTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t("profilePage.notFoundDesc")}
        </p>
        <div className="flex items-center justify-center gap-3">
          {/* "Réessayer" n'a de sens que pour une vraie erreur (réseau, 500…) */}
          {error && (
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t("error.retry")}
            </button>
          )}
          <Link
            to="/discover"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("profilePage.back")}
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------ Données dérivées -------------------------- */
  const age = calculateAge(user.birthdate);
  const locationLabel = formatLocation(user.city, user.country);
  const distanceStr = formatDistance(user.distance, t);
  const currentPhoto = photos[selectedPhotoIndex] || null;
  const displayName = user.username || t("card.anonymous");
  const locale = i18n.language;

  const hasLanguages =
    !!user.languagesSpoken && user.languagesSpoken.length > 0;
  const hasRelationshipTypes =
    !!user.relationshipTypesSought && user.relationshipTypesSought.length > 0;
  const hasPersonalDetails =
    !!user.birthdate ||
    !!user.heightCm ||
    hasLanguages ||
    hasRelationshipTypes ||
    !!user.hasChildren ||
    !!user.wantsChildren;
  const hasInterests =
    (!!user.sexualInterests && user.sexualInterests.length > 0) ||
    !!user.fantasiesText;

  const messageButton = (
    <button
      type="button"
      onClick={() => setIsMessageModalOpen(true)}
      className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <MessageSquare className="w-4 h-4" />
      <span>{t("profilePage.sendMessage")}</span>
    </button>
  );

  const likeButton = (
    <button
      type="button"
      onClick={handleLike}
      disabled={isCheckingLike || hasLiked?.liked || isLiking || !id}
      className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        hasLiked?.liked
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
          : "bg-secondary hover:bg-secondary/80 text-foreground"
      } ${isLiking ? "opacity-70 cursor-not-allowed" : ""}`}
    >
      <Heart
        className={`w-4 h-4 ${hasLiked?.liked ? "fill-destructive text-destructive" : ""}`}
      />
      <span>
        {(() => {
          if (isCheckingLike) return t("loading");
          if (hasLiked?.liked) return t("profilePage.liked");
          return t("profilePage.like");
        })()}
      </span>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-8 space-y-6 animate-fade-in">
      {/* Navigation du haut */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("profilePage.back")}</span>
        </button>

        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>{t("profilePage.activeMember")}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* ------------------------- Colonne gauche : galerie ------------------------- */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-3 md:sticky md:top-6 self-start">
          <div
            className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-muted border border-border/80 shadow-2xl touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {currentPhoto ? (
              // key => remonte l'image à chaque changement et rejoue le fondu
              <Image
                key={currentPhoto}
                isLocal={false}
                url={currentPhoto}
                alt={user.username ?? t("card.member")}
                className="w-full h-full object-cover animate-fade-in"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-muted-foreground">
                <UserIcon className="w-16 h-16 mb-2 opacity-60" />
                <span className="text-sm font-medium">{t("card.noPhoto")}</span>
              </div>
            )}

            {/* Badge distance */}
            {distanceStr && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-zinc-100 border border-white/10 shadow-md">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {distanceStr}
              </span>
            )}

            {/* Compteur de photos */}
            {photoCount > 1 && (
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums bg-black/70 backdrop-blur-md text-zinc-100 border border-white/10 shadow-md">
                {selectedPhotoIndex + 1} / {photoCount}
              </span>
            )}

            {/* Flèches */}
            {photoCount > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t("profilePage.prevPhoto")}
                  onClick={showPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("profilePage.nextPhoto")}
                  onClick={showNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Nom + âge superposés (mobile uniquement) */}
            <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-5 pt-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
                <span>{displayName}</span>
                {age !== null && (
                  <span className="text-xl font-normal text-white/80">
                    {age}
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Miniatures */}
          {photoCount > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={photo + idx}
                  type="button"
                  aria-label={`${idx + 1} / ${photoCount}`}
                  aria-current={idx === selectedPhotoIndex}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    idx === selectedPhotoIndex
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
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

        {/* ------------------------ Colonne droite : infos ------------------------ */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-6">
          {/* En-tête */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {/* Sur mobile, le nom est affiché sur la photo */}
                <h1 className="hidden md:flex text-3xl font-extrabold tracking-tight text-foreground items-baseline gap-3">
                  <span className="truncate">{displayName}</span>
                  {age !== null && (
                    <span className="text-2xl font-normal text-muted-foreground">
                      {age}
                    </span>
                  )}
                </h1>

                {user.title && (
                  <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium md:mt-1">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>{user.title}</span>
                  </div>
                )}

                {locationLabel && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{locationLabel}</span>
                  </div>
                )}
              </div>

              {user.gender && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-secondary text-foreground/80 border border-border shrink-0">
                  {t(`filters.${user.gender}`)}
                </span>
              )}
            </div>

            {/* CTA desktop (sur mobile : barre fixe en bas) */}
            <div className="hidden md:block pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                {messageButton}
                {likeButton}
              </div>
            </div>
          </div>

          {/* À propos */}
          {user.bio && (
            <SectionCard title={t("profilePage.about")}>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line max-w-prose">
                {user.bio}
              </p>
            </SectionCard>
          )}

          {/* Recherche */}
          {user.preferences && (
            <SectionCard title={t("profilePage.lookingFor")}>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {user.preferences.genderPreference && (
                  <InfoTile label={t("profilePage.gender")}>
                    <span className="capitalize">
                      {t(`filters.${user.preferences.genderPreference}`)}
                    </span>
                  </InfoTile>
                )}
                {(user.preferences.ageMin || user.preferences.ageMax) && (
                  <InfoTile label={t("profilePage.ageRange")}>
                    {user.preferences.ageMin || 18} –{" "}
                    {user.preferences.ageMax || t("profilePage.any")}{" "}
                    {t("filters.yrs")}
                  </InfoTile>
                )}
                {user.preferences.maxDistance && (
                  <InfoTile label={t("profilePage.maxDistance")}>
                    {t("profilePage.withinDistance", {
                      distance: user.preferences.maxDistance,
                    })}
                  </InfoTile>
                )}
              </dl>
            </SectionCard>
          )}

          {/* Détails personnels + relation & famille (fusionnés) */}
          {hasPersonalDetails && (
            <SectionCard title={t("profilePage.personalDetails")}>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.birthdate && (
                  <InfoTile icon={Cake} label={t("profilePage.birthdate")}>
                    {formatBirthdate(user.birthdate, locale)}
                  </InfoTile>
                )}
                {user.heightCm && (
                  <InfoTile icon={Ruler} label={t("profilePage.height")}>
                    {formatHeight(user.heightCm)}
                  </InfoTile>
                )}
                {hasRelationshipTypes && (
                  <InfoTile
                    icon={HeartPulse}
                    label={t("profilePage.relationshipTypesSought")}
                    className="sm:col-span-2"
                  >
                    {formatRelationshipTypes(user.relationshipTypesSought, t)}
                  </InfoTile>
                )}
                {user.hasChildren && (
                  <InfoTile icon={Users} label={t("profilePage.hasChildren")}>
                    {formatHasChildren(user.hasChildren, t)}
                  </InfoTile>
                )}
                {user.wantsChildren && (
                  <InfoTile icon={Baby} label={t("profilePage.wantsChildren")}>
                    {formatWantsChildren(user.wantsChildren, t)}
                  </InfoTile>
                )}
                {hasLanguages && (
                  <InfoTile
                    icon={Languages}
                    label={t("profilePage.languages")}
                    className="sm:col-span-2"
                  >
                    <span className="flex flex-wrap gap-1.5 mt-1">
                      {user.languagesSpoken.map((lang: string) => (
                        <Chip key={lang}>{lang}</Chip>
                      ))}
                    </span>
                  </InfoTile>
                )}
              </dl>
            </SectionCard>
          )}

          {/* Centres d'intérêt & fantasmes */}
          {hasInterests && (
            <SectionCard title={t("profilePage.interestsFantasies")}>
              {user.sexualInterests && user.sexualInterests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.sexualInterests.map((interest: string) => (
                    <Chip key={interest} icon={Sparkles}>
                      {t(`sexualInterests.${interest}`)}
                    </Chip>
                  ))}
                </div>
              )}
              {user.fantasiesText && (
                <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                  <span className="text-xs text-muted-foreground block mb-1">
                    {t("profilePage.fantasies")}
                  </span>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line max-w-prose">
                    {user.fantasiesText}
                  </p>
                </div>
              )}
            </SectionCard>
          )}

          {/* Membre depuis (simple ligne discrète, plus de carte dédiée) */}
          {user.createdAt && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                {t("profilePage.joinedAt")}{" "}
                {formatDateTime(user.createdAt, locale)}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Barre d'action fixe (mobile uniquement) */}
      <div className="md:hidden fixed inset-x-0 bottom-14 z-40 border-t border-border bg-background/85 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          {messageButton}
          {likeButton}
        </div>
      </div>

      <MessageModal
        isOpen={isMessageModalOpen}
        onOpenChange={setIsMessageModalOpen}
        onSend={handleSendMessage}
        isPending={isSendingMessage}
        recipientName={displayName}
      />
    </div>
  );
};
