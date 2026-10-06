import { useMutation } from "@tanstack/react-query";
import { Conversations, MessageType } from "@/api/chat";

export const useSendMessage = () => {
  return useMutation({
    mutationFn: async (data: { receiverId: string; content: string; type?: MessageType }) => {
      const { data: result, error } = await Conversations.sendMessage({
        body: {
          receiverId: data.receiverId,
          content: data.content,
          type: data.type,
        },
      });

      if (error) throw error;

      return result;
    },
  });
};