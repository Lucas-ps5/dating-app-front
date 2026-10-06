import { useMutation } from "@tanstack/react-query";
import { Conversations } from "@/api/chat";

export const useMarkMessagesAsRead = (conversationId: string) => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await Conversations.markMessagesAsRead({
        path: { conversationId },
      });

      if (error) throw error;

      return data;
    },
  });
};