import { useState } from "react";
import {
  Heart,
  Mail,
  Lock,
  User,
  Loader2,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronLeft,
  LocateFixed,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  useRegister,
  type RegisterForm,
  step1Schema,
} from "@/composables/useRegister";
import { useAuth } from "@/hooks/useAuth";
import { Gender } from "@/api/users";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  { value: Gender.MALE, label: "Male", emoji: "♂" },
  { value: Gender.FEMALE, label: "Female", emoji: "♀" },
] as const;

function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2].map((s) => (
        <div
          key={s}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            s === current
              ? "w-6 bg-primary"
              : s < current
                ? "w-2 bg-primary/60"
                : "w-2 bg-border",
          )}
        />
      ))}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1 px-1">{message}</p>;
}

export default function RegisterPage() {
  const { t } = useTranslation("register");
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [geoLoading, setGeoLoading] = useState(false);

  const { form, createUser, isPending } = useRegister({
    onSuccessAction: () => {
      toast.success(t("success"));
      login();
    },
    onErrorAction: () => {
      toast.error(t("error"));
    },
  });

  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const selectedGender = watch("gender");

  // Advance to step 2 only after step-1 fields pass validation
  const handleNext = async () => {
    const step1Fields: (keyof RegisterForm)[] = [
      "username",
      "email",
      "password",
      "confirm",
    ];
    const valid = await trigger(step1Fields);
    const values = form.getValues();
    try {
      await step1Schema.validate(
        {
          username: values.username,
          email: values.email,
          password: values.password,
          confirm: values.confirm,
        },
        { abortEarly: false },
      );
    } catch {
      /* errors already surfaced via trigger() */
    }
    if (valid) setStep(2);
  };

  // Geolocation auto-fill
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("latitude", parseFloat(coords.latitude.toFixed(6)), {
          shouldValidate: true,
        });
        setValue("longitude", parseFloat(coords.longitude.toFixed(6)), {
          shouldValidate: true,
        });
        setGeoLoading(false);
        toast.success("Location detected!");
      },
      () => {
        toast.error("Could not retrieve your location.");
        setGeoLoading(false);
      },
    );
  };

  const inputClass =
    "w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow-primary">
            <Heart className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <StepDots current={step} />

        <form onSubmit={createUser} className="space-y-4">
          {/* ─── STEP 1: Account details ──────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                Account details
              </p>

              <div>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input
                    {...register("username")}
                    type="text"
                    placeholder={t("form.name")}
                    className={inputClass}
                  />
                </div>
                <FieldError message={errors.username?.message} />
              </div>

              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder={t("form.email")}
                    className={inputClass}
                  />
                </div>
                <FieldError message={errors.email?.message} />
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input
                    {...register("password")}
                    type="password"
                    placeholder={t("form.password")}
                    className={inputClass}
                  />
                </div>
                <FieldError message={errors.password?.message} />
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                  <input
                    {...register("confirm")}
                    type="password"
                    placeholder={t("form.confirm")}
                    className={inputClass}
                  />
                </div>
                <FieldError message={errors.confirm?.message} />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ─── STEP 2: About you ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                About you
              </p>

              {/* Gender */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground px-1">
                  {t("form.gender", { defaultValue: "I am a…" })}
                </p>
                <RadioGroup
                  value={selectedGender}
                  onValueChange={(val) =>
                    setValue("gender", val, { shouldValidate: true })
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  {GENDER_OPTIONS.map(({ value, label, emoji }) => {
                    const isSelected = selectedGender === value;
                    return (
                      <div key={value} className="relative">
                        <RadioGroupItem
                          value={value}
                          id={`gender-${value}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`gender-${value}`}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xl border py-4 px-3 transition-all duration-200 select-none",
                            "bg-card text-muted-foreground border-border",
                            "hover:border-primary/50 hover:text-foreground hover:bg-card/80",
                            isSelected &&
                              "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(350_80%_60%/0.2)]",
                          )}
                        >
                          <span
                            className={cn(
                              "text-2xl transition-transform duration-200",
                              isSelected && "scale-110",
                            )}
                          >
                            {emoji}
                          </span>
                          <span className="text-sm font-semibold">{label}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
                <FieldError message={errors.gender?.message} />
              </div>

              {/* Date of birth */}
              <div>
                <p className="text-sm font-medium text-muted-foreground px-1 mb-1">
                  Date of birth
                </p>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                    {...register("dateOfBirth")}
                    type="date"
                    max={new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18),
                    )
                      .toISOString()
                      .split("T")[0]}
                    className={cn(inputClass, "cursor-pointer")}
                  />
                </div>
                <FieldError message={errors.dateOfBirth?.message} />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("location")}
                  </p>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {geoLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LocateFixed className="w-3.5 h-3.5" />
                    )}
                    {t("useMyLocation")}
                  </button>
                </div>

                {/* Coordinate values are captured & validated here, but kept hidden
                    from the user. A map picker or place search could replace this section later. */}
                <input
                  type="hidden"
                  {...register("latitude", { valueAsNumber: true })}
                />
                <input
                  type="hidden"
                  {...register("longitude", { valueAsNumber: true })}
                />

                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border py-2 px-3",
                    watch("latitude") && watch("longitude")
                      ? "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  <MapPin
                    className={cn(
                      "w-4 h-4",
                      watch("latitude") && watch("longitude")
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm">
                    {watch("latitude") && watch("longitude")
                      ? t("locationCaptured")
                      : t("addLocation")}
                  </span>
                </div>

                <FieldError
                  message={
                    errors.latitude?.message ?? errors.longitude?.message
                  }
                />
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-none py-3 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center gap-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t("submit")
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          {t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => login()}
            className="text-primary font-medium hover:underline"
          >
            {t("signIn")}
          </button>
        </p>
      </div>
    </div>
  );
}