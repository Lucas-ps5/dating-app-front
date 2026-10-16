import type { User } from "@/api/users";

/**
 * Format a birthdate string to a localized long date format.
 */
export const formatBirthdate = (
  value: string | null | undefined,
  locale: string,
): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
};

/**
 * Format a datetime string to a localized medium date + short time format.
 */
export const formatDateTime = (
  value: string | null | undefined,
  locale: string,
): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

/**
 * Format height in centimeters.
 */
export const formatHeight = (heightCm: number | null | undefined): string | null => {
  if (!heightCm) return null;
  return `${heightCm} cm`;
};

/**
 * Format relationship types array to localized string.
 */
export const formatRelationshipTypes = (
  types: Array<string> | undefined,
  t: (key: string, options?: any) => string,
): string | null => {
  if (!types || types.length === 0) return null;
  return types.map((type) => t(`relationshipTypes.${type}`)).join(", ");
};

/**
 * Format sexual interests array to localized string.
 */
export const formatSexualInterests = (
  interests: Array<string> | undefined,
  t: (key: string, options?: any) => string,
): string | null => {
  if (!interests || interests.length === 0) return null;
  return interests.map((interest) => t(`sexualInterests.${interest}`, { defaultValue: interest })).join(", ");
};

/**
 * Format hasChildren enum to localized string.
 */
export const formatHasChildren = (
  value: string | null | undefined,
  t: (key: string, options?: any) => string,
): string | null => {
  if (!value) return null;
  return t(`hasChildren.${value}`, { defaultValue: value });
};

/**
 * Format wantsChildren enum to localized string.
 */
export const formatWantsChildren = (
  value: string | null | undefined,
  t: (key: string, options?: any) => string,
): string | null => {
  if (!value) return null;
  return t(`wantsChildren.${value}`, { defaultValue: value });
};

/**
 * Format profile visibility enum to localized string.
 */
export const formatProfileVisibility = (
  value: string | null | undefined,
  t: (key: string, options?: any) => string,
): string | null => {
  if (!value) return null;
  return t(`profileVisibility.${value}`, { defaultValue: value });
};

/**
 * Build the profile completion checklist from user data.
 */
export interface CompletionChecklistItem {
  done: boolean;
  label: string;
}

export const buildProfileCompletionChecklist = (
  user: User,
  photos: string[],
  hasPreferences: boolean,
  t: (key: string, options?: any) => string,
): CompletionChecklistItem[] => [
  {
    done: photos.length > 0,
    label: t("completion.photo", { defaultValue: "Ajouter une photo" }),
  },
  {
    done: Boolean(user.bio?.trim()),
    label: t("completion.bio", { defaultValue: "Écrire une bio" }),
  },
  {
    done: Boolean(user.title?.trim()),
    label: t("completion.jobTitle", { defaultValue: "Indiquer votre métier" }),
  },
  {
    done: Boolean(user.city || user.country),
    label: t("completion.location", { defaultValue: "Ajouter votre ville" }),
  },
  {
    done: hasPreferences,
    label: t("completion.preferences", { defaultValue: "Définir vos préférences" }),
  },
  {
    done: Boolean(user.heightCm),
    label: t("completion.height", { defaultValue: "Ajouter votre taille" }),
  },
  {
    done: Boolean(user.languagesSpoken && user.languagesSpoken.length > 0),
    label: t("completion.languages", { defaultValue: "Ajouter vos langues" }),
  },
  {
    done: Boolean(user.relationshipTypesSought && user.relationshipTypesSought.length > 0),
    label: t("completion.relationshipTypes", { defaultValue: "Définir vos types de relations" }),
  },
  {
    done: Boolean(user.hasChildren || user.wantsChildren),
    label: t("completion.family", { defaultValue: "Informations familiales" }),
  },
];

/**
 * Calculate profile completion percentage from checklist.
 */
export const calculateProfileCompletionPercent = (checklist: CompletionChecklistItem[]): number => {
  const missing = checklist.filter((i) => !i.done).length;
  return Math.round(((checklist.length - missing) / checklist.length) * 100);
};