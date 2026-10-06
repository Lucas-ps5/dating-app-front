import { useQuery } from "@tanstack/react-query";
import { Matches } from "@/api/matches";

export const useGetMatch = (matchId: string) => {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const { data, error } = await Matches.getMatch({
        path: { id: matchId },
      });

      if (error) throw new Error("Error fetching match");

      return data;
    },
    enabled: !!matchId,
  });
};