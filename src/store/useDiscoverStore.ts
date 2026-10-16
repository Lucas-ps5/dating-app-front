import { create } from "zustand";
import { Gender } from "@/api/users";

export type ViewMode = "grid" | "list";

export interface DiscoverState {
  gender?: Gender;
  ageMin: number;
  ageMax: number;
  page: number;
  limit: number;
  clientSearch: string;
  viewMode: ViewMode;
  currentUserLat?: number;
  currentUserLon?: number;

  // Actions
  setGender: (gender?: Gender) => void;
  setAgeRange: (ageMin: number, ageMax: number) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setClientSearch: (search: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCoordinates: (lat: number, lon: number) => void;
  removeFilter: (filterKey: "gender" | "age") => void;
  resetFilters: () => void;
}

export const DEFAULT_AGE_MIN = 18;
export const DEFAULT_AGE_MAX = 100;
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const useDiscoverStore = create<DiscoverState>((set) => ({
  gender: undefined,
  ageMin: DEFAULT_AGE_MIN,
  ageMax: DEFAULT_AGE_MAX,
  page: DEFAULT_PAGE,
  limit: DEFAULT_LIMIT,
  clientSearch: "",
  viewMode: "grid",
  currentUserLat: undefined,
  currentUserLon: undefined,

  setGender: (gender) =>
    set({
      gender,
      page: 1, // Reset pagination to page 1 on filter changes
    }),

  setAgeRange: (ageMin, ageMax) =>
    set({
      ageMin: Math.max(18, Math.min(ageMin, 100)),
      ageMax: Math.max(18, Math.min(ageMax, 100)),
      page: 1, // Reset pagination to page 1 on filter changes
    }),

  setPage: (page) =>
    set({
      page: Math.max(1, page),
    }),

  setLimit: (limit) =>
    set({
      limit: Math.max(1, Math.min(limit, 100)),
      page: 1, // Reset pagination on limit change
    }),

  setClientSearch: (clientSearch) =>
    set({
      clientSearch,
    }),

  setViewMode: (viewMode) =>
    set({
      viewMode,
    }),

  setCoordinates: (lat, lon) =>
    set({
      currentUserLat: lat,
      currentUserLon: lon,
      page: 1,
    }),

  removeFilter: (filterKey) =>
    set((state) => {
      if (filterKey === "gender") {
        return { gender: undefined, page: 1 };
      }
      if (filterKey === "age") {
        return { ageMin: DEFAULT_AGE_MIN, ageMax: DEFAULT_AGE_MAX, page: 1 };
      }
      return state;
    }),

  resetFilters: () =>
    set({
      gender: undefined,
      ageMin: DEFAULT_AGE_MIN,
      ageMax: DEFAULT_AGE_MAX,
      page: 1,
      clientSearch: "",
    }),
}));
