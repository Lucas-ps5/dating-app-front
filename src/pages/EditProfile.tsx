import { useEffect, useMemo, type FC, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Controller, useForm, type Control, type Path } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Baby,
  Calendar,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Heart,
  ImageIcon,
  Loader2,
  MapPin,
  Power,
  Save,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchCurrentUser } from "@/composables/useFetchCurrentUser";
import { useUpdateProfile } from "@/composables/useUpdateProfile";
import type {
  UpdateUserRequest,
  RelationshipType,
  SexualInterest,
  HasChildren,
  WantsChildren,
  ProfileVisibility,
} from "@/api/users";
import { calculateAge } from "@/utils/discover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileErrorState } from "@/components/profile/ProfileErrorState";
import { cn } from "@/lib/utils";
import type { Gender } from "@/types/enums";
import { Toggle } from "@/components/ui/toggle";

/* ---- Constants for enum options ----
 * `as const satisfies` : on garde les types littÃ©raux (utiles pour yup)
 * tout en vÃ©rifiant la compatibilitÃ© avec les types de l'API.
 */
const GENDER_PREFERENCE_OPTIONS = [
  { value: "male", labelKey: "edit.gender.male" },
  { value: "female", labelKey: "edit.gender.female" },
] as const satisfies ReadonlyArray<{
  value: "male" | "female";
  labelKey: string;
}>;

const RELATIONSHIP_TYPE_OPTIONS = [
  {
    value: "DISCREET_RELATIONSHIP",
    labelKey: "edit.relationshipTypes.discreetRelationship",
  },
  {
    value: "ENHANCED_FRIENDSHIP",
    labelKey: "edit.relationshipTypes.enhancedFriendship",
  },
  { value: "ONE_ON_ONE_SEX", labelKey: "edit.relationshipTypes.oneOnOneSex" },
  {
    value: "ONE_NIGHT_STAND",
    labelKey: "edit.relationshipTypes.oneNightStand",
  },
  { value: "EXPERIMENTING", labelKey: "edit.relationshipTypes.experimenting" },
  {
    value: "EROTIC_FANTASIES",
    labelKey: "edit.relationshipTypes.eroticFantasies",
  },
] as const satisfies ReadonlyArray<{
  value: RelationshipType;
  labelKey: string;
}>;

const SEXUAL_INTEREST_OPTIONS = [
  { value: "ROLEPLAY", labelKey: "edit.sexualInterests.roleplay" },
  { value: "BDSM", labelKey: "edit.sexualInterests.bdsm" },
  { value: "SENSORY_PLAY", labelKey: "edit.sexualInterests.sensoryPlay" },
  {
    value: "VOYEURISM_EXHIBITIONISM",
    labelKey: "edit.sexualInterests.voyeurismExhibitionism",
  },
  { value: "SWINGING", labelKey: "edit.sexualInterests.swinging" },
  {
    value: "GROUP_EXPERIENCES",
    labelKey: "edit.sexualInterests.groupExperiences",
  },
  { value: "TANTRA", labelKey: "edit.sexualInterests.tantra" },
  { value: "POWER_EXCHANGE", labelKey: "edit.sexualInterests.powerExchange" },
  { value: "OTHER", labelKey: "edit.sexualInterests.other" },
] as const satisfies ReadonlyArray<{ value: SexualInterest; labelKey: string }>;

const HAS_CHILDREN_OPTIONS = [
  { value: "NO", labelKey: "edit.hasChildren.no" },
  { value: "YES_LIVING_WITH_ME", labelKey: "edit.hasChildren.yesLivingWithMe" },
  {
    value: "YES_NOT_LIVING_WITH_ME",
    labelKey: "edit.hasChildren.yesNotLivingWithMe",
  },
  { value: "PREFER_NOT_TO_SAY", labelKey: "edit.hasChildren.preferNotToSay" },
] as const satisfies ReadonlyArray<{ value: HasChildren; labelKey: string }>;

const WANTS_CHILDREN_OPTIONS = [
  { value: "YES", labelKey: "edit.wantsChildren.yes" },
  { value: "NO", labelKey: "edit.wantsChildren.no" },
  { value: "MAYBE", labelKey: "edit.wantsChildren.maybe" },
  { value: "PREFER_NOT_TO_SAY", labelKey: "edit.wantsChildren.preferNotToSay" },
] as const satisfies ReadonlyArray<{ value: WantsChildren; labelKey: string }>;

const PROFILE_VISIBILITY_OPTIONS = [
  { value: "PUBLIC", labelKey: "edit.visibility.public" },
  { value: "MATCHES_ONLY", labelKey: "edit.visibility.matchesOnly" },
  { value: "HIDDEN", labelKey: "edit.visibility.hidden" },
] as const satisfies ReadonlyArray<{
  value: ProfileVisibility;
  labelKey: string;
}>;

const BIO_MAX = 500;
const FANTASIES_MAX = 2000;

/* ---- Helpers de validation ---- */
const optionValues = <T extends string>(
  opts: ReadonlyArray<{ value: T }>,
): T[] => opts.map((o) => o.value);

/** Nombre optionnel : "" / NaN / null -> undefined */
const optionalNumber = (
  min: number,
  max: number,
  minMsg?: string,
  maxMsg?: string,
) =>
  yup
    .number()
    .transform((value, original) =>
      original === "" || original == null || Number.isNaN(value)
        ? undefined
        : value,
    )
    .integer()
    .min(min, minMsg)
    .max(max, maxMsg)
    .optional();

const enumArray = <T extends string>(opts: ReadonlyArray<{ value: T }>) =>
  yup
    .array()
    .of(yup.mixed<T>().oneOf(optionValues(opts)).required())
    .defined();

const enumField = <T extends string>(opts: ReadonlyArray<{ value: T }>) =>
  yup.mixed<T>().oneOf(optionValues(opts)).optional();


/** "fr, en  de" -> ["fr", "en", "de"] */
const parseList = (v: unknown): string[] =>
  Array.isArray(v)
    ? (v as string[])
    : typeof v === "string"
      ? v
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      : [];

const parseLines = (v: string): string[] =>
  v
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

/* ---- Validation schema ---- */
const editProfileSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required("edit.validation.usernameRequired")
    .min(3, "edit.validation.usernameMin")
    .max(20, "edit.validation.usernameMax")
    .matches(/^[a-zA-Z0-9_-]+$/, "edit.validation.usernamePattern"),
  title: yup.string().trim().max(255, "edit.validation.titleMax").defined(),
  bio: yup.string().trim().max(BIO_MAX, "edit.validation.bioMax").defined(),
  birthdate: yup
    .string()
    .defined()
    .test("valid-date", "edit.validation.birthdateInvalid", (value) =>
      !value ? true : !Number.isNaN(new Date(value).getTime()),
    )
    .test("min-age", "edit.validation.birthdateMinAge", (value) => {
      if (!value) return true;
      const age = calculateAge(value);
      return age === null ? true : age >= 18;
    }),
  heightCm: optionalNumber(
    120,
    250,
    "edit.validation.heightMin",
    "edit.validation.heightMax",
  ),
  languagesSpoken: yup
    .array()
    .of(yup.string().defined())
    .defined()
    .test("iso", "edit.validation.languagesInvalid", (arr) =>
      arr.every((l) => /^[a-z]{2}$/.test(l)),
    ),
  gender: yup.mixed<"male" | "female">().oneOf(["male", "female"]).optional(),
  city: yup.string().trim().max(100, "edit.validation.cityMax").defined(),
  country: yup.string().trim().max(100, "edit.validation.countryMax").defined(),
  isActive: yup.boolean().defined(),
  preferences: yup
    .object({
      ageMin: optionalNumber(18, 100),
      ageMax: optionalNumber(18, 100).when("ageMin", ([min], schema) =>
        min ? schema.min(min, "edit.validation.ageRange") : schema,
      ),
      genderPreference: enumField(GENDER_PREFERENCE_OPTIONS),
      maxDistance: optionalNumber(0, 100000),
      heightMinCm: optionalNumber(120, 250),
      heightMaxCm: optionalNumber(120, 250).when(
        "heightMinCm",
        ([min], schema) =>
          min ? schema.min(min, "edit.validation.heightRange") : schema,
      ),
    })
    .defined(),
  relationshipTypesSought: enumArray(RELATIONSHIP_TYPE_OPTIONS),
  sexualInterests: enumArray(SEXUAL_INTEREST_OPTIONS),
  fantasiesText: yup
    .string()
    .max(FANTASIES_MAX, "edit.validation.fantasiesMax")
    .defined(),
  hasChildren: enumField(HAS_CHILDREN_OPTIONS),
  wantsChildren: enumField(WANTS_CHILDREN_OPTIONS),
  relationshipTypesSoughtVisibility: enumField(PROFILE_VISIBILITY_OPTIONS),
  sexualInterestsVisibility: enumField(PROFILE_VISIBILITY_OPTIONS),
  fantasiesTextVisibility: enumField(PROFILE_VISIBILITY_OPTIONS),
  hasChildrenVisibility: enumField(PROFILE_VISIBILITY_OPTIONS),
  wantsChildrenVisibility: enumField(PROFILE_VISIBILITY_OPTIONS),
});

type EditProfileForm = yup.InferType<typeof editProfileSchema>;

type Option = { readonly value: string; readonly labelKey: string };

const inputClass =
  "bg-background/60 border-border transition-colors focus-visible:ring-primary/50 focus-visible:border-primary/60";

/* ---- Sous-composants ---- */
const FieldError: FC<{ field: string; message?: string }> = ({
  field,
  message,
}) => {
  const { t } = useTranslation("profile");
  if (!message) return null;
  return (
    <p
      id={`${field}-error`}
      role="alert"
      className="text-xs text-destructive mt-1 px-1"
    >
      {t(message)}
    </p>
  );
};

/** Carte de section : icÃ´ne + titre + description, contenu en dessous. */
const Section: FC<{
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}> = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm flex flex-col gap-5">
    <header className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold leading-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </header>
    {children}
  </section>
);

/** Wrapper label + contrÃ´le + erreur (Ã©vite la rÃ©pÃ©tition). */
const Field: FC<{
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  aside?: ReactNode;
  small?: boolean;
  children: ReactNode;
}> = ({ id, label, optional, error, hint, aside, small, children }) => {
  const { t } = useTranslation("profile");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label
          htmlFor={id}
          className={cn("text-muted-foreground", small ? "text-xs" : "text-sm")}
        >
          {label}
          {optional && (
            <span className="ml-2 text-[11px] text-muted-foreground/70">
              {t("edit.form.optional")}
            </span>
          )}
        </Label>
        {aside}
      </div>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground/80 px-1">{hint}</p>
      )}
      <FieldError field={id} message={error} />
    </div>
  );
};

const CharCounter: FC<{ current: number; max: number }> = ({
  current,
  max,
}) => (
  <span
    className={cn(
      "text-[11px] tabular-nums text-muted-foreground/70",
      current > max && "text-destructive",
      current > max * 0.9 && current <= max && "text-amber-500",
    )}
    aria-live="polite"
  >
    {current}/{max}
  </span>
);

/** Groupe de "chips" : checkboxes (multiple) ou radios (choix unique). */
const ChipGroup: FC<{
  control: Control<EditProfileForm>;
  name: Path<EditProfileForm>;
  options: ReadonlyArray<Option>;
  multiple?: boolean;
  ariaLabel?: string;
  onValueChange?: (value: string) => void;
}> = ({
  control,
  name,
  options,
  multiple = false,
  ariaLabel,
  onValueChange,
}) => {
    const { t } = useTranslation("profile");
    return (
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const current = field.value as string | string[] | undefined;
          const isSelected = (v: string) =>
            multiple
              ? Array.isArray(current) && current.includes(v)
              : current === v;
          const select = (v: string) => {
            if (!multiple) {
              field.onChange(v);
              onValueChange?.(v);
              return;
            }
            const list = Array.isArray(current) ? current : [];
            field.onChange(
              list.includes(v) ? list.filter((x) => x !== v) : [...list, v],
            );
          };
          return (
            <div
              role={multiple ? "group" : "radiogroup"}
              aria-label={ariaLabel}
              className="flex flex-wrap gap-2"
            >
              {options.map(({ value, labelKey }) => (
                <label
                  key={value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border py-2.5 px-3.5 text-sm font-medium transition-all duration-200 select-none cursor-pointer",
                    "bg-background/60 text-muted-foreground border-border",
                    "hover:border-primary/50 hover:text-foreground active:scale-[0.97]",
                    "focus-within:ring-2 focus-within:ring-primary/50",
                    isSelected(value) &&
                    "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(350_80%_60%/0.2)]",
                  )}
                >
                  <input
                    type={multiple ? "checkbox" : "radio"}
                    name={name}
                    value={value}
                    checked={isSelected(value)}
                    onChange={() => select(value)}
                    onBlur={field.onBlur}
                    className="sr-only"
                  />
                  {t(labelKey)}
                </label>
              ))}
            </div>
          );
        }}
      />
    );
  };

/** Radix Select interdit value="" : on utilise une valeur sentinelle. */
const NONE = "__none__";

const SelectField: FC<{
  control: Control<EditProfileForm>;
  name: Path<EditProfileForm>;
  labelKey: string;
  options: ReadonlyArray<Option>;
  optional?: boolean;
  placeholderKey?: string;
}> = ({ control, name, labelKey, options, optional, placeholderKey }) => {
  const { t } = useTranslation("profile");
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {t(labelKey)}
            {optional && (
              <span className="ml-2 text-[11px] text-muted-foreground/70">
                {t("edit.form.optional")}
              </span>
            )}
          </Label>
          <Select
            value={(field.value as string | undefined) || NONE}
            onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
          >
            <SelectTrigger
              onBlur={field.onBlur}
              aria-invalid={Boolean(fieldState.error)}
              className={cn(
                inputClass,
                fieldState.error && "border-destructive",
              )}
            >
              <SelectValue
                placeholder={t(placeholderKey ?? "edit.form.selectPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                {t("edit.form.preferNotToSay")}
              </SelectItem>
              {options.map(({ value, labelKey: optLabelKey }) => (
                <SelectItem key={value} value={value}>
                  {t(optLabelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError field={name} message={fieldState.error?.message} />
        </div>
      )}
    />
  );
};

/** SÃ©lecteur de visibilitÃ© sous forme de cartes avec icÃ´ne + description. */
const VISIBILITY_META: Record<
  ProfileVisibility,
  { icon: LucideIcon; descKey: string; fallback: string }
> = {
  PUBLIC: {
    icon: Globe,
    descKey: "edit.visibility.publicDesc",
    fallback: "Visible par tous les membres",
  },
  MATCHES_ONLY: {
    icon: Users,
    descKey: "edit.visibility.matchesOnlyDesc",
    fallback: "Visible uniquement par vos matchs",
  },
  HIDDEN: {
    icon: EyeOff,
    descKey: "edit.visibility.hiddenDesc",
    fallback: "Visible uniquement par vous",
  },
};

const VisibilityPicker: FC<{
  control: Control<EditProfileForm>;
  onValueChange: (v: ProfileVisibility) => void;
}> = ({ control, onValueChange }) => {
  const { t } = useTranslation("profile");
  return (
    <Controller
      control={control}
      name="relationshipTypesSoughtVisibility"
      render={({ field }) => (
        <div
          role="radiogroup"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {PROFILE_VISIBILITY_OPTIONS.map(({ value, labelKey }) => {
            const { icon: Icon, descKey, fallback } = VISIBILITY_META[value];
            const selected = field.value === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer flex-col gap-1.5 rounded-2xl border p-3.5 transition-all duration-200",
                  "bg-background/60 border-border hover:border-primary/50",
                  "focus-within:ring-2 focus-within:ring-primary/50",
                  selected &&
                  "border-primary bg-primary/10 shadow-[0_0_12px_hsl(350_80%_60%/0.15)]",
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={value}
                  checked={selected}
                  onChange={() => {
                    field.onChange(value);
                    onValueChange(value);
                  }}
                  onBlur={field.onBlur}
                  className="sr-only"
                />
                <Icon
                  className={cn(
                    "h-4 w-4",
                    selected ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-sm font-semibold",
                    selected ? "text-primary" : "text-foreground",
                  )}
                >
                  {t(labelKey)}
                </span>
                <span className="text-[11px] leading-snug text-muted-foreground">
                  {t(descKey, { defaultValue: fallback })}
                </span>
              </label>
            );
          })}
        </div>
      )}
    />
  );
};

/** Textarea "une URL par ligne" avec aperÃ§u. Garde le texte brut en local pour ne pas perdre les retours Ã  la ligne. */

export const EditProfilePage: FC = () => {
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchCurrentUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<EditProfileForm>({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      username: "",
      title: "",
      bio: "",
      birthdate: "",
      heightCm: undefined,
      languagesSpoken: [],
      gender: undefined,
      city: "",
      country: "",
      isActive: true,
      preferences: {
        ageMin: undefined,
        ageMax: undefined,
        genderPreference: undefined,
        maxDistance: undefined,
        heightMinCm: undefined,
        heightMaxCm: undefined,
      },
      relationshipTypesSought: [],
      sexualInterests: [],
      fantasiesText: "",
      hasChildren: undefined,
      wantsChildren: undefined,
      relationshipTypesSoughtVisibility: undefined,
      sexualInterestsVisibility: undefined,
      fantasiesTextVisibility: undefined,
      hasChildrenVisibility: undefined,
      wantsChildrenVisibility: undefined,
    },
    mode: "onTouched",
  });

  const values = watch();
  const isActive = values.isActive;
  const bioLength = values.bio?.length ?? 0;
  const fantasiesLength = values.fantasiesText?.length ?? 0;
  const languages = Array.isArray(values.languagesSpoken)
    ? values.languagesSpoken
    : [];

  /** ComplÃ©tion du profil (indicateur motivant en haut de page). */
  const completion = useMemo(() => {
    const checks = [
      Boolean(values.title),
      Boolean(values.bio),
      Boolean(values.birthdate),
      Boolean(values.heightCm),
      languages.length > 0,
      Boolean(values.city),
      Boolean(values.country),
      (values.relationshipTypesSought?.length ?? 0) > 0,
      (values.sexualInterests?.length ?? 0) > 0,
      Boolean(values.hasChildren),
      Boolean(values.wantsChildren),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [values, languages.length]);

  useEffect(() => {
    if (!user) return;
    reset({
      username: user.username ?? "",
      title: user.title ?? "",
      bio: user.bio ?? "",
      birthdate: user.birthdate ? user.birthdate.slice(0, 10) : "",
      heightCm: user.heightCm ?? undefined,
      languagesSpoken: user.languagesSpoken ?? [],
      gender:
        user.gender === "male" || user.gender === "female"
          ? user.gender
          : undefined,
      city: user.city ?? "",
      country: user.country ?? "",
      isActive: user.isActive ?? true,
      preferences: {
        ageMin: user.preferences?.ageMin ?? undefined,
        ageMax: user.preferences?.ageMax ?? undefined,
        genderPreference:
          (user.preferences?.genderPreference as Gender) ?? undefined,
        maxDistance: user.preferences?.maxDistance ?? undefined,
        heightMinCm: user.preferences?.heightMinCm ?? undefined,
        heightMaxCm: user.preferences?.heightMaxCm ?? undefined,
      },
      relationshipTypesSought: user.relationshipTypesSought ?? [],
      sexualInterests: user.sexualInterests ?? [],
      fantasiesText: user.fantasiesText ?? "",
      hasChildren: user.hasChildren ?? undefined,
      wantsChildren: user.wantsChildren ?? undefined,
      relationshipTypesSoughtVisibility:
        user.relationshipTypesSoughtVisibility ?? undefined,
      sexualInterestsVisibility: user.sexualInterestsVisibility ?? undefined,
      fantasiesTextVisibility: user.fantasiesTextVisibility ?? undefined,
      hasChildrenVisibility: user.hasChildrenVisibility ?? undefined,
      wantsChildrenVisibility: user.wantsChildrenVisibility ?? undefined,
    });
  }, [user, reset]);

  // Avertit l'utilisateur s'il quitte la page avec des modifications non enregistrÃ©es.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const { updateProfile, isPending } = useUpdateProfile({
    id: user?.id ?? "",
    onSuccessAction: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success(t("edit.success"));
      navigate("/profile");
    },
    onErrorAction: (err) => {
      toast.error(t("edit.error"));
      console.error("Profile update error:", err);
    },
  });

  const onSubmit = handleSubmit(
    (formValues) => {
      const payload: UpdateUserRequest = {
        username: formValues.username,
        title: formValues.title,
        bio: formValues.bio,
        birthdate: formValues.birthdate || undefined,
        heightCm: formValues.heightCm,
        languagesSpoken:
          formValues.languagesSpoken.length > 0
            ? formValues.languagesSpoken
            : undefined,
        gender: formValues.gender,
        city: formValues.city,
        country: formValues.country,
        isActive: formValues.isActive,
        preferences: {
          ageMin: formValues.preferences.ageMin,
          ageMax: formValues.preferences.ageMax,
          genderPreference: formValues.preferences.genderPreference,
          maxDistance: formValues.preferences.maxDistance,
          heightMinCm: formValues.preferences.heightMinCm,
          heightMaxCm: formValues.preferences.heightMaxCm,
        },
        relationshipTypesSought:
          formValues.relationshipTypesSought.length > 0
            ? formValues.relationshipTypesSought
            : undefined,
        sexualInterests:
          formValues.sexualInterests.length > 0
            ? formValues.sexualInterests
            : undefined,
        fantasiesText: formValues.fantasiesText || undefined,
        hasChildren: formValues.hasChildren,
        wantsChildren: formValues.wantsChildren,
        relationshipTypesSoughtVisibility:
          formValues.relationshipTypesSoughtVisibility,
        sexualInterestsVisibility: "PUBLIC",
        fantasiesTextVisibility: "PUBLIC",
        hasChildrenVisibility: "PUBLIC",
        wantsChildrenVisibility: "PUBLIC",
      };

      updateProfile(payload);
    },
    () => {
      toast.error(
        t("edit.invalid"),
      );
    },
  );

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  const maxBirthdate = new Date(
    new Date().setFullYear(new Date().getFullYear() - 18),
  )
    .toISOString()
    .split("T")[0];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-0 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>{t("actions.backToProfile")}</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t("edit.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("edit.subtitle")}
          </p>
        </div>

        {/* ComplÃ©tion du profil */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t("edit.completion.label")}
            </span>
            <span className="tabular-nums font-semibold text-primary">
              {completion}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {/* ---- IdentitÃ© ---- */}
        <Section
          icon={User}
          title={t("sections.identity")}
          description={t("sections.identityDesc")}
        >
          <Field
            id="username"
            label={t("edit.form.username")}
            error={errors.username?.message}
          >
            <Input
              id="username"
              type="text"
              autoComplete="username"
              placeholder={t("edit.form.usernamePlaceholder")}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
              className={inputClass}
              {...register("username")}
            />
          </Field>

          <Field
            id="title"
            label={t("edit.form.title")}
            optional
            error={errors.title?.message}
          >
            <Input
              id="title"
              type="text"
              placeholder={t("edit.form.titlePlaceholder")}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
              className={inputClass}
              {...register("title")}
            />
          </Field>

          <Field
            id="bio"
            label={t("edit.form.bio")}
            optional
            error={errors.bio?.message}
            aside={<CharCounter current={bioLength} max={BIO_MAX} />}
          >
            <Textarea
              id="bio"
              rows={5}
              placeholder={t("edit.form.bioPlaceholder")}
              aria-invalid={Boolean(errors.bio)}
              aria-describedby={errors.bio ? "bio-error" : undefined}
              className={cn(inputClass, "min-h-28 resize-y")}
              {...register("bio")}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="birthdate"
              label={t("edit.form.birthdate")}
              optional
              error={errors.birthdate?.message}
            >
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="birthdate"
                  type="date"
                  max={maxBirthdate}
                  aria-invalid={Boolean(errors.birthdate)}
                  aria-describedby={
                    errors.birthdate ? "birthdate-error" : undefined
                  }
                  className={cn(inputClass, "pl-10 cursor-pointer")}
                  {...register("birthdate")}
                />
              </div>
            </Field>

            <Field
              id="heightCm"
              label={t("edit.form.height")}
              optional
              error={errors.heightCm?.message}
            >
              <Input
                id="heightCm"
                type="number"
                inputMode="numeric"
                min={120}
                max={250}
                placeholder={t("edit.form.heightPlaceholder")}
                aria-invalid={Boolean(errors.heightCm)}
                aria-describedby={
                  errors.heightCm ? "heightCm-error" : undefined
                }
                className={inputClass}
                {...register("heightCm", { valueAsNumber: true })}
              />
            </Field>
          </div>

          {/* Gender (lecture seule) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm text-muted-foreground">
              {t("edit.form.gender")}
            </Label>
            <div
              aria-readonly="true"
              className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/30 text-sm text-foreground/80 cursor-not-allowed"
            >
              {user.gender === "male" && t("edit.gender.male")}
              {user.gender === "female" && t("edit.gender.female")}
              {!user.gender && t("edit.form.preferNotToSay")}
            </div>
          </div>

          <Field
            id="languagesSpoken"
            label={t("edit.form.languagesSpoken")}
            optional
            error={errors.languagesSpoken?.message}
          >
            <Input
              id="languagesSpoken"
              type="text"
              placeholder={t("edit.form.languagesSpacedPlaceholder")}
              aria-invalid={Boolean(errors.languagesSpoken)}
              aria-describedby={
                errors.languagesSpoken ? "languagesSpoken-error" : undefined
              }
              className={inputClass}
              {...register("languagesSpoken", { setValueAs: parseList })}
            />
            {languages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {languages.map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </Field>
        </Section>

        {/* ---- Localisation ---- */}
        <Section
          icon={MapPin}
          title={t("sections.location")}
          description={t("sections.locationDesc")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              id="city"
              label={t("edit.form.city")}
              optional
              error={errors.city?.message}
            >
              <Input
                id="city"
                type="text"
                readOnly
                autoComplete="address-level2"
                placeholder={t("edit.form.cityPlaceholder")}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "city-error" : undefined}
                className={inputClass}
                {...register("city")}
              />
            </Field>

            <Field
              id="country"
              label={t("edit.form.country")}
              optional
              error={errors.country?.message}
            >
              <Input
                id="country"
                type="text"
                readOnly
                autoComplete="country-name"
                placeholder={t("edit.form.countryPlaceholder")}
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? "country-error" : undefined}
                className={inputClass}
                {...register("country")}
              />
            </Field>
          </div>
        </Section>

        {/* ---- PrÃ©fÃ©rences de recherche ---- */}
        <Section
          icon={SlidersHorizontal}
          title={t("sections.preferences")}
          description={t("sections.preferencesDesc")}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="preferences.ageMin"
              label={t("edit.form.ageMin")}
              optional
              small
              error={errors.preferences?.ageMin?.message}
            >
              <Input
                id="preferences.ageMin"
                type="number"
                inputMode="numeric"
                min={18}
                max={100}
                placeholder={t("edit.form.ageMinPlaceholder")}
                aria-invalid={Boolean(errors.preferences?.ageMin)}
                aria-describedby={
                  errors.preferences?.ageMin
                    ? "preferences.ageMin-error"
                    : undefined
                }
                className={cn(inputClass, "text-left")}
                {...register("preferences.ageMin", { valueAsNumber: true })}
              />
            </Field>

            <Field
              id="preferences.ageMax"
              label={t("edit.form.ageMax")}
              optional
              small
              error={errors.preferences?.ageMax?.message}
            >
              <Input
                id="preferences.ageMax"
                type="number"
                inputMode="numeric"
                min={18}
                max={100}
                placeholder={t("edit.form.ageMaxPlaceholder")}
                aria-invalid={Boolean(errors.preferences?.ageMax)}
                aria-describedby={
                  errors.preferences?.ageMax
                    ? "preferences.ageMax-error"
                    : undefined
                }
                className={cn(inputClass, "text-left")}
                {...register("preferences.ageMax", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField
              control={control}
              name="preferences.genderPreference"
              labelKey="edit.form.genderPreference"
              options={GENDER_PREFERENCE_OPTIONS}
              optional
              placeholderKey="edit.form.selectGenderPreference"
            />

            <Field
              id="preferences.maxDistance"
              label={t("edit.form.maxDistance")}
              optional
              small
              error={errors.preferences?.maxDistance?.message}
            >
              <Input
                id="preferences.maxDistance"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t("edit.form.maxDistancePlaceholder")}
                aria-invalid={Boolean(errors.preferences?.maxDistance)}
                aria-describedby={
                  errors.preferences?.maxDistance
                    ? "preferences.maxDistance-error"
                    : undefined
                }
                className={inputClass}
                {...register("preferences.maxDistance", {
                  valueAsNumber: true,
                })}
              />
            </Field>
          </div>
        </Section>

        {/* ---- Relations recherchÃ©es ---- */}
        <Section
          icon={Heart}
          title={t("sections.relationshipTypes")}
          description={t("sections.relationshipTypesDesc")}
        >
          <ChipGroup
            control={control}
            name="relationshipTypesSought"
            options={RELATIONSHIP_TYPE_OPTIONS}
            ariaLabel={t("sections.relationshipTypes")}
            multiple
          />
          <FieldError
            field="relationshipTypesSought"
            message={errors.relationshipTypesSought?.message}
          />
        </Section>

        {/* ---- IntÃ©rÃªts & fantasmes ---- */}
        <Section
          icon={Flame}
          title={t("sections.sexualInterests")}
          description={t("sections.sexualInterestsDesc")}
        >
          <ChipGroup
            control={control}
            name="sexualInterests"
            options={SEXUAL_INTEREST_OPTIONS}
            ariaLabel={t("sections.sexualInterests")}
            multiple
          />
          <FieldError
            field="sexualInterests"
            message={errors.sexualInterests?.message}
          />

          <Field
            id="fantasiesText"
            label={t("edit.form.fantasiesText")}
            optional
            error={errors.fantasiesText?.message}
            aside={
              <CharCounter current={fantasiesLength} max={FANTASIES_MAX} />
            }
          >
            <Textarea
              id="fantasiesText"
              rows={4}
              placeholder={t("edit.form.fantasiesTextPlaceholder")}
              aria-invalid={Boolean(errors.fantasiesText)}
              aria-describedby={
                errors.fantasiesText ? "fantasiesText-error" : undefined
              }
              className={cn(inputClass, "min-h-20 resize-y")}
              {...register("fantasiesText")}
            />
          </Field>
        </Section>

        {/* ---- Enfants ---- */}
        <Section
          icon={Baby}
          title={t("sections.family")}
          description={t("sections.familyDesc")}
        >
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-medium text-foreground">
              {t("sections.hasChildren")}
            </span>
            <ChipGroup
              control={control}
              name="hasChildren"
              options={HAS_CHILDREN_OPTIONS}
              ariaLabel={t("sections.hasChildren")}
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-medium text-foreground">
              {t("sections.wantsChildren")}
            </span>
            <ChipGroup
              control={control}
              name="wantsChildren"
              options={WANTS_CHILDREN_OPTIONS}
              ariaLabel={t("sections.wantsChildren")}
            />
          </div>
        </Section>

        {/* ---- VisibilitÃ© ----
        <Section
          icon={Eye}
          title={t("sections.profileVisibility")}
          description={t("sections.profileVisibilityDesc")}
        >
          <VisibilityPicker
            control={control}
            onValueChange={() => {}}
          />
        </Section> */}

        {/* ---- Statut du compte ---- */}
        <Section
          icon={Power}
          title={t("edit.form.isActive")}
          description={t("sections.accountDesc")}
        >
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-sm font-semibold",
                  isActive === false ? "text-destructive" : "text-foreground",
                )}
              >
                {isActive === false
                  ? t("edit.form.inactive")
                  : t("edit.form.active")}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isActive === false
                  ? t("edit.form.inactiveHint", {
                    defaultValue: "Votre profil est masque.",
                  })
                  : t("edit.form.activeHint", {
                    defaultValue: "Votre profil est visible.",
                  })}
              </span>
            </div>
            <Toggle
              checked={isActive !== false}
              label={t("edit.form.isActive")}
              onChange={(v) => setValue("isActive", v, { shouldDirty: true })}
            />
          </div>
        </Section>

        {/* ---- Barre d'actions collante ---- */}
        <div
          className={cn(
            "sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 mt-2 px-4 sm:px-6 lg:px-8 py-3",
            "border-t border-border/60 bg-background/80 backdrop-blur-md",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className={cn(
                "hidden sm:flex items-center gap-2 text-xs transition-opacity",
                isDirty ? "opacity-100 text-muted-foreground" : "opacity-0",
              )}
              aria-live="polite"
            >
              <span
                className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                aria-hidden
              />
              {t("edit.unsaved", {
                defaultValue: "Modifications non enregistrÃ©es",
              })}
            </p>

            <div className="flex w-full sm:w-auto items-stretch gap-3">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("edit.cancel")}
              </button>

              <button
                type="submit"
                disabled={isPending || !isDirty}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-glow active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("edit.saving")}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t("edit.save")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
