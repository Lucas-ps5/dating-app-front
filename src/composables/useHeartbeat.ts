import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";
import type { PresenceState } from "@/api/users";

export const useHeartbeat = ({
  onSuccessAction,
  onErrorAction,
}: {
  onSuccessAction?: (data: PresenceState | undefined) => void;
  onErrorAction?: (error: unknown) => void;
} = {}) => {
  const { mutate, isPending, data } = useMutation({
    mutationFn: async () => {
      const { data, error } = await Users.heartbeatCurrentUser();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      onSuccessAction?.(data);
    },
    onError: (error) => {
      onErrorAction?.(error);
    },
  });

  return {
    heartbeat: mutate,
    isPending,
    data,
  };
};