import { client as usersClient } from "@/api/users/client.gen";
import { client as chatClient } from "@/api/chat/client.gen";
import { client as mediaClient } from "@/api/media/client.gen";
import { client as matchesClient } from "@/api/matches/client.gen";

let token: string | undefined = undefined;

const baseURL: string | undefined = import.meta.env.VITE_REST_API_BASE_URL;

// Set the correct baseURL on each client using hey-api's setConfig().
// NOTE: interceptors cannot override baseURL — hey-api calls buildUrl() before axios
// runs and passes `baseURL: ''` to axios, making interceptor overrides ineffective.
if (baseURL) {
  usersClient.setConfig({ baseURL: baseURL + "/user" });
  chatClient.setConfig({ baseURL: baseURL + "/chat" });
  mediaClient.setConfig({ baseURL: baseURL + "/media" });
  matchesClient.setConfig({ baseURL: baseURL + "/matches" });
}

// Interceptors are only used to inject the Authorization header dynamically
usersClient.instance.interceptors.request.use((config) => {
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

chatClient.instance.interceptors.request.use((config) => {
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

mediaClient.instance.interceptors.request.use((config) => {
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

matchesClient.instance.interceptors.request.use((config) => {
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export const setToken = (newToken?: string) => {
  token = newToken;
};
