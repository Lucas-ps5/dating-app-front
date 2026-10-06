import { useQuery } from "@tanstack/react-query";
import { Matches } from "@/api/matches";

export const useDeleteMatch = (matchId: string) => {
  return useQuery({
    queryKey: ["delete-match", matchId],
    queryFn: async () => {
      const { data, error } = await Matches.deleteMatch({
        path: { id: matchId },
      });

      if (error) throw new Error("Error deleting match");

      return data;
    },
    enabled: !!matchId,
  });
};