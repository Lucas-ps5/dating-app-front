import { useQuery } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useListReceivedLikes = (userId: string) => {
  return useQuery({
    queryKey: ["received-likes", userId],
    queryFn: async () => {
      const { data, error } = await Likes.listReceivedLikes({
        path: { userId },
      });

      if (error) throw new Error("Error fetching received likes");

      return data;
    },
    enabled: !!userId,
  });
};