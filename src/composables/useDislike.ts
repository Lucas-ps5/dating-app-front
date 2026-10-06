import { useMutation } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useDislike = () => {
  return useMutation({
    mutationFn: async (data: { receiverId: string }) => {
      const { data: result, error } = await Likes.dislike({
        body: {
          receiverId: data.receiverId,
        },
      });

      if (error) throw error;

      return result;
    },
  });
};