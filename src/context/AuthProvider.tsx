import React, { useState, useEffect, useMemo } from "react";
import Keycloak from "keycloak-js";
import { keycloak } from "@/plugins/keycloak";
import { AuthContext, type AuthContextType } from "./AuthContext";
import Loader from "@/components/ui/Loader";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keycloakInstance, setKeycloakInstance] = useState<Keycloak | null>(
    null,
  );
  const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
    null,
  );

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((auth) => {
        setAuthenticated(auth);
        setKeycloakInstance(keycloak);
        setLoading(false);

        if (auth) {
          keycloak.loadUserInfo().then((info) => {
            setUserInfo(info as Record<string, unknown>);
          });
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
        setLoading(false);
      });

    keycloak.onAuthSuccess = () => {
      setAuthenticated(true);
      keycloak
        .loadUserInfo()
        .then((info) => setUserInfo(info as Record<string, unknown>));
    };

    keycloak.onAuthLogout = () => {
      setAuthenticated(false);
      setUserInfo(null);
    };

    return () => {
      keycloak.onAuthSuccess = null;
      keycloak.onAuthLogout = null;
    };
  }, []);

  const contextValue: AuthContextType = useMemo(
    () => ({
      keycloak: keycloakInstance,
      authenticated,
      loading,
      userInfo,
      login: keycloak.login,
      logout: keycloak.logout,
      token: keycloakInstance?.token,
      refreshToken: () => keycloak.updateToken(70),
    }),
    [authenticated, loading, userInfo, keycloakInstance],
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
