import React, { useState, useEffect, useMemo } from "react";
import Keycloak from "keycloak-js";
// import { keycloak } from "../plugins/keycloak";
import { AuthContext, type AuthContextType } from "./AuthContext";
import Loader from "@/components/ui/Loader";
import { setToken } from "@/plugins/clients";

// Create Keycloak instance directly here to avoid import issues
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let keycloakInitPromise: Promise<boolean> | undefined;

const initializeKeycloak = () => {
  if (!keycloakInitPromise) {
    keycloakInitPromise = keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        redirectUri: window.location.origin + "/",
      })
      .catch((error) => {
        keycloakInitPromise = undefined;
        throw error;
      });
  }

  return keycloakInitPromise;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
    null,
  );
  useEffect(() => {
    keycloak.onAuthSuccess = () => {
      setAuthenticated(true);
      setToken(keycloak.token);
      keycloak
        .loadUserInfo()
        .then((info) => setUserInfo(info as Record<string, unknown>));
    };

    keycloak.onAuthRefreshSuccess = () => {
      setToken(keycloak.token);
    };

    keycloak.onAuthLogout = () => {
      setAuthenticated(false);
      setUserInfo(null);
      setToken(undefined);
    };

    initializeKeycloak()
      .then((auth) => setAuthenticated(auth))
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
      })
      .finally(() => setLoading(false));

    return () => {
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthRefreshSuccess = undefined;
      keycloak.onAuthLogout = undefined;
    };
  }, []);

  const login = async (options?: { redirectUri?: string }) => {
    try {
      await initializeKeycloak();
      await keycloak.login({
        redirectUri: window.location.origin + "/",
        ...options,
      });
    } catch (error) {
      console.error("Keycloak login failed:", error);
    }
  };

  const logout = (options?: { redirectUri?: string }) =>
    keycloak.logout({ redirectUri: window.location.origin + "/", ...options });

  const contextValue: AuthContextType = useMemo(
    () => ({
      keycloak,
      authenticated,
      loading,
      userInfo,
      login,
      logout,
      token: keycloak.token,
      refreshToken: () => keycloak.updateToken(70),
    }),
    [authenticated, loading, userInfo],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen  w-full items-center justify-center bg-background">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
