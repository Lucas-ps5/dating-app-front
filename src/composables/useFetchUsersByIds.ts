import { useQuery } from "@tanstack/react-query";
import { Users } from "@/api/users";

export const useFetchUsersByIds = (ids: string[]) => {
  return useQuery({
    queryKey: ["users-by-ids", ...ids],
    queryFn: async () => {
      const { data, error } = await Users.findUsersByIds({
        body: {
          userIds: ids,
        },
      });

      if (error) throw new Error("Error fetching users by ids");

      return data;
    },
  });
};
