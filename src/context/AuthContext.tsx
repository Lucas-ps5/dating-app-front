import { createContext } from "react";
import Keycloak from "keycloak-js";

export interface AuthContextType {
  keycloak: Keycloak | null;
  authenticated: boolean;
  loading: boolean;
  userInfo: Record<string, unknown> | null;
  login: Keycloak["login"];
  logout: Keycloak["logout"];
  token: string | undefined;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
