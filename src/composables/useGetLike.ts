import { useQuery } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useGetLike = (likeId: string) => {
  return useQuery({
    queryKey: ["like", likeId],
    queryFn: async () => {
      const { data, error } = await Likes.getLike({
        path: { id: likeId },
      });

      if (error) throw new Error("Error fetching like");

      return data;
    },
    enabled: !!likeId,
  });
};