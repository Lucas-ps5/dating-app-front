import { useQuery } from "@tanstack/react-query";
import { Gender, Users } from "@/api/users";

export const useDiscoverUsers = (options?: {
  currentUserId: string;
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["users-discover", options],
    queryFn: async () => {
      const { data, error } = await Users.discoverUsers({
        query: {
          currentUserId: options?.currentUserId!,
          gender: options?.gender,
          ageMin: options?.ageMin,
          ageMax: options?.ageMax,
          page: options?.page,
          limit: options?.limit,
        },
      });

      if (error) throw new Error("Error discovering users");

      return data;
    },
    enabled: !!options?.currentUserId,
  });
};