import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Conversations } from "@/api/chat";

export const useMarkMessagesAsRead = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await Conversations.markMessagesAsRead({
        path: { conversationId },
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      // Détail de la conversation (compteur de non-lus + statut des messages)
      queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
      // Liste des conversations (badge de non-lus)
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};