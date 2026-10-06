import { useMutation } from "@tanstack/react-query";
import { Users } from "@/api/users";
import type { AddPhotoUrlData } from "@/api/users";

export const useAddPhotoUrl = (keycloakId: string) => {
  return useMutation({
    mutationFn: async (photoUrl: AddPhotoUrlData) => {
      const { data, error } = await Users.addPhotoUrl({
        body: photoUrl,
      });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      console.log("Photo URL added successfully");
    },
    onError: (error) => {
      console.error("Failed to add photo URL:", error);
    },
  });
};