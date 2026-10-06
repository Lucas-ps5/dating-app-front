import { useQuery } from "@tanstack/react-query";
import { Users } from "@/api/users";

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: ["user-by-id", userId],
    queryFn: async () => {
      const { data, error } = await Users.getUserById({
        path: { id: userId },
      });

      if (error) throw new Error("Error fetching user");

      return data;
    },
    enabled: !!userId,
  });
};