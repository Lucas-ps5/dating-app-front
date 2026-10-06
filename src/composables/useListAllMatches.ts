import { useQuery } from "@tanstack/react-query";
import { Matches } from "@/api/matches";

export const useListAllMatches = () => {
  return useQuery({
    queryKey: ["all-matches"],
    queryFn: async () => {
      const { data, error } = await Matches.listAllMatches();

      if (error) throw new Error("Error fetching matches");

      return data;
    },
  });
};