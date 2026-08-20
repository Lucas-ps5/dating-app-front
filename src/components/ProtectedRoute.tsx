import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, loading, keycloak } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Verify Keycloak connection & token validity on every route navigation
    if (!loading && authenticated && keycloak) {
      setIsVerifying(true);
      keycloak
        .updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            console.log("[AuthGuard] Token refreshed on navigation");
          }
        })
        .catch((err) => {
          console.warn("[AuthGuard] Session expired or invalid on navigation:", err);
          keycloak.login();
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
  }, [location.pathname, loading, authenticated, keycloak]);

  if (loading || isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    // If not authenticated, initiate Keycloak login
    keycloak?.login();
    return null;
  }

  return <>{children}</>;
}
