import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Gender, Users } from "@/api/users";
import { getStoredCoordinates } from "@/utils/geolocation";

export type DiscoverUsersFilters = {
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
  currentUserLat?: number;
  currentUserLon?: number;
};

export const sanitizeFilters = (
  filters?: DiscoverUsersFilters,
): DiscoverUsersFilters => {
  if (!filters) return {};
  const sanitized: DiscoverUsersFilters = {};

  if (filters.gender === Gender.MALE || filters.gender === Gender.FEMALE) {
    sanitized.gender = filters.gender;
  }

  if (
    typeof filters.ageMin === "number" &&
    Number.isFinite(filters.ageMin) &&
    filters.ageMin >= 18
  ) {
    sanitized.ageMin = Math.floor(filters.ageMin);
  }

  if (
    typeof filters.ageMax === "number" &&
    Number.isFinite(filters.ageMax) &&
    filters.ageMax <= 100
  ) {
    sanitized.ageMax = Math.floor(filters.ageMax);
  }

  // Prevent invalid range where min > max
  if (
    sanitized.ageMin !== undefined &&
    sanitized.ageMax !== undefined &&
    sanitized.ageMin > sanitized.ageMax
  ) {
    delete sanitized.ageMin;
    delete sanitized.ageMax;
  }

  if (
    typeof filters.page === "number" &&
    Number.isFinite(filters.page) &&
    filters.page >= 1
  ) {
    sanitized.page = Math.floor(filters.page);
  }

  if (
    typeof filters.limit === "number" &&
    Number.isFinite(filters.limit) &&
    filters.limit >= 1 &&
    filters.limit <= 100
  ) {
    sanitized.limit = Math.floor(filters.limit);
  }

  // Coordinates - validate lat/lon ranges
  if (
    typeof filters.currentUserLat === "number" &&
    Number.isFinite(filters.currentUserLat) &&
    filters.currentUserLat >= -90 &&
    filters.currentUserLat <= 90
  ) {
    sanitized.currentUserLat = filters.currentUserLat;
  }

  if (
    typeof filters.currentUserLon === "number" &&
    Number.isFinite(filters.currentUserLon) &&
    filters.currentUserLon >= -180 &&
    filters.currentUserLon <= 180
  ) {
    sanitized.currentUserLon = filters.currentUserLon;
  }

  return sanitized;
};

export const usersKeys = {
  all: ["users"] as const,
  discover: (filters?: DiscoverUsersFilters) =>
    [...usersKeys.all, "discover", sanitizeFilters(filters)] as const,
};

export const useDiscoverUsers = (
  filters?: DiscoverUsersFilters,
  options?: { enabled?: boolean },
) => {
  // Merge stored coordinates if not explicitly provided
  const storedCoords = getStoredCoordinates();
  const mergedFilters: DiscoverUsersFilters = {
    ...filters,
    currentUserLat: filters?.currentUserLat ?? storedCoords?.latitude,
    currentUserLon: filters?.currentUserLon ?? storedCoords?.longitude,
  };

  const sanitizedFilters = sanitizeFilters(mergedFilters);

  // Disable query if coordinates are not available (API requires them)
  const hasCoordinates =
    sanitizedFilters.currentUserLat !== undefined &&
    sanitizedFilters.currentUserLon !== undefined;

  return useQuery({
    queryKey: usersKeys.discover(sanitizedFilters),
    queryFn: async ({ signal }) => {
      const { data, error } = await Users.discoverUsers({
        query: sanitizedFilters,
        signal,
      });

      if (error) throw error;

      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: hasCoordinates && (options?.enabled ?? true),
  });
};
