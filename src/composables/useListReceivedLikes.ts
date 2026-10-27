import { useQuery } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useListReceivedLikes = (page: number = 1, limit: number = 12) => {
  return useQuery({
    queryKey: ["received-likes", page, limit],
    queryFn: async () => {
      const { data, error } = await Likes.listReceivedLikes({
        query: { page, limit },
      });

      if (error) throw new Error("Error fetching received likes");

      return data;
    },
  });
};
