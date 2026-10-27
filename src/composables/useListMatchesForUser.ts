import { useQuery } from "@tanstack/react-query";
import { Matches } from "@/api/matches";

export const useListMatchesForUser = (page: number = 1, limit: number = 12) => {
  return useQuery({
    queryKey: ["matches-for-user", page, limit],
    queryFn: async () => {
      const { data, error } = await Matches.listMatchesForUser({
        query: { page, limit },
      });

      if (error) throw new Error("Error fetching matches");

      return data;
    },
  });
};
