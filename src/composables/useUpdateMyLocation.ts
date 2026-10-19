import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";
import type {
  UpdateLocationRequest,
  UpdateLocationResponse,
} from "@/api/users";

export const useUpdateMyLocation = ({
  userId,
  onSuccessAction,
  onErrorAction,
}: {
  userId: string;
  onSuccessAction?: (data: UpdateLocationResponse | undefined) => void;
  onErrorAction?: (error: unknown) => void;
}) => {
  const { mutate, isPending, data } = useMutation({
    mutationFn: async (locationData: UpdateLocationRequest) => {
      const { data, error } = await Users.updateMyLocation({
        body: locationData,
        headers: {
          "x-user-id": userId,
        },
      });

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
    updateMyLocation: mutate,
    isPending,
    data,
  };
};
