import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Briefcase,
  Cake,
  CalendarDays,
  CircleCheck,
  CircleX,
  Compass,
  MapPin,
  Pencil,
  Sparkles,
  User as UserIcon,
  UserRound,
} from "lucide-react";
import { useFetchCurrentUser } from "@/composables/useFetchCurrentUser";
import { calculateAge, formatLocation } from "@/utils/discover";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileErrorState } from "@/components/profile/ProfileErrorState";
import { ProfilePhotoGallery } from "@/components/profile/ProfilePhotoGallery";
import { cn } from "@/lib/utils";

type IconComponent = React.ComponentType<{ className?: string }>;

interface DetailItemProps {
  icon: IconComponent;
  label: string;
  value: string | null;
  emptyLabel: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon: Icon,
  label,
  value,
  emptyLabel,
}) => {
  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-secondary/60 border border-border/40 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </dt>
        <dd
          className={cn(
            "text-sm font-medium break-words",
            hasValue ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {hasValue ? value : emptyLabel}
        </dd>
      </div>
    </div>
  );
};

const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

const formatBirthdate = (
  value: string | null | undefined,
  locale: string,
): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
};

export const MyProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation("profile");
  const { data: user, isLoading, isError, error, refetch } = useFetchCurrentUser();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !user) {
    return <ProfileErrorState error={error} onRetry={() => refetch()} />;
  }

  const photos = (user.photos ?? []).filter(Boolean);
  const age = calculateAge(user.birthdate);
  const location = formatLocation(user.city, user.country);
  const birthdateLabel = formatBirthdate(user.birthdate, i18n.language);
  const username = user.username || t("empty.username");

  const prefs = user.preferences;
  const prefGender = prefs?.genderPreference?.trim();
  const hasAgeRange =
    prefs?.ageMin !== undefined || prefs?.ageMax !== undefined;
  const hasMaxDistance =
    typeof prefs?.maxDistance === "number" &&
    Number.isFinite(prefs.maxDistance);
  const hasPreferences = Boolean(prefGender || hasAgeRange || hasMaxDistance);

  let ageRangeLabel: string | null = null;
  if (prefs?.ageMin !== undefined && prefs?.ageMax !== undefined) {
    ageRangeLabel = t("preferences.range", {
      min: prefs.ageMin,
      max: prefs.ageMax,
    });
  } else if (prefs?.ageMin !== undefined) {
    ageRangeLabel = t("preferences.from", { min: prefs.ageMin });
  } else if (prefs?.ageMax !== undefined) {
    ageRangeLabel = t("preferences.upTo", { max: prefs.ageMax });
  }

  const prefGenderLabel = prefGender
    ? t(`gender.${prefGender}`, { defaultValue: capitalize(prefGender) })
    : null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Page header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 text-zinc-300 border border-border/60 mb-2">
            <UserIcon className="w-3.5 h-3.5 text-primary" />
            <span>{t("header.badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("header.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {t("header.subtitle")}
          </p>
        </div>

        <Link
          to="/profile/edit"
          aria-label={t("actions.editAria")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-glow self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Pencil className="w-4 h-4" />
          <span>{t("actions.edit")}</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Photo gallery */}
        <section
          aria-label={t("sections.photos")}
          className="md:col-span-6 lg:col-span-5"
        >
          <ProfilePhotoGallery photos={photos} username={user.username} />
        </section>

        {/* Profile information */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col gap-6">
          {/* Identity card */}
          <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground flex items-baseline gap-3 flex-wrap">
                  <span className="break-words">{username}</span>
                  {age !== null && (
                    <span className="text-2xl font-normal text-muted-foreground">
                      {age}
                    </span>
                  )}
                </h2>

                {user.title ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium mt-1">
                    <Briefcase className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="break-words">{user.title}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("empty.title")}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {user.gender && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary text-zinc-300 border border-border">
                    {t(`gender.${user.gender}`)}
                  </span>
                )}
                {typeof user.isActive === "boolean" && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
                      user.isActive
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-destructive/10 text-destructive border-destructive/20",
                    )}
                  >
                    {user.isActive ? (
                      <CircleCheck className="w-3.5 h-3.5" />
                    ) : (
                      <CircleX className="w-3.5 h-3.5" />
                    )}
                    {t(user.isActive ? "status.active" : "status.inactive")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1 border-t border-border/50 mt-1">
              <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
              {location ? (
                <span>{location}</span>
              ) : (
                <span className="text-muted-foreground">
                  {t("empty.location")}
                </span>
              )}
            </div>
          </section>

          {/* About */}
          <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("sections.about")}
            </h2>
            {user.bio ? (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("empty.bio")}
              </p>
            )}
          </section>

          {/* Details */}
          <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t("sections.details")}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem
                icon={Cake}
                label={t("fields.birthdate")}
                value={birthdateLabel}
                emptyLabel={t("empty.birthdate")}
              />
              <DetailItem
                icon={CalendarDays}
                label={t("fields.age")}
                value={age !== null ? String(age) : null}
                emptyLabel={t("empty.birthdate")}
              />
              <DetailItem
                icon={UserRound}
                label={t("fields.gender")}
                value={user.gender ? t(`gender.${user.gender}`) : null}
                emptyLabel={t("empty.gender")}
              />
              <DetailItem
                icon={MapPin}
                label={t("fields.location")}
                value={location}
                emptyLabel={t("empty.location")}
              />
            </dl>
          </section>

          {/* Preferences */}
          {hasPreferences && (
            <section className="p-6 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t("sections.preferences")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ageRangeLabel && (
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                    <span className="text-[11px] text-zinc-500 block">
                      {t("preferences.ageRange")}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {ageRangeLabel}
                    </span>
                  </div>
                )}
                {prefGenderLabel && (
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                    <span className="text-[11px] text-zinc-500 block">
                      {t("preferences.gender")}
                    </span>
                    <span className="text-xs font-semibold text-foreground capitalize">
                      {prefGenderLabel}
                    </span>
                  </div>
                )}
                {hasMaxDistance && prefs?.maxDistance !== undefined && (
                  <div className="p-3 rounded-xl bg-secondary/60 border border-border/40">
                    <span className="text-[11px] text-zinc-500 block">
                      {t("preferences.maxDistance")}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {t("preferences.withinDistance", {
                        distance: prefs.maxDistance,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Secondary action */}
          <div className="flex items-center gap-3">
            <Link
              to="/discover"
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium bg-secondary hover:bg-zinc-800 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Compass className="w-4 h-4" />
              <span>{t("actions.discover")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
