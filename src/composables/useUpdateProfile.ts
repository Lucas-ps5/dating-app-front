import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";
import type { UpdateUserRequest } from "@/api/users";

export const useUpdateProfile = ({
  id,
  onSuccessAction,
  onErrorAction,
}: {
  id: string;
  onSuccessAction: () => void;
  onErrorAction: (error: unknown) => void;
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: async (userData: UpdateUserRequest) => {
      const { data, error } = await Users.updateProfile({
        body: userData,
        path: { id }
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      onSuccessAction();
    },
    onError: (error) => {
      onErrorAction(error);
    },
  });

  return {
    updateProfile: mutate,
    isPending,
  };
};