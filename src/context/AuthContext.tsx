import { createContext } from "react";

export interface AuthContextType {
  keycloak: any;
  authenticated: boolean;
  loading: boolean;
  userInfo: Record<string, unknown> | null;
  login: (options?: { redirectUri?: string }) => void;
  logout: (options?: { redirectUri?: string }) => void;
  token: string | undefined;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
