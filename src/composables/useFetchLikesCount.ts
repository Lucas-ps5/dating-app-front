import { useQuery } from "@tanstack/react-query"
import { Likes } from "@/api/matches";

export function useFetchLikesCount() {
    return useQuery({
        queryKey: ["likes-count"],
        queryFn: async () => {
            const { data, error } = await Likes.countReceivedLikes()

            if (error) throw new Error("Error fetching likes count");

            return data;
        },
    });
}
  