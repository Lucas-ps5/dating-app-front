import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchCurrentUser } from "@/composables/useFetchCurrentUser";
import { useUpdateProfile } from "@/composables/useUpdateProfile";
import type { UpdateUserRequest } from "@/api/users";
import { calculateAge } from "@/utils/discover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileErrorState } from "@/components/profile/ProfileErrorState";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/ImageUpload";

const editProfileSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required("edit.validation.usernameRequired")
    .min(3, "edit.validation.usernameMin")
    .max(20, "edit.validation.usernameMax")
    .matches(/^[a-zA-Z0-9_-]+$/, "edit.validation.usernamePattern"),
  title: yup.string().trim().max(255, "edit.validation.titleMax").defined(),
  bio: yup.string().trim().max(500, "edit.validation.bioMax").defined(),
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
  gender: yup.string().oneOf(["male", "female", ""]).notRequired(),
  city: yup.string().trim().max(100, "edit.validation.cityMax").defined(),
  country: yup.string().trim().max(100, "edit.validation.countryMax").defined(),
});

type EditProfileForm = yup.InferType<typeof editProfileSchema>;

const GENDER_OPTIONS = [
  { value: "male", labelKey: "edit.gender.male" },
  { value: "female", labelKey: "edit.gender.female" },
  { value: "", labelKey: "edit.form.preferNotToSay" },
] as const;

const FieldError: React.FC<{ field: string; message?: string }> = ({
  field,
  message,
}) => {
  const { t } = useTranslation("profile");
  if (!message) return null;
  return (
    <p id={`${field}-error`} role="alert" className="text-xs text-destructive mt-1 px-1">
      {t(message)}
    </p>
  );
};

export const EditProfilePage: React.FC = () => {
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError, error, refetch } = useFetchCurrentUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditProfileForm>({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
      username: "",
      title: "",
      bio: "",
      birthdate: "",
      gender: "",
      city: "",
      country: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!user) return;
    reset({
      username: user.username ?? "",
      title: user.title ?? "",
      bio: user.bio ?? "",
      birthdate: user.birthdate ? user.birthdate.slice(0, 10) : "",
      gender: user.gender ?? "",
      city: user.city ?? "",
      country: user.country ?? "",
    });
  }, [user, reset]);

  const { updateProfile, isPending } = useUpdateProfile({
    id: user?.id ?? "",
    onSuccessAction: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success(t("edit.success"));
      navigate("/profile");
    },
    onErrorAction: () => {
      toast.error(t("edit.error"));
    },
  });

  const selectedGender = watch("gender");

  const onSubmit = handleSubmit((values) => {
    const payload: UpdateUserRequest = {
      username: values.username,
      title: values.title,
      bio: values.bio,
      city: values.city,
      country: values.country,
    };

    if (values.birthdate) {
      payload.birthdate = values.birthdate;
    }
    if (values.gender === "male" || values.gender === "female") {
      payload.gender = values.gender;
    }

    updateProfile(payload);
  });

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

  const inputClass = "bg-card border-border focus-visible:ring-primary/50";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
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
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm flex flex-col gap-6"
      >
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username" className="text-sm text-muted-foreground">
            {t("edit.form.username")}
          </Label>
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
          <FieldError field="username" message={errors.username?.message} />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title" className="text-sm text-muted-foreground">
            {t("edit.form.title")}
            <span className="ml-2 text-[11px] text-zinc-500">
              {t("edit.form.optional")}
            </span>
          </Label>
          <Input
            id="title"
            type="text"
            placeholder={t("edit.form.titlePlaceholder")}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={inputClass}
            {...register("title")}
          />
          <FieldError field="title" message={errors.title?.message} />
        </div>

        {/* Biography */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio" className="text-sm text-muted-foreground">
            {t("edit.form.bio")}
            <span className="ml-2 text-[11px] text-zinc-500">
              {t("edit.form.optional")}
            </span>
          </Label>
          <Textarea
            id="bio"
            rows={5}
            placeholder={t("edit.form.bioPlaceholder")}
            aria-invalid={Boolean(errors.bio)}
            aria-describedby={errors.bio ? "bio-error" : undefined}
            className={cn(inputClass, "min-h-28 resize-y")}
            {...register("bio")}
          />
          <FieldError field="bio" message={errors.bio?.message} />
        </div>

        {/* Image upload */}
        <ImageUpload
          context="avatar"
          onImageUploaded={(url, response) => {
            // Store the uploaded URL somewhere, e.g., in form state
            console.log("Image uploaded, URL:", url);
            console.log("Full response:", response);
            // You could set it in a form field or state variable here
          }}
        />

        {/* Birthdate */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="birthdate" className="text-sm text-muted-foreground">
            {t("edit.form.birthdate")}
            <span className="ml-2 text-[11px] text-zinc-500">
              {t("edit.form.optional")}
            </span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              id="birthdate"
              type="date"
              max={maxBirthdate}
              aria-invalid={Boolean(errors.birthdate)}
              aria-describedby={errors.birthdate ? "birthdate-error" : undefined}
              className={cn(inputClass, "pl-10 cursor-pointer")}
              {...register("birthdate")}
            />
          </div>
          <FieldError field="birthdate" message={errors.birthdate?.message} />
        </div>

        {/* Gender */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted-foreground mb-1">
            {t("edit.form.gender")}
          </legend>
          <RadioGroup
            value={selectedGender ?? ""}
            onValueChange={(value) =>
              setValue("gender", value as EditProfileForm["gender"], {
                shouldValidate: true,
              })
            }
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {GENDER_OPTIONS.map(({ value, labelKey }) => {
              const isSelected = (selectedGender ?? "") === value;
              return (
                <div key={labelKey} className="relative">
                  <RadioGroupItem
                    value={value}
                    id={`gender-${value || "none"}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`gender-${value || "none"}`}
                    className={cn(
                      "flex items-center justify-center cursor-pointer rounded-xl border py-3 px-3 text-sm font-medium transition-all duration-200 select-none",
                      "bg-card text-muted-foreground border-border",
                      "hover:border-primary/50 hover:text-foreground",
                      isSelected &&
                        "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(350_80%_60%/0.2)]",
                    )}
                  >
                    {t(labelKey)}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </fieldset>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city" className="text-sm text-muted-foreground">
              {t("edit.form.city")}
              <span className="ml-2 text-[11px] text-zinc-500">
                {t("edit.form.optional")}
              </span>
            </Label>
            <Input
              id="city"
              type="text"
              autoComplete="address-level2"
              placeholder={t("edit.form.cityPlaceholder")}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "city-error" : undefined}
              className={inputClass}
              {...register("city")}
            />
            <FieldError field="city" message={errors.city?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country" className="text-sm text-muted-foreground">
              {t("edit.form.country")}
              <span className="ml-2 text-[11px] text-zinc-500">
                {t("edit.form.optional")}
              </span>
            </Label>
            <Input
              id="country"
              type="text"
              autoComplete="country-name"
              placeholder={t("edit.form.countryPlaceholder")}
              aria-invalid={Boolean(errors.country)}
              aria-describedby={errors.country ? "country-error" : undefined}
              className={inputClass}
              {...register("country")}
            />
            <FieldError field="country" message={errors.country?.message} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-secondary hover:bg-zinc-800 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("edit.cancel")}
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-glow disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      </form>
    </div>
  );
};

export default EditProfilePage;
