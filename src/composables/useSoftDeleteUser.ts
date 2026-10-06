import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";

export const useSoftDeleteUser = (username: string) => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await Users.softDeleteUser({
        path: { id: username },
      });

      if (error) throw error;

      return data;
    },
  });
};