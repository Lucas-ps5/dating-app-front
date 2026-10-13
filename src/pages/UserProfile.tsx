import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  User as UserIcon,
  MessageSquare,
  Compass,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetUserById } from "@/composables/useGetUserById";
import { calculateAge, formatLocation, formatDistance } from "@/utils/discover";
import { Skeleton } from "@/components/ui/skeleton";
import { Image } from "@/components/ui/Image";

export const UserProfilePage: React.FC = () => {
  const { t } = useTranslation("discover");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const { data: user, isLoading, error, refetch } = useGetUserById(id || "");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl bg-zinc-800" />
          <Skeleton className="w-36 h-6 rounded-md bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-3/4 w-full rounded-3xl bg-zinc-800" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded bg-zinc-800" />
            <Skeleton className="h-4 w-32 rounded bg-zinc-800" />
            <Skeleton className="h-24 w-full rounded-xl bg-zinc-800" />
            <Skeleton className="h-10 w-full rounded-xl bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

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
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-zinc-800 text-foreground transition-colors"
          >
            {t("error.retry")}
          </button>
          <Link
            to="/discover"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            {t("profilePage.back")}
          </Link>
        </div>
      </div>
    );
  }

  const age = calculateAge(user.birthdate);
  const location = formatLocation(user.city, user.country);
  const distanceStr = formatDistance(user.distance, t);
  const photos = user.photos && user.photos.length > 0 ? user.photos : [];
  const currentPhoto = photos[selectedPhotoIndex] || null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/discover")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary/80 hover:bg-secondary text-sm font-medium text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("profilePage.back")}</span>
        </button>

        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-zinc-500" />
          <span>{t("profilePage.activeMember")}</span>
        </span>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Photo Gallery */}
        <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-border/80 shadow-2xl">
            {currentPhoto ? (
              <Image
                isLocal={false}
                url={currentPhoto}
                alt={user.username ? `${user.username}'s photo` : t("card.member")}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-850 to-zinc-950 text-zinc-500">
                <UserIcon className="w-16 h-16 text-zinc-600 mb-2" />
                <span className="text-sm font-medium">{t("card.noPhoto")}</span>
              </div>
            )}

            {/* Gallery Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t("profilePage.prevPhoto")}
                  onClick={() =>
                    setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("profilePage.nextPhoto")}
                  onClick={() =>
                    setSelectedPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white transition-all shadow-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Floating Distance Badge */}
            {distanceStr && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-zinc-200 border border-white/10 shadow-md">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {distanceStr}
                </span>
              </div>
            )}
          </div>

          {/* Photo Thumbnails */}
          {photos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === selectedPhotoIndex
                      ? "border-primary scale-105 shadow-md"
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

        {/* Right Column: Profile Info */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-6">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-baseline gap-3">
                  <span>{user.username || t("card.anonymous")}</span>
                  {age !== null && (
                    <span className="text-2xl font-normal text-muted-foreground">{age}</span>
                  )}
                </h1>

                {user.title && (
                  <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium mt-1">
                    <Briefcase className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{user.title}</span>
                  </div>
                )}
              </div>

              {user.gender && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary text-zinc-300 border border-border">
                  {user.gender}
                </span>
              )}
            </div>

            {location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>{location}</span>
                {distanceStr && <span>• {distanceStr}</span>}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/50">
              <button
                type="button"
                onClick={() => navigate(`/chat?userId=${user.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-glow"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t("profilePage.sendMessage")}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/discover")}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium bg-secondary hover:bg-zinc-800 text-foreground transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>{t("profilePage.keepBrowsing")}</span>
              </button>
            </div>
          </div>

          {/* About / Bio Card */}
          {user.bio && (
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t("profilePage.about")}
              </h2>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            </div>
          )}

          {/* Preferences Card */}
          {user.preferences && (
            <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {t("profilePage.lookingFor")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {user.preferences.genderPreference && (
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                    <span className="text-[11px] text-zinc-500 block">{t("profilePage.gender")}</span>
                    <span className="text-xs font-semibold capitalize text-foreground">
                      {user.preferences.genderPreference}
                    </span>
                  </div>
                )}
                {(user.preferences.ageMin || user.preferences.ageMax) && (
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                    <span className="text-[11px] text-zinc-500 block">{t("profilePage.ageRange")}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {user.preferences.ageMin || 18} – {user.preferences.ageMax || t("profilePage.any")}{" "}
                      {t("filters.yrs")}
                    </span>
                  </div>
                )}
                {user.preferences.maxDistance && (
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                    <span className="text-[11px] text-zinc-500 block">{t("profilePage.maxDistance")}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {t("profilePage.withinDistance", { distance: user.preferences.maxDistance })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
