import { useQuery } from "@tanstack/react-query"
import { Matches } from "@/api/matches";

export const useFetchMatchsCount = () => {
    return useQuery({
        queryKey: ["matchs-count"],
        queryFn: async () => {
            const { data, error } = await Matches.countMyMatches()

            if (error) throw new Error("Error fetching matchs count");

            return data;
        },
    });
}
    