import Keycloak from "keycloak-js";
import { setToken } from "@/plugins/clients";

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

const scheduleTokenRefresh = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  if (!keycloak.tokenParsed?.exp) return;

  const expiresIn = keycloak.tokenParsed.exp * 1000 - Date.now();
  // Refresh 1 minute before expiry, or at least 5 seconds before
  const refreshIn = Math.max(expiresIn - 60000, 5000);

  if (expiresIn <= 5000) {
    console.warn("Token already expired or too close to expiry");
    return;
  }

  refreshTimeout = setTimeout(async () => {
    try {
      const refreshed = await keycloak.updateToken(70);
      if (refreshed) {
        console.log("Token refreshed successfully");
        setToken(keycloak.token);
      }
      scheduleTokenRefresh();
    } catch (err) {
      console.error("Failed to refresh token", err);
      // Optional: force logout or handle session end
    }
  }, refreshIn);
};

const providerInstance = {
  async init(): Promise<boolean> {
    const authenticated = await keycloak.init({
      pkceMethod: "S256",
      onLoad: "check-sso",
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      redirectUri: "http://localhost:5173/",
    });

    if (authenticated) {
      setToken(keycloak.token);
      scheduleTokenRefresh();
    } else {
      setToken(undefined);
    }

    return authenticated;
  },

  async login(): Promise<void> {
    try {
      await keycloak.login({
        redirectUri: `${window.location.origin}/auth/callback`,
      });
    } catch (error) {
      console.error("Login failed", error);
    }
  },

  async logout(): Promise<void> {
    try {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      await keycloak.logout({
        redirectUri: window.location.origin + "/auth/logout",
      });
    } catch (error) {
      console.error("Logout failed", error);
    }
  },

  getRoles(): string[] {
    if (!keycloak.tokenParsed) {
      return [];
    }
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
    const resourceAccess = keycloak.tokenParsed.resource_access;
    if (!resourceAccess || !resourceAccess[clientId]) {
      return [];
    }
    return resourceAccess[clientId].roles || [];
  },

  isAuthenticated(): boolean {
    return keycloak.authenticated ?? false;
  },

  async getUserInfo() {
    if (keycloak.profile) {
      return keycloak.profile;
    }
    return await keycloak.loadUserProfile();
  },
};

export function loginProvider() {
  return providerInstance;
}
