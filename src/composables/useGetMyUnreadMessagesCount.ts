import { useQuery } from "@tanstack/react-query";
import { Conversations } from "@/api/chat";

export const useGetMyUnreadMessagesCount = () => {
  return useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: async () => {
      const { data, error } = await Conversations.getMyUnreadMessagesCount();

      if (error) throw new Error("Error fetching unread messages count");

      return data;
    },
  });
};