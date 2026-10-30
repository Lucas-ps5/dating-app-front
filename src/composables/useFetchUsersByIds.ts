import { useQuery } from "@tanstack/react-query";
import { Users } from "@/api/users";

interface UseFetchUsersByIdsOptions {
  /**
   * Intervalle de rafraîchissement en ms (ex. 60_000 pour suivre la présence).
   * Désactivé par défaut.
   */
  refetchInterval?: number;
}

export const useFetchUsersByIds = (
  ids: string[],
  options: UseFetchUsersByIdsOptions = {},
) => {
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
    refetchInterval: options.refetchInterval,
  });
};
