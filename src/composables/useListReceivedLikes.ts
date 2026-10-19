import { useQuery } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useListReceivedLikes = () => {

  return useQuery({
    queryKey: ["received-likes"],
    queryFn: async () => {
      const { data, error } = await Likes.listReceivedLikes();

      if (error) throw new Error("Error fetching received likes");

      return data;
    },
  });
};
