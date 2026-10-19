import { useMutation } from "@tanstack/react-query";
import { Likes, SwipeType } from "@/api/matches";

export const useCreateLike = () => {
  return useMutation({
    mutationFn: async (data: { receiverId: string }) => {
      const { data: result, error } = await Likes.createLike({
        body: {
          receiverId: data.receiverId,
          type: SwipeType.LIKE,
        },
      });

      if (error) throw error;

      return result;
    },
  });
};
