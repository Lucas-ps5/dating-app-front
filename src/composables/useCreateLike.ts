import { useMutation } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useCreateLike = () => {
  return useMutation({
    mutationFn: async (data: { receiverId: string; type: string }) => {
      const { data: result, error } = await Likes.createLike({
        body: {
          receiverId: data.receiverId,
          type: data.type as any,
        },
      });

      if (error) throw error;

      return result;
    },
  });
};