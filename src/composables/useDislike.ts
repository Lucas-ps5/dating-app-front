import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Likes } from "@/api/matches";

export const useDislike = () => {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      // Le like reçu est retiré : le compteur du badge et la liste doivent suivre.
      queryClient.invalidateQueries({ queryKey: ["likes-count"] });
      queryClient.invalidateQueries({ queryKey: ["received-likes"] });
    },
  });
};
