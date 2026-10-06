import { useQuery } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useListSentLikes = (userId: string) => {
  return useQuery({
    queryKey: ["sent-likes", userId],
    queryFn: async () => {
      const { data, error } = await Likes.listSentLikes({
        path: { userId },
      });

      if (error) throw new Error("Error fetching sent likes");

      return data;
    },
    enabled: !!userId,
  });
};