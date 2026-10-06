import { useQuery } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useFetchSentLikesCount = () => {
  return useQuery({
    queryKey: ["sent-likes-count"],
    queryFn: async () => {
      const { data, error } = await Likes.countSentLikes();

      if (error) throw new Error("Error fetching sent likes count");

      return data;
    },
  });
};