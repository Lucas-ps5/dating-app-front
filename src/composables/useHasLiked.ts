import { Likes } from "@/api/matches";
import { useQuery } from "@tanstack/react-query";

export function useHasLiked(userId: string) {
  return useQuery({
    queryKey: ["has-liked", userId],
    queryFn: async () => {
      const { data, error } = await Likes.hasLiked({
        path: {
          userId,
        },
      });

      if (error) throw new Error("Error fetching has liked");

      return data;
    },
  });
}
