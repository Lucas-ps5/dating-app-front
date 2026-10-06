import { useQuery } from "@tanstack/react-query";
import { Conversations } from "@/api/chat";

export const useGetConversationById = (conversationId: string) => {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await Conversations.getConversationById({
        path: { conversationId },
      });

      if (error) throw new Error("Error fetching conversation");

      return data;
    },
    enabled: !!conversationId,
  });
};