import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";

/** Delay before showing the "checking session" indicator, to avoid a flash. */
const VERIFYING_INDICATOR_DELAY_MS = 250;

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, loading, keycloak } = useAuth();
  const location = useLocation();
  const [showVerifying, setShowVerifying] = useState(false);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyRunRef = useRef(0);

  useEffect(() => {
    // Verify Keycloak connection & token validity on every route navigation
    if (!loading && authenticated && keycloak) {
      // Identify this check so that a slower previous one cannot reset the
      // state of the current one.
      const runId = ++verifyRunRef.current;

      // Reset any pending indicator from a previous navigation.
      if (indicatorTimerRef.current) {
        clearTimeout(indicatorTimerRef.current);
      }

      // Only reveal the indicator if the check actually takes some time.
      indicatorTimerRef.current = setTimeout(() => {
        if (verifyRunRef.current === runId) setShowVerifying(true);
      }, VERIFYING_INDICATOR_DELAY_MS);

      keycloak
        .updateToken(30)
        .then((refreshed: boolean) => {
          if (refreshed) {
            console.log("[AuthGuard] Token refreshed on navigation");
          }
        })
        .catch((err: unknown) => {
          console.warn(
            "[AuthGuard] Session expired or invalid on navigation:",
            err,
          );
          keycloak.login();
        })
        .finally(() => {
          if (verifyRunRef.current !== runId) return;

          if (indicatorTimerRef.current) {
            clearTimeout(indicatorTimerRef.current);
            indicatorTimerRef.current = null;
          }
          setShowVerifying(false);
        });
    }
  }, [location.pathname, loading, authenticated, keycloak]);

  useEffect(
    () => () => {
      if (indicatorTimerRef.current) {
        clearTimeout(indicatorTimerRef.current);
      }
    },
    [],
  );

  if (loading) {
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

  // The children stay mounted across navigations on purpose: the token check
  // runs in the background, so swapping the whole subtree for a spinner would
  // unmount the layout (and remount every query below it) on each navigation.
  return (
    <>
      {children}
      {showVerifying && (
        <div className="fixed top-3 right-3 z-50 rounded-full border border-border bg-card/90 p-2 shadow-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </>
  );
}
