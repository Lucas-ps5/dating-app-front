import { useQuery } from "@tanstack/react-query";
import { Users } from "@/api/users";

export const useGetUserByUsername = (username: string) => {
  return useQuery({
    queryKey: ["user-by-username", username],
    queryFn: async () => {
      const { data, error } = await Users.getUserByUsername({
        path: { username },
      });

      if (error) throw new Error("Error fetching user");

      return data;
    },
    enabled: !!username,
  });
};