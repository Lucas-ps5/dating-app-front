import { Heart, Mail, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRegister } from "@/composables/useRegister";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { login } = useAuth();

  const { createUser, register, isPending } = useRegister({
    onSuccessAction: () => {
      toast.success("User created successfully!");
      login();
    },
    onErrorAction: () => {
      toast.error("Failed to create user");
    },
  });

  const fields = [
    { key: "username", icon: User, type: "text", placeholder: "Full name" },
    { key: "email", icon: Mail, type: "email", placeholder: "Email" },
    { key: "password", icon: Lock, type: "password", placeholder: "Password" },
    {
      key: "confirm",
      icon: Lock,
      type: "password",
      placeholder: "Confirm password",
    },
  ] as const;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 glow-primary">
            <Heart className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Join Flame</h1>
          <p className="text-muted-foreground mt-1">Create your profile</p>
        </div>

        <form onSubmit={createUser} className="space-y-4">
          {fields.map(({ key, icon: Icon, type, placeholder }) => (
            <div key={key} className="relative">
              <Icon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
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
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => login()}
            className="text-primary font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
