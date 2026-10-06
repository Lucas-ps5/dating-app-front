import { useQuery } from "@tanstack/react-query";
import { Conversations } from "@/api/chat";

export const useGetMyConversations = () => {
  return useQuery({
    queryKey: ["my-conversations"],
    queryFn: async () => {
      const { data, error } = await Conversations.getMyConversations();

      if (error) throw new Error("Error fetching conversations");

      return data;
    },
  });
};