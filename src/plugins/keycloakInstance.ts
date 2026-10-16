import Keycloak from "keycloak-js";

let keycloakInstance: Keycloak | null = null;

export const createKeycloakInstance = () => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    });
  }
  return keycloakInstance;
};

export const getKeycloak = () => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    });
  }
  return keycloakInstance;
};
