import { useQuery } from "@tanstack/react-query";
import { Matches } from "@/api/matches";

export const useListMatchesForUser = (userId: string) => {
  return useQuery({
    queryKey: ["matches-for-user", userId],
    queryFn: async () => {
      const { data, error } = await Matches.listMatchesForUser({
        path: { userId },
      });

      if (error) throw new Error("Error fetching matches");

      return data;
    },
    enabled: !!userId,
  });
};