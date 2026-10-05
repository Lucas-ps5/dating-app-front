import { useQuery } from "@tanstack/react-query";
import { Users } from "@/api/users";
import { FieldToExtractCodes } from "@/types/enums";

export const useFetchCurrentUser = () => {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data, error } = await Users.getCurrentUserProfile({
        query: {
          fieldToExtractCodes: FieldToExtractCodes.Code1,
        },
      });

      if (error) throw new Error("Error fetching current user");

      return data;
    },
  });
};
