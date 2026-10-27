import { useMemo } from "react";
import { useGetMyConversations } from "./useGetMyConversations";
import { getOtherUserId } from "@/utils/methods";

export const useGetConversationByUserId = (
  userId: string | undefined,
  currentUserId: string | undefined,
) => {
  const { data: conversations } = useGetMyConversations();

  const conversation = useMemo(() => {
    if (!conversations || !userId || !currentUserId) return null;
    return (
      conversations.find(
        (conv) => getOtherUserId(conv, currentUserId) === userId,
      ) ?? null
    );
  }, [conversations, userId, currentUserId]);

  return { conversation, isLoading: !conversations };
};
