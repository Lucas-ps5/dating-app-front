import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Baby,
  Briefcase,
  Cake,
  Calendar,
  CircleCheck,
  CircleX,
  Clock,
  Compass,
  Globe,
  EyeOff,
  Heart,
  HeartPulse,
  Languages,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Shield,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useFetchCurrentUser } from "@/composables/useFetchCurrentUser";
import { calculateAge, formatLocation } from "@/utils/discover";
import {
  buildProfileCompletionChecklist,
  calculateProfileCompletionPercent,
  formatBirthdate,
  formatDateTime,
  formatHasChildren,
  formatHeight,
  formatProfileVisibility,
  formatRelationshipTypes,
  formatWantsChildren,
} from "@/utils/profile";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileErrorState } from "@/components/profile/ProfileErrorState";
import { ProfilePhotoGallery } from "@/components/profile/ProfilePhotoGallery";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Petits composants                                                         */
/* -------------------------------------------------------------------------- */

interface SectionTitleProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, icon: Icon, className }) => (
  <h2
    className={cn(
      "flex items-center gap-2 text-base font-semibold tracking-tight text-foreground",
      className,
    )}
  >
    {Icon && (
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    )}
    {children}
  </h2>
);

/** Carte standard : même bordure / arrondi / padding partout. */
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}> = ({ children, className, ariaLabel }) => (
  <section
    aria-label={ariaLabel}
    className={cn(
      "rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm flex flex-col gap-4",
      className,
    )}
  >
    {children}
  </section>
);

/** Pastille réutilisable (préférences, langues, intérêts…). */
const Chip: React.FC<{
  icon: LucideIcon;
  children: React.ReactNode;
  srLabel?: string;
}> = ({ icon: Icon, children, srLabel }) => (
  <li className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-3.5 py-1.5 text-sm transition-colors hover:border-primary/40">
    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
    {srLabel && <span className="sr-only">{srLabel} :</span>}
    <span className="font-medium">{children}</span>
  </li>
);

interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string | null;
  emptyLabel: string;
  trailing?: React.ReactNode;
}

/** Ligne label / valeur séparée par un filet. */
const DetailRow: React.FC<DetailRowProps> = ({ icon: Icon, label, value, emptyLabel, trailing }) => {
  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
        {label}
      </dt>
      <dd
        className={cn(
          "flex items-center gap-2 text-right text-sm break-words",
          hasValue ? "font-medium text-foreground" : "italic text-muted-foreground/70",
        )}
      >
        {trailing}
        {hasValue ? value : emptyLabel}
      </dd>
    </div>
  );
};

const DetailList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dl className="-my-1 divide-y divide-border/50">{children}</dl>
);

/** Jauge de complétion : n'apparaît que tant que le profil n'est pas complet. */
const ProfileCompletion: React.FC<{ percent: number; missing: string[]; title: string }> = ({
  percent,
  missing,
  title,
}) => (
  <section
    aria-label={title}
    className="flex flex-col gap-4 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 p-5"
  >
    <div className="flex items-baseline justify-between gap-4">
      <SectionTitle icon={Sparkles}>{title}</SectionTitle>
      <span className="text-sm font-semibold tabular-nums text-primary">{percent}%</span>
    </div>

    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 w-full overflow-hidden rounded-full bg-secondary"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>

    <ul className="flex flex-wrap gap-2">
      {missing.map((label) => (
        <li key={label}>
          <Link
            to="/profile/edit"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

/** Badge compact (genre, statut…). */
const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
      className,
    )}
  >
    {children}
  </span>
);

/** Texte long (bio, fantasmes) avec lecture confortable. */
const Prose: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="max-w-prose whitespace-pre-line text-[15px] leading-7 text-foreground/90">{children}</p>
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const hasNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

const VISIBILITY_ICONS: Record<string, LucideIcon> = {
  PUBLIC: Globe,
  MATCHES_ONLY: Users,
  HIDDEN: EyeOff,
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export const MyProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation("profile");
  const { data: user, isLoading, isError, error, refetch } = useFetchCurrentUser();
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (user?.photos) {
      setPhotos(user.photos);
    }
  }, [user?.photos]);

  /* Visibilité : regroupée si tous les champs partagent le même réglage. */
  const visibilityEntries = useMemo(() => {
    if (!user) return [];
    return [
      { key: "relationshipTypesSoughtVisibility", value: user.relationshipTypesSoughtVisibility },
      { key: "sexualInterestsVisibility", value: user.sexualInterestsVisibility },
      { key: "fantasiesTextVisibility", value: user.fantasiesTextVisibility },
      { key: "hasChildrenVisibility", value: user.hasChildrenVisibility },
      { key: "wantsChildrenVisibility", value: user.wantsChildrenVisibility },
    ].filter((e): e is { key: string; value: NonNullable<typeof e.value> } => Boolean(e.value));
  }, [user]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !user) {
    return <ProfileErrorState error={error} onRetry={() => refetch()} />;
  }

  const age = calculateAge(user.birthdate);
  const location = formatLocation(user.city, user.country);
  const birthdateLabel = formatBirthdate(user.birthdate, i18n.language);
  const username = user.username || t("empty.username");
  const genderLabel = user.gender ? t(`gender.${user.gender}`) : null;
  const heightLabel = formatHeight(user.heightCm);

  /* ---- Préférences de recherche ---- */
  const prefs = user.preferences;
  const prefGender = prefs?.genderPreference?.trim();
  const hasAgeMin = hasNumber(prefs?.ageMin);
  const hasAgeMax = hasNumber(prefs?.ageMax);
  const hasMaxDistance = hasNumber(prefs?.maxDistance);
  const hasPreferences = Boolean(prefGender || hasAgeMin || hasAgeMax || hasMaxDistance);

  let ageRangeLabel: string | null = null;
  if (hasAgeMin && hasAgeMax) {
    ageRangeLabel = t("preferences.range", { min: prefs?.ageMin, max: prefs?.ageMax });
  } else if (hasAgeMin) {
    ageRangeLabel = t("preferences.from", { min: prefs?.ageMin });
  } else if (hasAgeMax) {
    ageRangeLabel = t("preferences.upTo", { max: prefs?.ageMax });
  }

  const prefGenderLabel = prefGender
    ? t(`gender.${prefGender}`, { defaultValue: capitalize(prefGender) })
    : null;

  /* ---- Sections conditionnelles ---- */
  const hasLanguages = Boolean(user.languagesSpoken && user.languagesSpoken.length > 0);
  const hasRelationshipTypes = Boolean(
    user.relationshipTypesSought && user.relationshipTypesSought.length > 0,
  );
  const hasRelationshipFamily =
    hasRelationshipTypes || Boolean(user.hasChildren) || Boolean(user.wantsChildren);
  const hasInterests = Boolean(user.sexualInterests && user.sexualInterests.length > 0);
  const hasInterestsOrFantasies = hasInterests || Boolean(user.fantasiesText);

  const allSameVisibility =
    visibilityEntries.length > 1 && new Set(visibilityEntries.map((e) => e.value)).size === 1;

  /* ---- Complétion du profil ---- */
  const checklist = buildProfileCompletionChecklist(user, photos, hasPreferences, t);
  const missing = checklist.filter((i) => !i.done).map((i) => i.label);
  const percent = calculateProfileCompletionPercent(checklist);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10 animate-fade-in">
      {/* En-tête de page */}
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("header.title")}
          </h1>
          <p className="mt-0.5 max-w-md text-sm text-muted-foreground">{t("header.subtitle")}</p>
        </div>

        <Link
          to="/profile/edit"
          aria-label={t("actions.editAria")}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-glow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          <span>{t("actions.edit")}</span>
        </Link>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        {/* ------------------------- Colonne photos ------------------------- */}
        <section
          aria-label={t("sections.photos")}
          className="flex flex-col gap-4 lg:sticky lg:top-6 lg:col-span-5"
        >
          <div className="overflow-hidden rounded-3xl border border-border/70 shadow-lg shadow-black/20">
            <ProfilePhotoGallery photos={photos} username={user.username} />
          </div>

          <ImageUpload
            context="avatar"
            onImageUploaded={(url) => {
              // Mise à jour fonctionnelle : évite d'utiliser un état périmé.
              setPhotos((prev) => [...prev, url]);
            }}
          />
        </section>

        {/* ----------------------- Colonne informations ---------------------- */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Identité — pas de carte : la typographie porte la hiérarchie */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {genderLabel && (
                <Badge className="border-border bg-secondary text-foreground/80">{genderLabel}</Badge>
              )}
              {typeof user.isActive === "boolean" && (
                <Badge
                  className={
                    user.isActive
                      ? "border-success/25 bg-success/10 text-success"
                      : "border-destructive/25 bg-destructive/10 text-destructive"
                  }
                >
                  {user.isActive ? (
                    <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <CircleX className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {t(user.isActive ? "status.active" : "status.inactive")}
                </Badge>
              )}
              {heightLabel && (
                <Badge className="border-border bg-secondary text-foreground/80">
                  <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                  {heightLabel}
                </Badge>
              )}
            </div>

            <h2 className="flex flex-wrap items-baseline gap-x-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              <span className="break-words">{username}</span>
              {age !== null && (
                <span className="text-3xl font-light tabular-nums text-muted-foreground sm:text-4xl">
                  {age}
                </span>
              )}
            </h2>

            <div className="flex flex-col gap-1.5 text-sm">
              <p className="flex items-center gap-2 text-foreground/80">
                <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                {user.title ? (
                  <span className="break-words">{user.title}</span>
                ) : (
                  <span className="italic text-muted-foreground/70">{t("empty.title")}</span>
                )}
              </p>
              <p className="flex items-center gap-2 text-foreground/80">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                {location ? (
                  <span>{location}</span>
                ) : (
                  <span className="italic text-muted-foreground/70">{t("empty.location")}</span>
                )}
              </p>
            </div>
          </section>

          {/* Complétion (visible seulement si le profil est incomplet) */}
          {missing.length > 0 && (
            <ProfileCompletion
              percent={percent}
              missing={missing}
              title={t("completion.heading", { defaultValue: "Complétez votre profil" })}
            />
          )}

          {/* À propos */}
          <Card ariaLabel={t("sections.about")}>
            <SectionTitle icon={UserRound}>{t("sections.about")}</SectionTitle>
            {user.bio ? (
              <Prose>{user.bio}</Prose>
            ) : (
              <Link
                to="/profile/edit"
                className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm italic text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("empty.bio")}
              </Link>
            )}
          </Card>

          {/* Détails (la taille n'apparaît plus en double) */}
          <Card ariaLabel={t("sections.details")}>
            <SectionTitle icon={Cake}>{t("sections.details")}</SectionTitle>
            <DetailList>
              <DetailRow
                icon={Cake}
                label={t("fields.birthdate")}
                value={birthdateLabel}
                emptyLabel={t("empty.birthdate")}
              />
              <DetailRow
                icon={UserRound}
                label={t("fields.gender")}
                value={genderLabel}
                emptyLabel={t("empty.gender")}
              />
              <DetailRow
                icon={MapPin}
                label={t("fields.location")}
                value={location}
                emptyLabel={t("empty.location")}
              />
              <DetailRow
                icon={Ruler}
                label={t("fields.height")}
                value={heightLabel}
                emptyLabel={t("empty.height")}
              />
            </DetailList>
          </Card>

          {/* Langues */}
          {hasLanguages && (
            <Card ariaLabel={t("sections.languages")}>
              <SectionTitle icon={Languages}>{t("sections.languages")}</SectionTitle>
              <ul className="flex flex-wrap gap-2">
                {user.languagesSpoken?.map((lang) => (
                  <Chip key={lang} icon={Languages}>
                    <span className="uppercase">{lang}</span>
                  </Chip>
                ))}
              </ul>
            </Card>
          )}

          {/* Préférences de recherche */}
          {hasPreferences && (
            <Card ariaLabel={t("sections.preferences")}>
              <SectionTitle icon={Heart}>{t("sections.preferences")}</SectionTitle>
              <ul className="flex flex-wrap gap-2.5">
                {prefGenderLabel && (
                  <Chip icon={Heart} srLabel={t("preferences.gender")}>
                    <span className="capitalize">{prefGenderLabel}</span>
                  </Chip>
                )}
                {ageRangeLabel && (
                  <Chip icon={Cake} srLabel={t("preferences.ageRange")}>
                    {ageRangeLabel}
                  </Chip>
                )}
                {hasMaxDistance && (
                  <Chip icon={Ruler} srLabel={t("preferences.maxDistance")}>
                    {t("preferences.withinDistance", { distance: prefs?.maxDistance })}
                  </Chip>
                )}
              </ul>
            </Card>
          )}

          {/* Relations & famille */}
          {hasRelationshipFamily && (
            <Card ariaLabel={t("sections.relationshipFamily")}>
              <SectionTitle icon={HeartPulse}>{t("sections.relationshipFamily")}</SectionTitle>
              <DetailList>
                {hasRelationshipTypes && (
                  <DetailRow
                    icon={HeartPulse}
                    label={t("fields.relationshipTypesSought")}
                    value={formatRelationshipTypes(user.relationshipTypesSought ?? [], t)}
                    emptyLabel={t("empty.relationshipTypesSought")}
                  />
                )}
                {user.hasChildren && (
                  <DetailRow
                    icon={Users}
                    label={t("fields.hasChildren")}
                    value={formatHasChildren(user.hasChildren, t)}
                    emptyLabel={t("empty.hasChildren")}
                  />
                )}
                {user.wantsChildren && (
                  <DetailRow
                    icon={Baby}
                    label={t("fields.wantsChildren")}
                    value={formatWantsChildren(user.wantsChildren, t)}
                    emptyLabel={t("empty.wantsChildren")}
                  />
                )}
              </DetailList>
            </Card>
          )}

          {/* Centres d'intérêt & fantasmes */}
          {hasInterestsOrFantasies && (
            <Card ariaLabel={t("sections.interestsFantasies")}>
              <SectionTitle icon={Sparkles}>{t("sections.interestsFantasies")}</SectionTitle>
              {hasInterests && (
                <ul className="flex flex-wrap gap-2">
                  {user.sexualInterests?.map((interest) => (
                    <Chip key={interest} icon={Sparkles}>
                      <span className="capitalize">
                        {t(`sexualInterests.${interest}`, { defaultValue: interest })}
                      </span>
                    </Chip>
                  ))}
                </ul>
              )}
              {user.fantasiesText && <Prose>{user.fantasiesText}</Prose>}
            </Card>
          )}

          {/* Visibilité du profil */}
          {visibilityEntries.length > 0 && (
            <Card ariaLabel={t("sections.profileVisibility")}>
              <SectionTitle icon={Shield}>{t("sections.profileVisibility")}</SectionTitle>
              {allSameVisibility ? (
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4">
                  {(() => {
                    const value = visibilityEntries[0].value;
                    const Icon = VISIBILITY_ICONS[value] ?? Lock;
                    return (
                      <>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {formatProfileVisibility(value, t)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t("visibility.appliesToAll", {
                              defaultValue: "Appliqué à toutes vos informations sensibles",
                            })}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <DetailList>
                  {visibilityEntries.map(({ key, value }) => {
                    const Icon = VISIBILITY_ICONS[value] ?? Lock;
                    return (
                      <DetailRow
                        key={key}
                        icon={Lock}
                        label={t(`fields.${key}`)}
                        value={formatProfileVisibility(value, t)}
                        emptyLabel={t("empty.profileVisibility")}
                        trailing={<Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                      />
                    );
                  })}
                </DetailList>
              )}
            </Card>
          )}

          {/* Informations du compte — volontairement discret */}
          <section
            aria-label={t("sections.accountInfo")}
            className="rounded-3xl border border-border/50 bg-muted/40 px-5 py-4"
          >
            <SectionTitle icon={Clock}>
              {t("sections.accountInfo")}
            </SectionTitle>
            <dl className="mt-2 divide-y divide-border/50">
              <DetailRow
                icon={Calendar}
                label={t("fields.createdAt")}
                value={formatDateTime(user.createdAt, i18n.language)}
                emptyLabel={t("empty.createdAt")}
              />
              <DetailRow
                icon={Clock}
                label={t("fields.updatedAt")}
                value={formatDateTime(user.updatedAt, i18n.language)}
                emptyLabel={t("empty.updatedAt")}
              />
            </dl>
          </section>

          {/* Action secondaire */}
          <div>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>{t("actions.discover")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;