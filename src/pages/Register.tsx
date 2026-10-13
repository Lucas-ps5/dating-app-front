import { Heart, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRegister, type RegisterForm } from "@/composables/useRegister";
import { useAuth } from "@/hooks/useAuth";
import { Gender } from "@/api/users";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS = [
  {
    value: Gender.MALE,
    label: "Male",
    emoji: "♂",
  },
  {
    value: Gender.FEMALE,
    label: "Female",
    emoji: "♀",
  },
] as const;

export default function RegisterPage() {
  const { t } = useTranslation("register");
  const { login } = useAuth();

  const { createUser, register, setValue, watch, isPending } = useRegister({
    onSuccessAction: () => {
      toast.success(t("success"));
      login();
    },
    onErrorAction: () => {
      toast.error(t("error"));
    },
  });

  const selectedGender = watch("gender");

  const textFields: {
    key: keyof RegisterForm;
    icon: React.ComponentType<{ className?: string }>;
    type: string;
    placeholder: string;
  }[] = [
    { key: "username", icon: User, type: "text", placeholder: t("form.name") },
    { key: "email", icon: Mail, type: "email", placeholder: t("form.email") },
    { key: "password", icon: Lock, type: "password", placeholder: t("form.password") },
    { key: "confirm", icon: Lock, type: "password", placeholder: t("form.confirm") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow-primary">
            <Heart className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>

        <form onSubmit={createUser} className="space-y-4">
          {/* Text inputs */}
          {textFields.map(({ key, icon: Icon, type, placeholder }) => (
            <div key={key} className="relative">
              <Icon className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
              <input
                {...register(key)}
                name={key}
                type={type}
                placeholder={placeholder}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ))}

          {/* Gender selector — shadcn RadioGroup */}
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("submit")
            )}
          </button>
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