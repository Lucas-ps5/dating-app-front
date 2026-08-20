import { client as usersClient } from "@/api/users/client.gen";
import { client as chatClient } from "@/api/chat/client.gen";
import { client as mediaClient } from "@/api/media/client.gen";
import { client as matchesClient } from "@/api/matches/client.gen";

let token: string | undefined = undefined;
const baseURL = import.meta.env.VITE_REST_API_BASE_URL;

usersClient.instance.interceptors.request.use((config) => {
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.baseURL = baseURL + "/users";
  return config;
});

chatClient.instance.interceptors.request.use((config) => {
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.baseURL = baseURL + "/chat";
  return config;
});

mediaClient.instance.interceptors.request.use((config) => {
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.baseURL = baseURL + "/media";
  return config;
});

matchesClient.instance.interceptors.request.use((config) => {
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  config.baseURL = baseURL + "/matches";
  return config;
});

export const setToken = (newToken?: string) => {
  token = newToken;
};
