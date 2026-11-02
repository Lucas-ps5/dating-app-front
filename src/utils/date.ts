/**
 * Date utilities: day boundaries, day comparisons and human-readable date labels.
 */

/** Milliseconds in a day. */
export const DAY_MS = 86_400_000;

/** Timestamp (ms) of an ISO string, 0 when absent or invalid. */
export const toTime = (value?: string | null): number =>
  value ? new Date(value).getTime() : 0;

/** Timestamp (ms) of the start of the local day of the given date. */
export const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** True when both ISO strings fall on the same calendar day. */
export const isSameDay = (a?: string | null, b?: string | null): boolean =>
  !!a && !!b && new Date(a).toDateString() === new Date(b).toDateString();

/** Whole days between today and the given ISO string (0 = today, 1 = yesterday). */
export const daysSince = (iso: string | Date): number => {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return 0;
  return Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
};

/** Localized time (HH:mm). */
export const formatTime = (
  iso: string | null | undefined,
  locale: string,
): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Long day label used as a separator in the message list:
 * - today / yesterday → the provided labels
 * - otherwise → "weekday, day month (year)"
 */
export const formatDayLabel = (
  iso: string,
  locale: string,
  labels: { today: string; yesterday: string },
): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = daysSince(date);
  if (diff === 0) return labels.today;
  if (diff === 1) return labels.yesterday;
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
};

/**
 * Ancienneté de la dernière présence, en relatif.
 * Retourne "" si la date est absente, invalide ou de moins d'une minute
 * (le libellé « à l'instant » est géré à part).
 */
export const formatLastSeen = (
  iso: string | null | undefined,
  locale: string,
): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (abs < 60_000) return "";
  if (abs < 3_600_000)
    return rtf.format(-Math.round(diffMs / 60_000), "minute");
  if (abs < DAY_MS) return rtf.format(-Math.round(diffMs / 3_600_000), "hour");
  if (abs < 7 * DAY_MS) return rtf.format(-Math.round(diffMs / DAY_MS), "day");

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
  });
};

/** Latest date allowed for a date-of-birth field, given a minimum age. */
export const getMaxBirthdate = (minAge: number = 18): string =>
  new Date(new Date().setFullYear(new Date().getFullYear() - minAge))
    .toISOString()
    .split("T")[0];
